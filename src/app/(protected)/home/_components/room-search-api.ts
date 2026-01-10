"use client";

/**
 * API Integration for Room Search
 * 
 * This file provides hooks and functions to fetch real data
 * from the booking APIs and map them to the UI format.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getAreasForBooking,
  getBuildingsByArea,
  getAvailableRooms,
  getRoomTypesForBooking,
} from "@/app/(protected)/booking/_actions/booking.actions";
import type {
  AreaOption,
  BuildingOption,
  RoomAvailability as APIRoomAvailability,
  BedAvailability as APIBedAvailability,
} from "@/app/(protected)/booking/_actions/booking.types";
import { AllowedOccupantType } from "@prisma/client";

// ========================================
// TYPES (UI Format - compatible with existing UI)
// ========================================

// RoomType info from database
export interface RoomTypeInfo {
  id: string;
  code: string;
  name: string;
}
export type RoomAllocation = "employee" | "all"; // employee = EMPLOYEE_ONLY, all = ALL (includes guests)
export type RoomGender = "male" | "female" | "mix" | "flexible";
export type RoomStatus = "available" | "partial" | "full" | "maintenance";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface Area {
  id: string;
  name: string;
  code: string;
}

export interface Building {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
}

// Per-day occupancy info for timeline
export interface BedOccupancyInfo {
  id: string;
  checkInDate: Date;
  checkOutDate: Date | null;
  status: string; // RESERVED, CHECKED_IN, etc.
  occupantName?: string;
}

// Pending booking request info for timeline
export interface BedPendingRequest {
  id: string;
  checkInDate: Date;
  checkOutDate: Date;
  bookingCode: string;
  bookingId: string;
}

export interface BedAvailability {
  id: string;
  code: string;
  status: BedStatus;
  hasPendingRequest?: boolean;
  // For display in current view
  occupantName?: string;
  occupantCheckIn?: Date;
  occupantCheckOut?: Date;
  reservedFrom?: Date;
  reservedTo?: Date;
  // For per-day timeline rendering
  occupancies: BedOccupancyInfo[];
  pendingRequests: BedPendingRequest[];
}

export interface RoomAvailability {
  id: string;
  code: string;
  buildingId: string;
  buildingName: string;
  areaId: string;
  areaName: string;
  floor: number;
  roomType: RoomTypeInfo; // Full room type info from database
  allocation: RoomAllocation;
  gender: RoomGender;
  capacity: number;
  availableBeds: number;
  status: RoomStatus;
  beds: BedAvailability[];
  facilities: string[];
  images: string[];
}

// Room type item from database
export interface RoomTypeItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

// ROOM_TYPES removed - use useRoomTypes() hook for dynamic data from database

// ========================================
// MAPPERS (API → UI Format)
// ========================================

function mapGenderPolicy(policy: string): RoomGender {
  switch (policy) {
    case "MALE_ONLY":
      return "male";
    case "FEMALE_ONLY":
      return "female";
    case "MIX":
      return "mix";
    case "FLEXIBLE":
    default:
      return "flexible";
  }
}

// mapRoomType removed - now using full roomType object from database

function mapAllowedOccupantType(type: AllowedOccupantType): RoomAllocation {
  return type === AllowedOccupantType.EMPLOYEE_ONLY ? "employee" : "all";
}

function mapBedStatus(bed: APIBedAvailability): BedStatus {
  // Status is now calculated from occupancies and availability flags
  // (BedStatus enum was removed from database)
  if (!bed.isAvailable) {
    // Check if occupied or reserved based on occupancies
    const hasCheckedIn = bed.occupancies.some(
      (o) => o.status === "CHECKED_IN"
    );
    return hasCheckedIn ? "occupied" : "reserved";
  }
  // Check for pending booking requests (not yet approved)
  if (bed.hasPendingRequest) {
    return "reserved"; // Show as reserved (pending approval)
  }
  return "available";
}

function mapRoomStatus(
  capacity: number,
  availableBeds: number,
  hasMaintenance: boolean
): RoomStatus {
  if (hasMaintenance) return "maintenance";
  if (availableBeds === 0) return "full";
  if (availableBeds < capacity) return "partial";
  return "available";
}

function mapAPIToUIRoom(room: APIRoomAvailability): RoomAvailability {
  // Maintenance is now at room level (room.status === "MAINTENANCE")
  const isRoomMaintenance = room.status === "MAINTENANCE";

  const beds: BedAvailability[] = room.beds.map((bed) => {
    const status = mapBedStatus(bed);
    const currentOccupancy = bed.occupancies[0]; // Most recent for display

    return {
      id: bed.id,
      code: bed.code,
      status,
      hasPendingRequest: bed.hasPendingRequest,
      // For current display
      occupantName:
        status === "occupied" || status === "reserved"
          ? currentOccupancy?.occupantName
          : undefined,
      occupantCheckIn:
        (status === "occupied" || status === "reserved") && currentOccupancy?.checkInDate
          ? new Date(currentOccupancy.checkInDate)
          : undefined,
      occupantCheckOut:
        currentOccupancy?.checkOutDate
          ? new Date(currentOccupancy.checkOutDate)
          : undefined,
      reservedFrom:
        status === "reserved" && currentOccupancy
          ? new Date(currentOccupancy.checkInDate)
          : undefined,
      reservedTo:
        status === "reserved" && currentOccupancy?.checkOutDate
          ? new Date(currentOccupancy.checkOutDate)
          : undefined,
      // For per-day timeline rendering
      occupancies: bed.occupancies.map((occ) => ({
        id: occ.id,
        checkInDate: new Date(occ.checkInDate),
        checkOutDate: occ.checkOutDate ? new Date(occ.checkOutDate) : null,
        status: occ.status,
        occupantName: occ.occupantName,
      })),
      pendingRequests: bed.pendingRequests.map((pr) => ({
        id: pr.id,
        checkInDate: new Date(pr.checkInDate),
        checkOutDate: new Date(pr.checkOutDate),
        bookingCode: pr.bookingCode,
        bookingId: pr.bookingId,
      })),
    };
  });

  return {
    id: room.id,
    code: room.code,
    buildingId: room.building.id,
    buildingName: room.building.name,
    areaId: room.area.id,
    areaName: room.area.name,
    floor: room.floor,
    roomType: {
      id: room.roomType.id,
      code: room.roomType.code,
      name: room.roomType.name,
    },
    allocation: mapAllowedOccupantType(room.allowedOccupantType),
    gender: mapGenderPolicy(room.genderPolicy),
    capacity: room.capacity,
    availableBeds: room.availableBeds,
    status: mapRoomStatus(room.capacity, room.availableBeds, isRoomMaintenance),
    beds,
    facilities: room.facilities,
    images: room.images.map((img) => img.filePath),
  };
}

// ========================================
// HOOKS
// ========================================

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      const result = await getAreasForBooking();
      if (result.success) {
        setAreas(
          result.data.map((a: AreaOption) => ({
            id: a.id,
            name: a.name,
            code: a.code,
          }))
        );
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
    fetch();
  }, []);

  return { areas, isLoading, error };
}

export function useRoomTypes() {
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      const result = await getRoomTypesForBooking();
      if (result.success) {
        setRoomTypes(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
    fetch();
  }, []);

  return { roomTypes, isLoading, error };
}

export function useBuildings(areaId: string | undefined) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAreaId, setLastAreaId] = useState<string | undefined>(undefined);

  // Reset buildings when areaId changes (using derived state pattern)
  const shouldReset = areaId !== lastAreaId;
  if (shouldReset) {
    setLastAreaId(areaId);
    if (buildings.length > 0) {
      setBuildings([]);
    }
  }

  useEffect(() => {
    if (!areaId) return;

    let cancelled = false;

    async function fetchBuildings() {
      setIsLoading(true);
      const result = await getBuildingsByArea(areaId!);
      if (!cancelled && result.success) {
        setBuildings(
          result.data.map((b: BuildingOption) => ({
            id: b.id,
            name: b.name,
            areaId: b.areaId,
            areaName: "",
          }))
        );
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    
    fetchBuildings();

    return () => {
      cancelled = true;
    };
  }, [areaId]);

  return { buildings, isLoading };
}

export function useRoomAvailability() {
  const [rooms, setRooms] = useState<RoomAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRooms = useCallback(
    async (params: {
      areaId: string;
      buildingId?: string;
      checkInDate: Date;
      checkOutDate: Date;
      roomTypeIds?: string[];
      includeFullRooms?: boolean;
    }) => {
      setIsLoading(true);
      setError(null);

      const result = await getAvailableRooms({
        areaId: params.areaId,
        buildingId: params.buildingId,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        roomTypeIds: params.roomTypeIds,
        includeFullRooms: params.includeFullRooms,
      });

      if (result.success) {
        setRooms(result.data.map(mapAPIToUIRoom));
      } else {
        setError(result.error);
        setRooms([]);
      }

      setIsLoading(false);
      return result.success;
    },
    []
  );

  const filterRooms = useCallback(
    (filters: {
      buildingId?: string;
      roomTypeCode?: string;
      onlyAvailable?: boolean;
    }) => {
      return rooms.filter((room) => {
        if (
          filters.buildingId &&
          filters.buildingId !== "all" &&
          room.buildingId !== filters.buildingId
        )
          return false;
        if (filters.roomTypeCode && room.roomType.code !== filters.roomTypeCode) return false;
        if (filters.onlyAvailable && room.availableBeds === 0) return false;
        return true;
      });
    },
    [rooms]
  );

  return { rooms, isLoading, error, searchRooms, filterRooms };
}

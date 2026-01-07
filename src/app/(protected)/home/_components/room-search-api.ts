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
} from "@/app/(protected)/booking/_actions/booking.actions";
import type {
  AreaOption,
  BuildingOption,
  RoomAvailability as APIRoomAvailability,
  BedAvailability as APIBedAvailability,
} from "@/app/(protected)/booking/_actions/booking.types";

// ========================================
// TYPES (UI Format - compatible with existing UI)
// ========================================

export type RoomType = "standard" | "vip" | "vvip";
export type RoomAllocation = "employee" | "guest";
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

export interface BedAvailability {
  id: string;
  code: string;
  status: BedStatus;
  hasPendingRequest?: boolean; // Bed has pending booking request
  occupantName?: string;
  occupantCheckIn?: Date;
  occupantCheckOut?: Date;
  reservedFrom?: Date;
  reservedTo?: Date;
}

export interface RoomAvailability {
  id: string;
  code: string;
  buildingId: string;
  buildingName: string;
  areaId: string;
  areaName: string;
  floor: number;
  type: RoomType;
  allocation: "employee" | "guest";
  gender: RoomGender;
  capacity: number;
  availableBeds: number;
  status: RoomStatus;
  beds: BedAvailability[];
  facilities: string[];
  images: string[];
}

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
];

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

function mapRoomType(typeCode: string): RoomType {
  const lower = typeCode.toLowerCase();
  if (lower.includes("vvip")) return "vvip";
  if (lower.includes("vip")) return "vip";
  return "standard";
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
  // BedStatus was removed from database
  const isRoomMaintenance = room.status === "MAINTENANCE";

  const beds: BedAvailability[] = room.beds.map((bed) => {
    const status = mapBedStatus(bed);
    const currentOccupancy = bed.occupancies[0]; // Most recent

    return {
      id: bed.id,
      code: bed.code,
      status,
      hasPendingRequest: bed.hasPendingRequest, // Pass pending request flag
      occupantName:
        status === "occupied" || status === "reserved"
          ? currentOccupancy?.occupantName
          : undefined,
      occupantCheckIn:
        currentOccupancy?.checkInDate
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
    type: mapRoomType(room.roomType.code),
    allocation: "employee", // Default, can be extended
    gender: mapGenderPolicy(room.genderPolicy),
    capacity: room.capacity,
    availableBeds: room.availableBeds,
    status: mapRoomStatus(room.capacity, room.availableBeds, isRoomMaintenance),
    beds,
    facilities: room.facilities,
    images:
      room.images.length > 0
        ? room.images.map((img) => img.filePath)
        : [
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
          ],
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
    }) => {
      setIsLoading(true);
      setError(null);

      const result = await getAvailableRooms({
        areaId: params.areaId,
        buildingId: params.buildingId,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        roomTypeIds: params.roomTypeIds,
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
      type?: RoomType;
      onlyAvailable?: boolean;
    }) => {
      return rooms.filter((room) => {
        if (
          filters.buildingId &&
          filters.buildingId !== "all" &&
          room.buildingId !== filters.buildingId
        )
          return false;
        if (filters.type && room.type !== filters.type) return false;
        if (filters.onlyAvailable && room.availableBeds === 0) return false;
        return true;
      });
    },
    [rooms]
  );

  return { rooms, isLoading, error, searchRooms, filterRooms };
}

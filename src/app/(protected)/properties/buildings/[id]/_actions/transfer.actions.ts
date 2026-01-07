"use server";

import { prisma } from "@/lib/db";

// ========================================
// TYPES FOR TRANSFER
// ========================================

export interface BuildingOption {
  id: string;
  code: string;
  name: string;
  availableBeds: number;
}

export interface RoomOption {
  id: string;
  code: string;
  name: string;
  floorNumber: number;
  genderPolicy: string;
  currentGender: string | null;
  roomTypeName: string;
  totalBeds: number;
  availableBeds: number;
}

export interface BedOption {
  id: string;
  code: string;
  label: string;
  status: string;
  availableUntil: Date | null; // null = tersedia tidak terbatas
  hasUpcomingReservation: boolean;
  nextReservationStart: Date | null;
  nextReservationOccupant: string | null;
}

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// GET BUILDINGS IN SAME AREA
// ========================================

export async function getBuildingsInArea(
  currentBedId: string
): Promise<ActionResponse<BuildingOption[]>> {
  try {
    // Get current bed's area
    const currentBed = await prisma.bed.findUnique({
      where: { id: currentBedId },
      select: {
        room: {
          select: {
            building: { select: { areaId: true } },
          },
        },
      },
    });

    if (!currentBed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    const areaId = currentBed.room.building.areaId;

    // Get all buildings in area with available bed count (exclude deleted)
    const buildings = await prisma.building.findMany({
      where: {
        areaId: areaId,
        status: true,
        deletedAt: null,
      },
      include: {
        rooms: {
          where: { status: "ACTIVE", deletedAt: null },
          include: {
            beds: {
              where: {
                deletedAt: null,
                occupancies: {
                  none: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
                },
              },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result: BuildingOption[] = buildings.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      availableBeds: b.rooms.reduce((sum: number, r) => sum + r.beds.length, 0),
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("[GET_BUILDINGS_IN_AREA_ERROR]", error);
    return { success: false, error: "Gagal mengambil data gedung" };
  }
}

// ========================================
// GET ROOMS WITH AVAILABILITY
// ========================================

export async function getRoomsWithAvailability(
  buildingId: string,
  occupantGender: "MALE" | "FEMALE"
): Promise<ActionResponse<RoomOption[]>> {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        buildingId,
        status: "ACTIVE",
        deletedAt: null,
        // Filter by gender policy
        OR: [
          { genderPolicy: "MIX" },
          { genderPolicy: occupantGender === "MALE" ? "MALE_ONLY" : "FEMALE_ONLY" },
          {
            genderPolicy: "FLEXIBLE",
            OR: [
              { currentGender: null },
              { currentGender: occupantGender },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        floorNumber: true,
        genderPolicy: true,
        currentGender: true,
        roomType: { select: { name: true } },
        beds: {
          where: { deletedAt: null },
          select: {
            id: true,
            occupancies: {
              where: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ floorNumber: "asc" }, { code: "asc" }],
    });

    const result: RoomOption[] = rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      floorNumber: r.floorNumber,
      genderPolicy: r.genderPolicy,
      currentGender: r.currentGender,
      roomTypeName: r.roomType.name,
      totalBeds: r.beds.length,
      availableBeds: r.beds.filter((b) => b.occupancies.length === 0).length,
    }));

    // Only return rooms with available beds
    return { success: true, data: result.filter((r) => r.availableBeds > 0) };
  } catch (error) {
    console.error("[GET_ROOMS_WITH_AVAILABILITY_ERROR]", error);
    return { success: false, error: "Gagal mengambil data ruangan" };
  }
}

// ========================================
// GET BEDS WITH RESERVATION INFO
// ========================================

export async function getBedsWithReservations(
  roomId: string,
  excludeBedId?: string
): Promise<ActionResponse<BedOption[]>> {
  try {
    const beds = await prisma.bed.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(excludeBedId ? { id: { not: excludeBedId } } : {}),
      },
      select: {
        id: true,
        code: true,
        label: true,

        occupancies: {
          where: {
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
          },
          orderBy: { checkInDate: "asc" },
          select: {
            id: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            occupant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: BedOption[] = beds.map((bed) => {
      // Find current or upcoming occupancy
      const activeOccupancy = bed.occupancies.find(
        (o) => o.status === "CHECKED_IN"
      );
      const upcomingReservation = bed.occupancies.find(
        (o) =>
          (o.status === "RESERVED" || o.status === "PENDING") &&
          new Date(o.checkInDate) >= today
      );

      // Determine availability
      let availableUntil: Date | null = null;
      let hasUpcomingReservation = false;
      let nextReservationStart: Date | null = null;
      let nextReservationOccupant: string | null = null;

      if (!activeOccupancy) {
        if (upcomingReservation) {
          hasUpcomingReservation = true;
          nextReservationStart = upcomingReservation.checkInDate;
          nextReservationOccupant = upcomingReservation.occupant.name;
          // Available until the day before reservation starts
          const until = new Date(upcomingReservation.checkInDate);
          until.setDate(until.getDate() - 1);
          availableUntil = until;
        }
        // else: availableUntil = null means indefinitely available
      } else if (activeOccupancy) {
        // Bed is occupied, show when it will be available
        const checkoutDate = activeOccupancy.checkOutDate;
        // If null or far future (year 2099), treat as indefinite
        if (!checkoutDate || checkoutDate.getFullYear() >= 2099) {
          availableUntil = null; // indefinite
        } else {
          availableUntil = checkoutDate;
        }
      }

      return {
        id: bed.id,
        code: bed.code,
        label: bed.label,
        status: activeOccupancy ? activeOccupancy.status : "AVAILABLE",
        availableUntil,
        hasUpcomingReservation,
        nextReservationStart,
        nextReservationOccupant,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[GET_BEDS_WITH_RESERVATIONS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data bed" };
  }
}

// ========================================
// VALIDATE TRANSFER DATES
// ========================================

export async function validateTransferDates(
  targetBedId: string,
  startDate: Date,
  endDate: Date | null
): Promise<ActionResponse<{ valid: boolean; message?: string }>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check start date is not in the past
    if (startDate < today) {
      return {
        success: true,
        data: { valid: false, message: "Tanggal mulai tidak boleh di masa lalu" },
      };
    }

    // Get target bed's reservations
    // Get target bed's reservations
    const bed = await prisma.bed.findUnique({
      where: { id: targetBedId },
      select: {
        occupancies: {
          where: {
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            OR: [{ checkOutDate: null }, { checkOutDate: { gte: today } }],
          },
          orderBy: { checkInDate: "asc" },
          select: {
            checkInDate: true,
            checkOutDate: true,
            occupant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      return { success: true, data: { valid: false, message: "Bed tidak ditemukan" } };
    }



    // Check for conflicts with upcoming reservations
    for (const reservation of bed.occupancies) {
      const resStart = new Date(reservation.checkInDate);

      // If there's an end date, check if it conflicts
      if (endDate) {
        if (startDate < resStart && endDate > resStart) {
          return {
            success: true,
            data: {
              valid: false,
              message: `Tanggal berakhir harus sebelum ${resStart.toLocaleDateString("id-ID")} (reservasi ${reservation.occupant.name})`,
            },
          };
        }
      } else {
        // No end date = indefinite, must be before any reservation
        if (startDate < resStart) {
          return {
            success: true,
            data: {
              valid: false,
              message: `Tidak bisa transfer tanpa tanggal berakhir karena ada reservasi mulai ${resStart.toLocaleDateString("id-ID")}`,
            },
          };
        }
      }
    }

    return { success: true, data: { valid: true } };
  } catch (error) {
    console.error("[VALIDATE_TRANSFER_DATES_ERROR]", error);
    return { success: false, error: "Gagal validasi tanggal" };
  }
}

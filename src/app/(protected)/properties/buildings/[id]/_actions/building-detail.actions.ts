"use server";

import { prisma } from "@/lib/db";
import {
  ActionResponse,
  BuildingDetailData,
  BuildingStatsData,
  FloorWithRooms,
  RoomData,
} from "./building-detail.schema";
import { BuildingImage } from "./gallery.types";

// ========================================
// GET BUILDING DETAIL
// ========================================

export async function getBuildingDetail(
  id: string
): Promise<ActionResponse<BuildingDetailData>> {
  try {
    const building = await prisma.building.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        area: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
        buildingType: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            images: true,
            userBuildings: true,
          },
        },
      },
    });

    if (!building) {
      return {
        success: false,
        error: "Gedung tidak ditemukan",
      };
    }

    return { success: true, data: building };
  } catch (error) {
    console.error("[GET_BUILDING_DETAIL_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil detail gedung",
    };
  }
}

// ========================================
// GET BUILDING STATS
// ========================================

export async function getBuildingStats(
  id: string
): Promise<ActionResponse<BuildingStatsData>> {
  try {
    // Get building basic info
    const building = await prisma.building.findUnique({
      where: { id },
      select: {
        status: true,
        _count: {
          select: {
            rooms: true,
            images: true,
            userBuildings: true,
          },
        },
      },
    });

    if (!building) {
      return {
        success: false,
        error: "Gedung tidak ditemukan",
      };
    }

    // Get bed statistics (exclude deleted)
    // Get beds with occupancies and pending requests to calculate stats
    const beds = await prisma.bed.findMany({
      where: {
        deletedAt: null,
        room: {
          buildingId: id,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        room: { select: { status: true } },
        occupancies: {
          where: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
          select: { status: true },
        },
        requestItems: {
          where: {
            booking: { status: "PENDING" },
          },
          select: { id: true },
        },
      },
    });

    // Calculate bed counts
    const totalBeds = beds.length;
    let bedsAvailable = 0;
    let bedsOccupied = 0;
    let bedsReserved = 0;
    let bedsMaintenance = 0;
    let bedsPendingRequest = 0;

    beds.forEach((bed) => {
      // Check room maintenance first (maintenance is now room-level)
      if (bed.room.status === "MAINTENANCE") {
        bedsMaintenance++;
        return;
      }

      const activeOccupancy = bed.occupancies[0]; // Assuming one active occupancy per bed
      const hasPendingRequest = bed.requestItems.length > 0;
      
      if (!activeOccupancy) {
        if (hasPendingRequest) {
          bedsPendingRequest++;
        } else {
          bedsAvailable++;
        }
      } else if (activeOccupancy.status === "CHECKED_IN") {
        bedsOccupied++;
      } else {
        bedsReserved++;
      }
    });

    const occupancyRate =
      totalBeds > 0 ? Math.round((bedsOccupied / totalBeds) * 100) : 0;

    return {
      success: true,
      data: {
        totalRooms: building._count.rooms,
        totalBeds,
        bedsAvailable,
        bedsOccupied,
        bedsReserved,
        bedsMaintenance,
        bedsPendingRequest,
        totalImages: building._count.images,
        totalPIC: building._count.userBuildings,
        occupancyRate,
        status: building.status,
      },
    };
  } catch (error) {
    console.error("[GET_BUILDING_STATS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil statistik gedung",
    };
  }
}

// ========================================
// GET ROOMS GROUPED BY FLOOR
// ========================================

export async function getRoomsGroupedByFloor(
  buildingId: string
): Promise<ActionResponse<FloorWithRooms[]>> {
  try {
    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { id: true },
    });

    if (!building) {
      return {
        success: false,
        error: "Gedung tidak ditemukan",
      };
    }

    // Get all rooms with beds, ordered by floor and code (exclude deleted)
    const rooms = await prisma.room.findMany({
      where: { buildingId, deletedAt: null },
      orderBy: [{ floorNumber: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        floorNumber: true,

        description: true,
        allowedOccupantType: true,
        isBookable: true,
        genderPolicy: true,
        currentGender: true,
        pricePerBed: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roomType: {
          select: {
            id: true,
            code: true,
            name: true,
            bedsPerRoom: true,
            defaultBedType: true,
          },
        },

        beds: {
          where: { deletedAt: null },
          orderBy: { position: "asc" },
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
            bedType: true,
            notes: true,
            occupancies: {
              where: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
              select: { status: true, checkInDate: true },
            },
            requestItems: {
              where: {
                booking: { status: "PENDING" },
              },
              select: { id: true, bookingId: true },
            },
          },
        },
      },
    });

    // Group rooms by floor
    const floorsMap = new Map<number, FloorWithRooms>();

    rooms.forEach((room) => {
      const floorNumber = room.floorNumber;
      const roomData: RoomData = {
        ...room,
        pricePerBed: room.pricePerBed ? Number(room.pricePerBed) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beds: room.beds as any,
      };

      if (!floorsMap.has(floorNumber)) {
        floorsMap.set(floorNumber, {
          floorNumber,

          rooms: [],
          stats: {
            totalRooms: 0,
            totalBeds: 0,
            bedsAvailable: 0,
            bedsOccupied: 0,
          },
        });
      }

      const floor = floorsMap.get(floorNumber)!;
      floor.rooms.push(roomData);
      floor.stats.totalRooms++;
      floor.stats.totalBeds += room.beds.length;

      // Count bed statuses
      room.beds.forEach((bed) => {
        const activeOccupancy = bed.occupancies[0];
        if (!activeOccupancy) {
          floor.stats.bedsAvailable++;
        } else if (activeOccupancy.status === "CHECKED_IN") {
          floor.stats.bedsOccupied++;
        }
      });
    });

    // Convert map to sorted array
    const floors = Array.from(floorsMap.values()).sort(
      (a, b) => a.floorNumber - b.floorNumber
    );

    return { success: true, data: floors };
  } catch (error) {
    console.error("[GET_ROOMS_GROUPED_BY_FLOOR_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data ruangan",
    };
  }
}

// ========================================
// GET ROOM TYPES FOR SELECT
// ========================================

export async function getRoomTypesForSelect(): Promise<
  ActionResponse<{ id: string; code: string; name: string; bedsPerRoom: number }[]>
> {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        bedsPerRoom: true,
      },
    });

    return { success: true, data: roomTypes };
  } catch (error) {
    console.error("[GET_ROOM_TYPES_FOR_SELECT_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe ruangan",
    };
  }
}

// ========================================
// GET ALL BUILDING PAGE DATA (OPTIMIZED)
// ========================================

export interface BuildingPageData {
  detail: BuildingDetailData;
  stats: BuildingStatsData;
  floors: FloorWithRooms[];
  images: BuildingImage[];
}

/**
 * Fetches all building page data in a single call.
 * Uses Promise.all for parallel database queries.
 * This should be called from the Server Component (page.tsx).
 */
export async function getAllBuildingPageData(
  id: string
): Promise<ActionResponse<BuildingPageData>> {
  try {
    // First, check if building exists and get detail
    const building = await prisma.building.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        area: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
        buildingType: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            images: true,
            userBuildings: true,
          },
        },
      },
    });

    if (!building) {
      return {
        success: false,
        error: "Gedung tidak ditemukan",
      };
    }

    // Fetch stats and floors in parallel
    const [beds, rooms, images] = await Promise.all([
      // Bed data for statistics (manual calculation)
      prisma.bed.findMany({
        where: {
          deletedAt: null,
          room: {
            buildingId: id,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          room: { select: { status: true } },
          occupancies: {
            where: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
            select: { status: true },
          },
          requestItems: {
            where: {
              booking: { status: "PENDING" },
            },
            select: { id: true },
          },
        },
      }),
      // Rooms with beds (exclude deleted)
      prisma.room.findMany({
        where: { buildingId: id, deletedAt: null },
        orderBy: [{ floorNumber: "asc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          floorNumber: true,
          description: true,
          allowedOccupantType: true,
          isBookable: true,
          genderPolicy: true,
          currentGender: true,
          pricePerBed: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          roomType: {
            select: {
              id: true,
              code: true,
              name: true,
              bedsPerRoom: true,
              defaultBedType: true,
            },
          },

          beds: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
            select: {
              id: true,
              code: true,
              label: true,
              position: true,
              bedType: true,
              notes: true,
              occupancies: {
                where: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
                select: { status: true, checkInDate: true },
              },
              requestItems: {
                where: {
                  booking: { status: "PENDING" },
                },
                select: { id: true, bookingId: true },
              },
            },
          },
        },
      }),
      // Images
      prisma.buildingImage.findMany({
        where: { buildingId: id },
        orderBy: [
          { isPrimary: "desc" },
          { order: "asc" },
          { createdAt: "desc" },
        ],
      }),
    ]);

    // Calculate bed stats
    const totalBeds = beds.length;
    let bedsAvailable = 0;
    let bedsOccupied = 0;
    let bedsReserved = 0;
    let bedsMaintenance = 0;
    let bedsPendingRequest = 0;

    beds.forEach((bed) => {
      // Check room maintenance first
      if (bed.room.status === "MAINTENANCE") {
        bedsMaintenance++;
        return;
      }

      const activeOccupancy = bed.occupancies[0];
      const hasPendingRequest = bed.requestItems.length > 0;
      
      if (!activeOccupancy) {
        if (hasPendingRequest) {
          bedsPendingRequest++;
        } else {
          bedsAvailable++;
        }
      } else if (activeOccupancy.status === "CHECKED_IN") {
        bedsOccupied++;
      } else {
        bedsReserved++;
      }
    });

    const occupancyRate =
      totalBeds > 0 ? Math.round((bedsOccupied / totalBeds) * 100) : 0;

    const stats: BuildingStatsData = {
      totalRooms: building._count.rooms,
      totalBeds,
      bedsAvailable,
      bedsOccupied,
      bedsReserved,
      bedsMaintenance,
      bedsPendingRequest,
      totalImages: building._count.images,
      totalPIC: building._count.userBuildings,
      occupancyRate,
      status: building.status,
    };

    // Group rooms by floor
    const floorsMap = new Map<number, FloorWithRooms>();

    rooms.forEach((room) => {
      const floorNumber = room.floorNumber;
      
      const roomData: RoomData = {
        ...room,
        pricePerBed: room.pricePerBed ? Number(room.pricePerBed) : null,
        // Explicitly format beds if needed, but simple assignment should work if types match
        // Ensuring beds are included
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beds: room.beds as any, // Temporary cast to suppress type strictness if necessary or fix the interface match
      };

      if (!floorsMap.has(floorNumber)) {
        floorsMap.set(floorNumber, {
          floorNumber,
          rooms: [],
          stats: {
            totalRooms: 0,
            totalBeds: 0,
            bedsAvailable: 0,
            bedsOccupied: 0,
          },
        });
      }

      const floor = floorsMap.get(floorNumber)!;
      floor.rooms.push(roomData);
      floor.stats.totalRooms++;
      floor.stats.totalBeds += room.beds.length;

      room.beds.forEach((bed) => {
        const activeOccupancy = bed.occupancies[0];
        if (!activeOccupancy) {
          floor.stats.bedsAvailable++;
        } else if (activeOccupancy.status === "CHECKED_IN") {
          floor.stats.bedsOccupied++;
        }
      });
    });

    const floors = Array.from(floorsMap.values()).sort(
      (a, b) => a.floorNumber - b.floorNumber
    );

    return {
      success: true,
      data: {
        detail: building,
        stats,
        floors,
        images,
      },
    };
  } catch (error) {
    console.error("[GET_ALL_BUILDING_PAGE_DATA_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data gedung",
    };
  }
}


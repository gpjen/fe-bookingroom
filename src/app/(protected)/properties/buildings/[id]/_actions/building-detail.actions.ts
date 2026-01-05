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
    const bedStats = await prisma.bed.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        room: {
          buildingId: id,
          deletedAt: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // Calculate bed counts
    let totalBeds = 0;
    let bedsAvailable = 0;
    let bedsOccupied = 0;
    let bedsReserved = 0;
    let bedsMaintenance = 0;

    bedStats.forEach((stat) => {
      totalBeds += stat._count.id;
      switch (stat.status) {
        case "AVAILABLE":
          bedsAvailable = stat._count.id;
          break;
        case "OCCUPIED":
          bedsOccupied = stat._count.id;
          break;
        case "RESERVED":
          bedsReserved = stat._count.id;
          break;
        case "MAINTENANCE":
        case "BLOCKED":
          bedsMaintenance += stat._count.id;
          break;
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
        floorName: true,
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
            status: true,
            notes: true,
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
      };

      if (!floorsMap.has(floorNumber)) {
        floorsMap.set(floorNumber, {
          floorNumber,
          floorName: room.floorName,
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
        if (bed.status === "AVAILABLE") {
          floor.stats.bedsAvailable++;
        } else if (bed.status === "OCCUPIED") {
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
    const [bedStats, rooms, images] = await Promise.all([
      // Bed statistics (exclude deleted)
      prisma.bed.groupBy({
        by: ["status"],
        where: {
          deletedAt: null,
          room: {
            buildingId: id,
            deletedAt: null,
          },
        },
        _count: {
          id: true,
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
          floorName: true,
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
              status: true,
              notes: true,
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
    let totalBeds = 0;
    let bedsAvailable = 0;
    let bedsOccupied = 0;
    let bedsReserved = 0;
    let bedsMaintenance = 0;

    bedStats.forEach((stat) => {
      totalBeds += stat._count.id;
      switch (stat.status) {
        case "AVAILABLE":
          bedsAvailable = stat._count.id;
          break;
        case "OCCUPIED":
          bedsOccupied = stat._count.id;
          break;
        case "RESERVED":
          bedsReserved = stat._count.id;
          break;
        case "MAINTENANCE":
        case "BLOCKED":
          bedsMaintenance += stat._count.id;
          break;
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
      };

      if (!floorsMap.has(floorNumber)) {
        floorsMap.set(floorNumber, {
          floorNumber,
          floorName: room.floorName,
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
        if (bed.status === "AVAILABLE") {
          floor.stats.bedsAvailable++;
        } else if (bed.status === "OCCUPIED") {
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


"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  ActionResponse,
  BuildingFormInput,
  BuildingWithRelations,
  AreaOption,
  BuildingTypeOption,
  buildingFormSchema,
} from "./buildings.schema";

// ========================================
// GET ALL BUILDINGS
// ========================================

export async function getBuildings(): Promise<
  ActionResponse<BuildingWithRelations[]>
> {
  try {
    const buildings = await prisma.building.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        areaId: true,
        buildingTypeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        buildingType: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    return { success: true, data: buildings };
  } catch (error) {
    console.error("[GET_BUILDINGS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data bangunan",
    };
  }
}

// ========================================
// GET BUILDING BY ID
// ========================================

export async function getBuildingById(
  id: string
): Promise<ActionResponse<BuildingWithRelations>> {
  try {
    const building = await prisma.building.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        areaId: true,
        buildingTypeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        buildingType: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!building) {
      return {
        success: false,
        error: "Bangunan tidak ditemukan",
      };
    }

    return { success: true, data: building };
  } catch (error) {
    console.error("[GET_BUILDING_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data bangunan",
    };
  }
}

// ========================================
// CREATE BUILDING
// ========================================

export async function createBuilding(
  data: BuildingFormInput
): Promise<ActionResponse<{ id: string; code: string; name: string }>> {
  try {
    // Validate input
    const validated = buildingFormSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    // Check if code already exists
    const existing = await prisma.building.findUnique({
      where: { code: validated.data.code },
    });

    if (existing) {
      return {
        success: false,
        error: `Kode bangunan "${validated.data.code}" sudah digunakan`,
      };
    }

    // Verify area exists
    const area = await prisma.area.findUnique({
      where: { id: validated.data.areaId },
    });

    if (!area) {
      return {
        success: false,
        error: "Area tidak ditemukan",
      };
    }

    // Create building
    const building = await prisma.building.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        areaId: validated.data.areaId,
        buildingTypeId: validated.data.buildingTypeId || null,
        status: validated.data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    revalidatePath("/properties/buildings");

    return { success: true, data: building };
  } catch (error) {
    console.error("[CREATE_BUILDING_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat bangunan baru",
    };
  }
}

// ========================================
// UPDATE BUILDING
// ========================================

export async function updateBuilding(
  id: string,
  data: BuildingFormInput
): Promise<ActionResponse<{ id: string; code: string; name: string }>> {
  try {
    // Validate input
    const validated = buildingFormSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    // Check if building exists
    const existing = await prisma.building.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Bangunan tidak ditemukan",
      };
    }

    // Check if code is taken by another building
    if (validated.data.code !== existing.code) {
      const codeExists = await prisma.building.findUnique({
        where: { code: validated.data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Kode bangunan "${validated.data.code}" sudah digunakan`,
        };
      }
    }

    // Verify area exists
    const area = await prisma.area.findUnique({
      where: { id: validated.data.areaId },
    });

    if (!area) {
      return {
        success: false,
        error: "Area tidak ditemukan",
      };
    }

    // Update building
    const building = await prisma.building.update({
      where: { id },
      data: {
        code: validated.data.code,
        name: validated.data.name,
        areaId: validated.data.areaId,
        buildingTypeId: validated.data.buildingTypeId || null,
        status: validated.data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    revalidatePath("/properties/buildings");

    return { success: true, data: building };
  } catch (error) {
    console.error("[UPDATE_BUILDING_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui bangunan",
    };
  }
}

// ========================================
// DELETE BUILDING
// ========================================

export async function deleteBuilding(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rooms: true,
            userBuildings: true,
          },
        },
      },
    });

    if (!building) {
      return {
        success: false,
        error: "Bangunan tidak ditemukan",
      };
    }

    // Check if building has related records
    if (building._count.rooms > 0) {
      return {
        success: false,
        error: `Bangunan tidak dapat dihapus karena masih memiliki ${building._count.rooms} ruangan terkait`,
      };
    }

    if (building._count.userBuildings > 0) {
      return {
        success: false,
        error: `Bangunan tidak dapat dihapus karena masih memiliki ${building._count.userBuildings} user terkait`,
      };
    }

    // Delete building
    await prisma.building.delete({
      where: { id },
    });

    revalidatePath("/properties/buildings");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[DELETE_BUILDING_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus bangunan",
    };
  }
}

// ========================================
// TOGGLE BUILDING STATUS
// ========================================

export async function toggleBuildingStatus(
  id: string
): Promise<ActionResponse<{ id: string; status: boolean }>> {
  try {
    const building = await prisma.building.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!building) {
      return {
        success: false,
        error: "Bangunan tidak ditemukan",
      };
    }

    const updated = await prisma.building.update({
      where: { id },
      data: { status: !building.status },
      select: {
        id: true,
        status: true,
      },
    });

    revalidatePath("/properties/buildings");

    return { success: true, data: updated };
  } catch (error) {
    console.error("[TOGGLE_BUILDING_STATUS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengubah status bangunan",
    };
  }
}

// ========================================
// GET AREAS FOR SELECT
// ========================================

export async function getAreasForSelect(): Promise<
  ActionResponse<AreaOption[]>
> {
  try {
    const areas = await prisma.area.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return { success: true, data: areas };
  } catch (error) {
    console.error("[GET_AREAS_FOR_SELECT_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data area",
    };
  }
}

// ========================================
// GET BUILDING TYPES FOR SELECT
// ========================================

export async function getBuildingTypesForSelect(): Promise<
  ActionResponse<BuildingTypeOption[]>
> {
  try {
    const buildingTypes = await prisma.buildingType.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return { success: true, data: buildingTypes };
  } catch (error) {
    console.error("[GET_BUILDING_TYPES_FOR_SELECT_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe bangunan",
    };
  }
}

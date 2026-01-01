"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { Area } from "@prisma/client";
import { AreaFormInput, areaFormSchema } from "./areas.schema";


// ========================================
// RESPONSE TYPES
// ========================================

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all areas
 */
export async function getAreas(): Promise<ActionResponse<Area[]>> {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        status: true,
        description: true,
        polygon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: areas };
  } catch (error) {
    console.error("[GET_AREAS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data area",
    };
  }
}

/**
 * Get single area by ID
 */
export async function getAreaById(id: string): Promise<ActionResponse<Area>> {
  try {
    const area = await prisma.area.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        status: true,
        description: true,
        polygon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!area) {
      return { success: false, error: "Area tidak ditemukan" };
    }

    return { success: true, data: area };
  } catch (error) {
    console.error("[GET_AREA_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data area",
    };
  }
}

/**
 * Create new area
 */
export async function createArea(
  input: AreaFormInput
): Promise<ActionResponse<Area>> {
  try {
    // Validate input
    const validation = areaFormSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if code already exists
    const existingArea = await prisma.area.findUnique({
      where: { code: data.code },
    });

    if (existingArea) {
      return {
        success: false,
        error: `Kode area "${data.code}" sudah digunakan`,
      };
    }

    // Create area
    const area = await prisma.area.create({
      data: {
        code: data.code,
        name: data.name,
        location: data.location,
        status: data.status,
        description: data.description || null,
        polygon: data.polygon || null,
        parentId: data.parentId || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        status: true,
        description: true,
        polygon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/properties/areas");

    return { success: true, data: area };
  } catch (error) {
    console.error("[CREATE_AREA_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat area baru",
    };
  }
}

/**
 * Update existing area
 */
export async function updateArea(
  id: string,
  input: AreaFormInput
): Promise<ActionResponse<Area>> {
  try {
    // Validate input
    const validation = areaFormSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if area exists
    const existingArea = await prisma.area.findUnique({
      where: { id },
    });

    if (!existingArea) {
      return {
        success: false,
        error: "Area tidak ditemukan",
      };
    }

    // Check if code already exists (excluding current area)
    if (data.code !== existingArea.code) {
      const codeExists = await prisma.area.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Kode area "${data.code}" sudah digunakan`,
        };
      }
    }

    // Update area
    const area = await prisma.area.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        location: data.location,
        status: data.status,
        description: data.description || null,
        polygon: data.polygon || null,
        parentId: data.parentId || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        status: true,
        description: true,
        polygon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/properties/areas");

    return { success: true, data: area };
  } catch (error) {
    console.error("[UPDATE_AREA_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui area",
    };
  }
}

/**
 * Delete area
 */
export async function deleteArea(id: string): Promise<ActionResponse<void>> {
  try {
    // Check if area exists
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        children: true,
        buildings: true,
      },
    });

    if (!area) {
      return {
        success: false,
        error: "Area tidak ditemukan",
      };
    }

    // Check if area has children
    if (area.children.length > 0) {
      return {
        success: false,
        error: "Tidak dapat menghapus area yang memiliki sub-area",
      };
    }

    // Check if area has buildings
    if (area.buildings.length > 0) {
      return {
        success: false,
        error: "Tidak dapat menghapus area yang memiliki gedung",
      };
    }

    // Delete area
    await prisma.area.delete({
      where: { id },
    });

    revalidatePath("/properties/areas");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_AREA_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus area",
    };
  }
}

/**
 * Toggle area status
 */
export async function toggleAreaStatus(
  id: string
): Promise<ActionResponse<Area>> {
  try {
    const area = await prisma.area.findUnique({
      where: { id },
    });

    if (!area) {
      return {
        success: false,
        error: "Area tidak ditemukan",
      };
    }

    // Toggle status logic
    let newStatus: "ACTIVE" | "INACTIVE" | "DEVELOPMENT";
    if (area.status === "ACTIVE") {
      newStatus = "INACTIVE";
    } else {
      newStatus = "ACTIVE";
    }

    const updatedArea = await prisma.area.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        status: true,
        description: true,
        polygon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/properties/areas");

    return { success: true, data: updatedArea };
  } catch (error) {
    console.error("[TOGGLE_AREA_STATUS_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengubah status area",
    };
  }
}

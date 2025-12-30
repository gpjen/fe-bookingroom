"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

// ========================================
// VALIDATION SCHEMAS
// ========================================

const buildingTypeSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(20, { message: "Kode maksimal 20 karakter" })
    .regex(/^[A-Z0-9-]+$/, {
      message: "Kode hanya boleh huruf kapital, angka, dan dash",
    }),
  name: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  description: z
    .string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional()
    .nullable(),
  defaultMaxFloors: z
    .number()
    .int()
    .min(1, { message: "Minimal 1 lantai" })
    .max(100, { message: "Maksimal 100 lantai" })
    .default(5),
  defaultFacilities: z
    .array(z.string())
    .optional()
    .default([]),
  icon: z.string().optional().nullable(),
  status: z.boolean().default(true),
});

export type BuildingTypeInput = z.infer<typeof buildingTypeSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// TYPE DEFINITIONS
// ========================================

export type BuildingType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultMaxFloors: number;
  defaultFacilities: string[];
  icon: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all building types
 */
export async function getBuildingTypes(): Promise<
  ActionResponse<BuildingType[]>
> {
  try {
    const buildingTypes = await prisma.buildingType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        defaultMaxFloors: true,
        defaultFacilities: true,
        icon: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: buildingTypes };
  } catch (error) {
    console.error("[GET_BUILDING_TYPES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe bangunan",
    };
  }
}

/**
 * Get single building type by ID
 */
export async function getBuildingTypeById(
  id: string
): Promise<ActionResponse<BuildingType>> {
  try {
    const buildingType = await prisma.buildingType.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        defaultMaxFloors: true,
        defaultFacilities: true,
        icon: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!buildingType) {
      return { success: false, error: "Tipe bangunan tidak ditemukan" };
    }

    return { success: true, data: buildingType };
  } catch (error) {
    console.error("[GET_BUILDING_TYPE_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe bangunan",
    };
  }
}

/**
 * Create new building type
 */
export async function createBuildingType(
  input: BuildingTypeInput
): Promise<ActionResponse<BuildingType>> {
  try {
    // Validate input
    const validation = buildingTypeSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if code already exists
    const existingType = await prisma.buildingType.findUnique({
      where: { code: data.code },
    });

    if (existingType) {
      return {
        success: false,
        error: `Kode tipe bangunan "${data.code}" sudah digunakan`,
      };
    }

    // Create building type
    const buildingType = await prisma.buildingType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        defaultMaxFloors: data.defaultMaxFloors,
        defaultFacilities: data.defaultFacilities || [],
        icon: data.icon || null,
        status: data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        defaultMaxFloors: true,
        defaultFacilities: true,
        icon: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: buildingType };
  } catch (error) {
    console.error("[CREATE_BUILDING_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat tipe bangunan baru",
    };
  }
}

/**
 * Update existing building type
 */
export async function updateBuildingType(
  id: string,
  input: BuildingTypeInput
): Promise<ActionResponse<BuildingType>> {
  try {
    // Validate input
    const validation = buildingTypeSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if building type exists
    const existingType = await prisma.buildingType.findUnique({
      where: { id },
    });

    if (!existingType) {
      return {
        success: false,
        error: "Tipe bangunan tidak ditemukan",
      };
    }

    // Check if code already exists (excluding current type)
    if (data.code !== existingType.code) {
      const codeExists = await prisma.buildingType.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Kode tipe bangunan "${data.code}" sudah digunakan`,
        };
      }
    }

    // Update building type
    const buildingType = await prisma.buildingType.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        defaultMaxFloors: data.defaultMaxFloors,
        defaultFacilities: data.defaultFacilities || [],
        icon: data.icon || null,
        status: data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        defaultMaxFloors: true,
        defaultFacilities: true,
        icon: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: buildingType };
  } catch (error) {
    console.error("[UPDATE_BUILDING_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui tipe bangunan",
    };
  }
}

/**
 * Delete building type
 */
export async function deleteBuildingType(
  id: string
): Promise<ActionResponse<void>> {
  try {
    // Check if building type exists
    const buildingType = await prisma.buildingType.findUnique({
      where: { id },
      include: {
        buildings: true,
      },
    });

    if (!buildingType) {
      return {
        success: false,
        error: "Tipe bangunan tidak ditemukan",
      };
    }

    // Check if building type is used by any buildings
    if (buildingType.buildings.length > 0) {
      return {
        success: false,
        error: `Tidak dapat menghapus tipe bangunan yang digunakan oleh ${buildingType.buildings.length} gedung`,
      };
    }

    // Delete building type
    await prisma.buildingType.delete({
      where: { id },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_BUILDING_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus tipe bangunan",
    };
  }
}

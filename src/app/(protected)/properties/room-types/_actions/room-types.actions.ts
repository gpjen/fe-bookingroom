"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  ActionResponse,
  RoomTypeFormInput,
  roomTypeFormSchema,
} from "./room-types.schema";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type RoomType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  bedsPerRoom: number;
  defaultBedType: string;
  defaultAmenities: string[];
  priceMultiplier: number;
  icon: string | null;
  imageUrl: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// SERVER ACTIONS
// ========================================

/**
 * Get all room types
 */
export async function getRoomTypes(): Promise<ActionResponse<RoomType[]>> {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        bedsPerRoom: true,
        defaultBedType: true,
        defaultAmenities: true,
        priceMultiplier: true,
        icon: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: roomTypes };
  } catch (error) {
    console.error("[GET_ROOM_TYPES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe ruangan",
    };
  }
}

/**
 * Get single room type by ID
 */
export async function getRoomTypeById(
  id: string
): Promise<ActionResponse<RoomType>> {
  try {
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        bedsPerRoom: true,
        defaultBedType: true,
        defaultAmenities: true,
        priceMultiplier: true,
        icon: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!roomType) {
      return { success: false, error: "Tipe ruangan tidak ditemukan" };
    }

    return { success: true, data: roomType };
  } catch (error) {
    console.error("[GET_ROOM_TYPE_BY_ID_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data tipe ruangan",
    };
  }
}

/**
 * Create new room type
 */
export async function createRoomType(
  input: RoomTypeFormInput
): Promise<ActionResponse<RoomType>> {
  try {
    // Validate input
    const validation = roomTypeFormSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if code already exists
    const existingType = await prisma.roomType.findUnique({
      where: { code: data.code },
    });

    if (existingType) {
      return {
        success: false,
        error: `Kode tipe ruangan "${data.code}" sudah digunakan`,
      };
    }

    // Create room type
    const roomType = await prisma.roomType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        bedsPerRoom: data.bedsPerRoom,
        defaultBedType: data.defaultBedType,
        defaultAmenities: data.defaultAmenities || [],
        priceMultiplier: data.priceMultiplier,
        icon: data.icon || null,
        imageUrl: data.imageUrl || null,
        status: data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        bedsPerRoom: true,
        defaultBedType: true,
        defaultAmenities: true,
        priceMultiplier: true,
        icon: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/properties/room-types");

    return { success: true, data: roomType };
  } catch (error) {
    console.error("[CREATE_ROOM_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal membuat tipe ruangan baru",
    };
  }
}

/**
 * Update existing room type
 */
export async function updateRoomType(
  id: string,
  input: RoomTypeFormInput
): Promise<ActionResponse<RoomType>> {
  try {
    // Validate input
    const validation = roomTypeFormSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message);
      return {
        success: false,
        error: errors.join(", "),
      };
    }

    const data = validation.data;

    // Check if room type exists
    const existingType = await prisma.roomType.findUnique({
      where: { id },
    });

    if (!existingType) {
      return {
        success: false,
        error: "Tipe ruangan tidak ditemukan",
      };
    }

    // Check if code already exists (excluding current type)
    if (data.code !== existingType.code) {
      const codeExists = await prisma.roomType.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: `Kode tipe ruangan "${data.code}" sudah digunakan`,
        };
      }
    }

    // Update room type
    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        bedsPerRoom: data.bedsPerRoom,
        defaultBedType: data.defaultBedType,
        defaultAmenities: data.defaultAmenities || [],
        priceMultiplier: data.priceMultiplier,
        icon: data.icon || null,
        imageUrl: data.imageUrl || null,
        status: data.status,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        bedsPerRoom: true,
        defaultBedType: true,
        defaultAmenities: true,
        priceMultiplier: true,
        icon: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/properties/room-types");

    return { success: true, data: roomType };
  } catch (error) {
    console.error("[UPDATE_ROOM_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal memperbarui tipe ruangan",
    };
  }
}

/**
 * Delete room type
 */
export async function deleteRoomType(
  id: string
): Promise<ActionResponse<void>> {
  try {
    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id },
    });

    if (!roomType) {
      return {
        success: false,
        error: "Tipe ruangan tidak ditemukan",
      };
    }

    // TODO: Add validation if room type is used by rooms
    // For now, allow deletion

    // Delete room type
    await prisma.roomType.delete({
      where: { id },
    });

    revalidatePath("/properties/room-types");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_ROOM_TYPE_ERROR]", error);
    return {
      success: false,
      error: "Gagal menghapus tipe ruangan",
    };
  }
}

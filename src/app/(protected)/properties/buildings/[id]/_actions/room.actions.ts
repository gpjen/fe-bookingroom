"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  ActionResponse,
  RoomWithBeds,
  RoomTypeOption,
  roomFormSchema,
  RoomFormInput,
} from "./room.types";

// ========================================
// GET ROOM TYPES FOR SELECT
// ========================================

export async function getRoomTypes(): Promise<ActionResponse<RoomTypeOption[]>> {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        bedsPerRoom: true,
        defaultBedType: true,
        defaultAmenities: true,
      },
    });

    return { success: true, data: roomTypes };
  } catch (error) {
    console.error("[GET_ROOM_TYPES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data tipe ruangan" };
  }
}

// ========================================
// GET ROOM BY ID
// ========================================

export async function getRoomById(
  id: string
): Promise<ActionResponse<RoomWithBeds>> {
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        buildingId: true,
        roomTypeId: true,
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

    if (!room) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    return {
      success: true,
      data: {
        ...room,
        pricePerBed: room.pricePerBed ? Number(room.pricePerBed) : null,
      },
    };
  } catch (error) {
    console.error("[GET_ROOM_BY_ID_ERROR]", error);
    return { success: false, error: "Gagal mengambil data ruangan" };
  }
}

// ========================================
// CREATE ROOM (WITH AUTO-GENERATED BEDS)
// ========================================

export async function createRoom(
  input: RoomFormInput
): Promise<ActionResponse<RoomWithBeds>> {
  try {
    // Validate input
    const validated = roomFormSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
      };
    }

    const data = validated.data;

    // Check if code already exists
    const existing = await prisma.room.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return { success: false, error: "Kode ruangan sudah digunakan" };
    }

    // Get room type for bed generation
    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId },
      select: {
        bedsPerRoom: true,
        defaultBedType: true,
      },
    });

    if (!roomType) {
      return { success: false, error: "Tipe ruangan tidak ditemukan" };
    }

    // Create room with beds in transaction
    const room = await prisma.$transaction(async (tx) => {
      // Create room
      const newRoom = await tx.room.create({
        data: {
          code: data.code,
          name: data.name,
          buildingId: data.buildingId,
          roomTypeId: data.roomTypeId,
          floorNumber: data.floorNumber,
          floorName: data.floorName || null,
          description: data.description || null,
          allowedOccupantType: data.allowedOccupantType,
          isBookable: data.isBookable,
          genderPolicy: data.genderPolicy,
          pricePerBed: data.pricePerBed || null,
          status: data.status,
        },
      });

      // Auto-generate beds based on roomType.bedsPerRoom
      const bedLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const bedsData = Array.from({ length: roomType.bedsPerRoom }, (_, i) => ({
        roomId: newRoom.id,
        code: `${data.code}-${bedLabels[i] || (i + 1)}`,
        label: `Bed ${bedLabels[i] || (i + 1)}`,
        position: i + 1,
        bedType: roomType.defaultBedType,
        status: "AVAILABLE" as const,
      }));

      await tx.bed.createMany({
        data: bedsData,
      });

      return newRoom;
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${data.buildingId}`);

    // Fetch complete room with beds
    const result = await getRoomById(room.id);
    if (!result.success) {
      return { success: false, error: "Room created but failed to fetch" };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("[CREATE_ROOM_ERROR]", error);
    return { success: false, error: "Gagal membuat ruangan" };
  }
}

// ========================================
// UPDATE ROOM
// ========================================

export async function updateRoom(
  id: string,
  input: RoomFormInput
): Promise<ActionResponse<RoomWithBeds>> {
  try {
    // Validate input
    const validated = roomFormSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
      };
    }

    const data = validated.data;

    // Check if room exists
    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    // Check if new code conflicts with another room
    if (data.code !== existing.code) {
      const codeConflict = await prisma.room.findUnique({
        where: { code: data.code },
      });

      if (codeConflict) {
        return { success: false, error: "Kode ruangan sudah digunakan" };
      }
    }

    // Update room
    await prisma.room.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        roomTypeId: data.roomTypeId,
        floorNumber: data.floorNumber,
        floorName: data.floorName || null,
        description: data.description || null,
        allowedOccupantType: data.allowedOccupantType,
        isBookable: data.isBookable,
        genderPolicy: data.genderPolicy,
        pricePerBed: data.pricePerBed || null,
        status: data.status,
      },
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${data.buildingId}`);

    // Fetch updated room
    const result = await getRoomById(id);
    if (!result.success) {
      return { success: false, error: "Room updated but failed to fetch" };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("[UPDATE_ROOM_ERROR]", error);
    return { success: false, error: "Gagal memperbarui ruangan" };
  }
}

// ========================================
// DELETE ROOM
// ========================================

export async function deleteRoom(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        buildingId: true,
        beds: {
          select: {
            id: true,
            _count: {
              select: {
                occupancies: {
                  where: {
                    status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    // Check for active occupancies
    const hasActiveOccupancy = room.beds.some(
      (bed) => bed._count.occupancies > 0
    );

    if (hasActiveOccupancy) {
      return {
        success: false,
        error:
          "Tidak dapat menghapus ruangan yang masih memiliki penghuni aktif",
      };
    }

    // Delete room (beds will cascade delete)
    await prisma.room.delete({
      where: { id },
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${room.buildingId}`);

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[DELETE_ROOM_ERROR]", error);
    return { success: false, error: "Gagal menghapus ruangan" };
  }
}

// ========================================
// GET UNIQUE FLOOR NUMBERS FOR BUILDING
// ========================================

export async function getFloorNumbers(
  buildingId: string
): Promise<ActionResponse<{ floorNumber: number; floorName: string | null }[]>> {
  try {
    const floors = await prisma.room.findMany({
      where: { buildingId },
      distinct: ["floorNumber"],
      orderBy: { floorNumber: "asc" },
      select: {
        floorNumber: true,
        floorName: true,
      },
    });

    return { success: true, data: floors };
  } catch (error) {
    console.error("[GET_FLOOR_NUMBERS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data lantai" };
  }
}

// ========================================
// UPDATE BED
// ========================================

export interface BedUpdateInput {
  label?: string;
  bedType?: string | null;
  status?: "AVAILABLE" | "MAINTENANCE" | "BLOCKED";
  notes?: string | null;
}

export async function updateBed(
  id: string,
  input: BedUpdateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if bed exists
    const bed = await prisma.bed.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        room: {
          select: {
            buildingId: true,
          },
        },
      },
    });

    if (!bed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    // Cannot change status if bed is OCCUPIED or RESERVED
    if (
      input.status &&
      (bed.status === "OCCUPIED" || bed.status === "RESERVED")
    ) {
      return {
        success: false,
        error: "Tidak dapat mengubah status bed yang sedang terisi atau dipesan",
      };
    }

    // Update bed
    await prisma.bed.update({
      where: { id },
      data: {
        label: input.label,
        bedType: input.bedType,
        status: input.status,
        notes: input.notes,
      },
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${bed.room.buildingId}`);

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[UPDATE_BED_ERROR]", error);
    return { success: false, error: "Gagal memperbarui bed" };
  }
}

// ========================================
// ADD BED TO ROOM
// ========================================

export interface BedCreateInput {
  roomId: string;
  code: string;
  label: string;
  bedType?: string | null;
}

export async function addBedToRoom(
  input: BedCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: input.roomId },
      select: {
        id: true,
        buildingId: true,
        beds: {
          orderBy: { position: "desc" },
          take: 1,
          select: { position: true },
        },
      },
    });

    if (!room) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    // Check if code already exists
    const existingBed = await prisma.bed.findUnique({
      where: { code: input.code },
    });

    if (existingBed) {
      return { success: false, error: "Kode bed sudah digunakan" };
    }

    // Get next position
    const nextPosition = (room.beds[0]?.position || 0) + 1;

    // Create bed
    const bed = await prisma.bed.create({
      data: {
        roomId: input.roomId,
        code: input.code,
        label: input.label,
        position: nextPosition,
        bedType: input.bedType,
        status: "AVAILABLE",
      },
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${room.buildingId}`);

    return { success: true, data: { id: bed.id } };
  } catch (error) {
    console.error("[ADD_BED_TO_ROOM_ERROR]", error);
    return { success: false, error: "Gagal menambah bed" };
  }
}

// ========================================
// DELETE BED
// ========================================

export async function deleteBed(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check if bed exists
    const bed = await prisma.bed.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        room: {
          select: {
            buildingId: true,
          },
        },
        _count: {
          select: {
            occupancies: {
              where: {
                status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
              },
            },
          },
        },
      },
    });

    if (!bed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    // Cannot delete if has active occupancy
    if (bed._count.occupancies > 0 || bed.status === "OCCUPIED") {
      return {
        success: false,
        error: "Tidak dapat menghapus bed yang memiliki penghuni aktif",
      };
    }

    // Delete bed
    await prisma.bed.delete({
      where: { id },
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${bed.room.buildingId}`);

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[DELETE_BED_ERROR]", error);
    return { success: false, error: "Gagal menghapus bed" };
  }
}

// ========================================
// SWAP BED POSITIONS
// ========================================

export async function swapBedPositions(
  bedId1: string,
  bedId2: string
): Promise<ActionResponse<{ success: true }>> {
  try {
    // Get both beds
    const [bed1, bed2] = await Promise.all([
      prisma.bed.findUnique({
        where: { id: bedId1 },
        select: {
          id: true,
          position: true,
          room: { select: { buildingId: true } },
        },
      }),
      prisma.bed.findUnique({
        where: { id: bedId2 },
        select: { id: true, position: true },
      }),
    ]);

    if (!bed1 || !bed2) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    // Swap positions using transaction
    await prisma.$transaction([
      prisma.bed.update({
        where: { id: bedId1 },
        data: { position: bed2.position },
      }),
      prisma.bed.update({
        where: { id: bedId2 },
        data: { position: bed1.position },
      }),
    ]);

    // Revalidate cache
    revalidatePath(`/properties/buildings/${bed1.room.buildingId}`);

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[SWAP_BED_POSITIONS_ERROR]", error);
    return { success: false, error: "Gagal mengubah posisi bed" };
  }
}

"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  processAndSaveImage,
  deleteImageFile,
  validateImageFile,
} from "@/lib/upload";
import {
  ActionResponse,
  RoomImage,
  UpdateImageInput,
  updateImageSchema,
  ROOM_IMAGES_PATH,
} from "./gallery.types";

// ========================================
// GET ROOM IMAGES
// ========================================

export async function getRoomImages(
  roomId: string
): Promise<ActionResponse<RoomImage[]>> {
  try {
    const images = await prisma.roomImage.findMany({
      where: { roomId },
      orderBy: [
        { isPrimary: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return { success: true, data: images };
  } catch (error) {
    console.error("[GET_ROOM_IMAGES_ERROR]", error);
    return { success: false, error: "Gagal mengambil gambar ruangan" };
  }
}

// ========================================
// UPLOAD ROOM IMAGE
// ========================================

export async function uploadRoomImage(
  formData: FormData
): Promise<ActionResponse<RoomImage>> {
  try {
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string | null;
    const caption = formData.get("caption") as string | null;
    const isPrimaryStr = formData.get("isPrimary") as string | null;

    // Validate required fields
    if (!file || !roomId) {
      return { success: false, error: "File dan Room ID wajib diisi" };
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    // Get room to verify it exists and get buildingId for revalidation
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, buildingId: true },
    });

    if (!room) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    // Process and save image
    const uploadResult = await processAndSaveImage(file, ROOM_IMAGES_PATH);

    // Determine if this should be primary
    const isPrimary = isPrimaryStr === "true";

    // Use transaction to handle primary image logic
    const image = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset others
      if (isPrimary) {
        await tx.roomImage.updateMany({
          where: { roomId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Check if this is first image (auto-set as primary)
      const existingCount = await tx.roomImage.count({
        where: { roomId },
      });
      const shouldBePrimary = isPrimary || existingCount === 0;

      // Create new image record
      return await tx.roomImage.create({
        data: {
          roomId,
          fileName: uploadResult.fileName,
          filePath: uploadResult.filePath,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          width: uploadResult.width,
          height: uploadResult.height,
          caption,
          isPrimary: shouldBePrimary,
          order: existingCount,
        },
      });
    });

    revalidatePath(`/properties/buildings/${room.buildingId}`);
    return { success: true, data: image };
  } catch (error) {
    console.error("[UPLOAD_ROOM_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal mengupload gambar ruangan" };
  }
}

// ========================================
// UPDATE ROOM IMAGE
// ========================================

export async function updateRoomImage(
  id: string,
  data: UpdateImageInput
): Promise<ActionResponse<RoomImage>> {
  try {
    const validatedFields = updateImageSchema.safeParse(data);

    if (!validatedFields.success) {
      return { success: false, error: "Data tidak valid" };
    }

    const { caption, isPrimary, order } = validatedFields.data;

    // First get the image to know roomId
    const existingImage = await prisma.roomImage.findUnique({
      where: { id },
      select: { 
        roomId: true,
        room: {
          select: { buildingId: true }
        }
      },
    });

    if (!existingImage) {
      return { success: false, error: "Gambar tidak ditemukan" };
    }

    const image = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset others
      if (isPrimary) {
        await tx.roomImage.updateMany({
          where: {
            roomId: existingImage.roomId,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }

      return await tx.roomImage.update({
        where: { id },
        data: {
          ...(caption !== undefined && { caption }),
          ...(isPrimary !== undefined && { isPrimary }),
          ...(order !== undefined && { order }),
        },
      });
    });

    revalidatePath(`/properties/buildings/${existingImage.room.buildingId}`);
    return { success: true, data: image };
  } catch (error) {
    console.error("[UPDATE_ROOM_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal mengupdate gambar ruangan" };
  }
}

// ========================================
// DELETE ROOM IMAGE
// ========================================

export async function deleteRoomImage(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const image = await prisma.roomImage.findUnique({
      where: { id },
      select: { 
        roomId: true, 
        filePath: true,
        room: {
          select: { buildingId: true }
        }
      },
    });

    if (!image) {
      return { success: false, error: "Gambar tidak ditemukan" };
    }

    // Delete file from storage
    await deleteImageFile(image.filePath);

    // Delete from database
    await prisma.roomImage.delete({
      where: { id },
    });

    revalidatePath(`/properties/buildings/${image.room.buildingId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_ROOM_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal menghapus gambar ruangan" };
  }
}

// ========================================
// SET ROOM PRIMARY IMAGE
// ========================================

export async function setRoomPrimaryImage(
  id: string
): Promise<ActionResponse<RoomImage>> {
  return updateRoomImage(id, { isPrimary: true });
}

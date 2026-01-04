"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  ActionResponse,
  BuildingImage,
  UploadImageInput,
  UpdateImageInput,
  uploadImageSchema,
  updateImageSchema,
} from "./gallery.types";

// ========================================
// GET IMAGES
// ========================================

export async function getBuildingImages(
  buildingId: string
): Promise<ActionResponse<BuildingImage[]>> {
  try {
    const images = await prisma.buildingImage.findMany({
      where: { buildingId },
      orderBy: [
        { isPrimary: "desc" }, // Primary first
        { order: "asc" }, // Then by order
        { createdAt: "desc" }, // Then newest
      ],
    });

    return { success: true, data: images };
  } catch (error) {
    console.error("[GET_BUILDING_IMAGES_ERROR]", error);
    return { success: false, error: "Gagal mengambil gambar" };
  }
}

// ========================================
// UPLOAD IMAGE
// ========================================

export async function uploadBuildingImage(
  data: UploadImageInput
): Promise<ActionResponse<BuildingImage>> {
  try {
    const validatedFields = uploadImageSchema.safeParse(data);

    if (!validatedFields.success) {
      return { success: false, error: "Data tidak valid" };
    }

    const { buildingId, url, caption, isPrimary, order } = validatedFields.data;

    // Use transaction to handle primary image logic
    const image = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset others
      if (isPrimary) {
        await tx.buildingImage.updateMany({
          where: { buildingId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create new image
      return await tx.buildingImage.create({
        data: {
          buildingId,
          url,
          caption,
          isPrimary,
          order,
        },
      });
    });

    revalidatePath(`/properties/buildings/${buildingId}`);
    return { success: true, data: image };
  } catch (error) {
    console.error("[UPLOAD_BUILDING_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal mengupload gambar" };
  }
}

// ========================================
// START ACTION: UPDATE IMAGE
// ========================================

export async function updateBuildingImage(
  id: string,
  data: UpdateImageInput
): Promise<ActionResponse<BuildingImage>> {
  try {
    const validatedFields = updateImageSchema.safeParse(data);

    if (!validatedFields.success) {
      return { success: false, error: "Data tidak valid" };
    }

    const { caption, isPrimary, order } = validatedFields.data;

    // First get the image to know buildingId
    const existingImage = await prisma.buildingImage.findUnique({
      where: { id },
      select: { buildingId: true },
    });

    if (!existingImage) {
      return { success: false, error: "Gambar tidak ditemukan" };
    }

    const image = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset others
      if (isPrimary) {
        await tx.buildingImage.updateMany({
          where: {
            buildingId: existingImage.buildingId,
            isPrimary: true,
            id: { not: id }, // Exclude current
          },
          data: { isPrimary: false },
        });
      }

      return await tx.buildingImage.update({
        where: { id },
        data: {
          ...(caption !== undefined && { caption }),
          ...(isPrimary !== undefined && { isPrimary }),
          ...(order !== undefined && { order }),
        },
      });
    });

    revalidatePath(`/properties/buildings/${existingImage.buildingId}`);
    return { success: true, data: image };
  } catch (error) {
    console.error("[UPDATE_BUILDING_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal mengupdate gambar" };
  }
}

// ========================================
// DELETE IMAGE
// ========================================

export async function deleteBuildingImage(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const image = await prisma.buildingImage.findUnique({
      where: { id },
      select: { buildingId: true },
    });

    if (!image) {
      return { success: false, error: "Gambar tidak ditemukan" };
    }

    await prisma.buildingImage.delete({
      where: { id },
    });

    revalidatePath(`/properties/buildings/${image.buildingId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DELETE_BUILDING_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal menghapus gambar" };
  }
}

// ========================================
// SET PRIMARY
// ========================================

export async function setPrimaryImage(
  id: string
): Promise<ActionResponse<BuildingImage>> {
  return updateBuildingImage(id, { isPrimary: true });
}

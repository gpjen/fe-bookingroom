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
  BuildingImage,
  UpdateImageInput,
  updateImageSchema,
  BUILDING_IMAGES_PATH,
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
        { isPrimary: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
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
  formData: FormData
): Promise<ActionResponse<BuildingImage>> {
  try {
    const file = formData.get("file") as File | null;
    const buildingId = formData.get("buildingId") as string | null;
    const caption = formData.get("caption") as string | null;
    const isPrimaryStr = formData.get("isPrimary") as string | null;

    // Validate required fields
    if (!file || !buildingId) {
      return { success: false, error: "File dan Building ID wajib diisi" };
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    // Process and save image
    const uploadResult = await processAndSaveImage(file, BUILDING_IMAGES_PATH);

    // Determine if this should be primary
    const isPrimary = isPrimaryStr === "true";

    // Use transaction to handle primary image logic
    const image = await prisma.$transaction(async (tx) => {
      // If setting as primary, unset others
      if (isPrimary) {
        await tx.buildingImage.updateMany({
          where: { buildingId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Check if this is first image (auto-set as primary)
      const existingCount = await tx.buildingImage.count({
        where: { buildingId },
      });
      const shouldBePrimary = isPrimary || existingCount === 0;

      // Create new image record
      return await tx.buildingImage.create({
        data: {
          buildingId,
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

    revalidatePath(`/properties/buildings/${buildingId}`);
    return { success: true, data: image };
  } catch (error) {
    console.error("[UPLOAD_BUILDING_IMAGE_ERROR]", error);
    return { success: false, error: "Gagal mengupload gambar" };
  }
}

// ========================================
// UPDATE IMAGE
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
            id: { not: id },
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
      select: { buildingId: true, filePath: true },
    });

    if (!image) {
      return { success: false, error: "Gambar tidak ditemukan" };
    }

    // Delete file from storage
    await deleteImageFile(image.filePath);

    // Delete from database
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

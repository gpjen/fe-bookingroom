"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import sharp from "sharp";

// ========================================
// TYPES
// ========================================

export interface UploadAttachmentResult {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========================================
// CONFIG
// ========================================

const UPLOAD_DIR = "/uploads/bookings";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ========================================
// UTILITIES
// ========================================

function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString("hex");
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 20);
  
  if (prefix) {
    return `${prefix}_${baseName}_${randomStr}${ext}`;
  }
  return `${baseName}_${timestamp}_${randomStr}${ext}`;
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// ========================================
// UPLOAD BOOKING ATTACHMENT
// ========================================

/**
 * Upload a file for booking attachment.
 * File is saved with PENDING status until linked to a booking.
 */
export async function uploadBookingAttachment(
  formData: FormData
): Promise<ActionResponse<UploadAttachmentResult>> {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get file from FormData
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "File tidak ditemukan" };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Tipe file tidak didukung. Gunakan JPG, PNG, GIF, PDF, atau DOC.",
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "Ukuran file terlalu besar. Maksimal 5MB.",
      };
    }

    // Get user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const uploaderNik = user.username || user.nik || user.id;
    const uploaderName = user.name || user.displayName || "Unknown";

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Uint8Array = new Uint8Array(arrayBuffer);
    let finalMimeType = file.type;
    let finalFileName = file.name;

    // Process images: convert to WebP for optimization
    if (file.type.startsWith("image/")) {
      try {
        const processedBuffer = await sharp(Buffer.from(buffer))
          .resize(1920, 1080, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toBuffer();
        buffer = new Uint8Array(processedBuffer);
        finalMimeType = "image/webp";
        finalFileName = path.parse(file.name).name + ".webp";
      } catch (imgError) {
        console.warn("[UPLOAD] Image processing failed, saving original:", imgError);
        // Keep original if sharp fails
      }
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(finalFileName);

    // Build paths
    const publicDir = path.join(process.cwd(), "public");
    const fullUploadDir = path.join(publicDir, UPLOAD_DIR);
    const fullFilePath = path.join(fullUploadDir, uniqueFileName);
    const relativePath = `${UPLOAD_DIR}/${uniqueFileName}`;

    // Ensure directory exists
    await ensureDirectory(fullUploadDir);

    // Write file
    await fs.writeFile(fullFilePath, buffer);

    // Create database record with PENDING status
    const attachment = await prisma.bookingAttachment.create({
      data: {
        fileName: file.name, // Original filename
        filePath: relativePath,
        fileType: finalMimeType,
        fileSize: buffer.length,
        uploadedBy: uploaderNik,
        uploadedByName: uploaderName,
        status: "PENDING",
      },
    });

    return {
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
      },
    };
  } catch (error) {
    console.error("[UPLOAD_BOOKING_ATTACHMENT_ERROR]", error);
    return { success: false, error: "Gagal mengupload file" };
  }
}

// ========================================
// LINK ATTACHMENTS TO BOOKING
// ========================================

/**
 * Link uploaded attachments to a booking.
 * Called after booking is created.
 */
export async function linkAttachmentsToBooking(
  bookingId: string,
  attachmentIds: string[]
): Promise<ActionResponse<{ linked: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (attachmentIds.length === 0) {
      return { success: true, data: { linked: 0 } };
    }

    // Update attachments to link to booking
    const result = await prisma.bookingAttachment.updateMany({
      where: {
        id: { in: attachmentIds },
        status: "PENDING",
        bookingId: null, // Only link unlinked attachments
      },
      data: {
        bookingId: bookingId,
        status: "LINKED",
      },
    });

    return {
      success: true,
      data: { linked: result.count },
    };
  } catch (error) {
    console.error("[LINK_ATTACHMENTS_ERROR]", error);
    return { success: false, error: "Gagal menghubungkan file ke booking" };
  }
}

// ========================================
// DELETE ATTACHMENT
// ========================================

/**
 * Delete an uploaded attachment (only if PENDING/unlinked).
 */
export async function deleteBookingAttachment(
  attachmentId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Find attachment
    const attachment = await prisma.bookingAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return { success: false, error: "Attachment tidak ditemukan" };
    }

    // Only allow deleting PENDING (unlinked) attachments
    if (attachment.status !== "PENDING") {
      return { success: false, error: "Tidak dapat menghapus file yang sudah terhubung ke booking" };
    }

    // Delete file from disk
    try {
      const publicDir = path.join(process.cwd(), "public");
      const fullPath = path.join(publicDir, attachment.filePath);
      await fs.unlink(fullPath);
    } catch (fileError) {
      console.warn("[DELETE_ATTACHMENT] File not found on disk:", fileError);
    }

    // Delete from database
    await prisma.bookingAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  } catch (error) {
    console.error("[DELETE_ATTACHMENT_ERROR]", error);
    return { success: false, error: "Gagal menghapus file" };
  }
}

import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// ========================================
// TYPES
// ========================================

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
}

export interface UploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// ========================================
// CONFIG
// ========================================

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
};

// ========================================
// UPLOAD UTILITIES
// ========================================

/**
 * Generates a unique filename with timestamp and random string
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  const ext = "webp"; // Always output as WebP
  const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, "-");
  return `${baseName}-${timestamp}-${randomStr}.${ext}`;
}

/**
 * Ensures the upload directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Process and save an uploaded image
 * - Converts to WebP format
 * - Resizes if larger than max dimensions
 * - Compresses with specified quality
 */
export async function processAndSaveImage(
  file: File,
  uploadDir: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get original filename
  const originalFileName = file.name;

  // Generate unique filename
  const uniqueFileName = generateUniqueFileName(originalFileName);

  // Build full paths
  const publicDir = path.join(process.cwd(), "public");
  const fullUploadDir = path.join(publicDir, uploadDir);
  const fullFilePath = path.join(fullUploadDir, uniqueFileName);

  // Ensure directory exists
  await ensureDirectory(fullUploadDir);

  // Process image with sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Calculate resize dimensions (maintain aspect ratio)
  let width = metadata.width || opts.maxWidth;
  let height = metadata.height || opts.maxHeight;

  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Process and save
  const processedBuffer = await image
    .resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: opts.quality })
    .toBuffer();

  // Write to file
  await fs.writeFile(fullFilePath, processedBuffer);

  // Get final image info
  const finalMetadata = await sharp(processedBuffer).metadata();

  return {
    fileName: originalFileName,
    filePath: `${uploadDir}/${uniqueFileName}`,
    fileSize: processedBuffer.length,
    mimeType: "image/webp",
    width: finalMetadata.width || width,
    height: finalMetadata.height || height,
  };
}

/**
 * Delete an uploaded image file
 */
export async function deleteImageFile(filePath: string): Promise<void> {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const fullPath = path.join(publicDir, filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    // File might not exist, log but don't throw
    console.warn(`[DELETE_IMAGE_FILE] Could not delete: ${filePath}`, error);
  }
}

/**
 * Validate file type and size
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const acceptedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/jpg",
  ];

  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung. Gunakan: ${acceptedTypes.join(", ")}`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

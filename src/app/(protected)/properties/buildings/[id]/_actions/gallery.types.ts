import { z } from "zod";

// ========================================
// TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * BuildingImage - matches Prisma schema
 */
export interface BuildingImage {
  id: string;
  buildingId: string;
  
  // File Storage
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  
  // Image Metadata
  width: number | null;
  height: number | null;
  
  // Display
  caption: string | null;
  isPrimary: boolean;
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RoomImage - matches Prisma schema
 */
export interface RoomImage {
  id: string;
  roomId: string;
  
  // File Storage
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  
  // Image Metadata
  width: number | null;
  height: number | null;
  
  // Display
  caption: string | null;
  isPrimary: boolean;
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// VALIDATION SCHEMA - Upload
// ========================================

/**
 * Schema for uploading a new image
 * Note: actual file is handled separately via FormData
 */
export const uploadImageSchema = z.object({
  caption: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  order: z.number().default(0),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

/**
 * Schema for updating image metadata
 */
export const updateImageSchema = z.object({
  caption: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  order: z.number().optional(),
});

export type UpdateImageInput = z.infer<typeof updateImageSchema>;

// ========================================
// FILE UPLOAD CONSTANTS
// ========================================

export const IMAGE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  outputFormat: "webp" as const,
  quality: 80, // WebP quality 0-100
  maxWidth: 1920,
  maxHeight: 1080,
};

// Building images storage
export const BUILDING_IMAGES_PATH = "/uploads/buildings";

// Room images storage
export const ROOM_IMAGES_PATH = "/uploads/rooms";

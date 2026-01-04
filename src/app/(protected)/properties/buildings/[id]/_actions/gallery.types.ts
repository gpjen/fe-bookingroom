import { z } from "zod";

// ========================================
// TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface BuildingImage {
  id: string;
  buildingId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// VALIDATION SCHEMA
// ========================================

export const uploadImageSchema = z.object({
  buildingId: z.string().min(1, "Building ID wajib"),
  url: z.string().url("URL tidak valid"),
  caption: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  order: z.number().default(0),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

export const updateImageSchema = z.object({
  caption: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  order: z.number().optional(),
});

export type UpdateImageInput = z.infer<typeof updateImageSchema>;

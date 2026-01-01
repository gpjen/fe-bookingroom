import { z } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const roomTypeFormSchema = z.object({
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
  bedsPerRoom: z
    .number()
    .int()
    .min(1, { message: "Minimal 1 bed" })
    .max(10, { message: "Maksimal 10 bed per kamar" }),
  defaultBedType: z
    .string()
    .min(1, { message: "Tipe bed wajib diisi" }),
  defaultAmenities: z
    .array(z.string())
    .optional(),
  priceMultiplier: z
    .number()
    .min(0.1, { message: "Minimal 0.1" })
    .max(10, { message: "Maksimal 10" }),
  icon: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: z.boolean(),
});

export type RoomTypeFormInput = z.infer<typeof roomTypeFormSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

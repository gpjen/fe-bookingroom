
import { z } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const areaFormSchema = z.object({
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
  location: z
    .string()
    .min(3, { message: "Lokasi minimal 3 karakter" })
    .max(200, { message: "Lokasi maksimal 200 karakter" }),
  status: z.enum(["ACTIVE", "INACTIVE", "DEVELOPMENT"]),
  description: z
    .string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional()
    .nullable(),
  polygon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export type AreaFormInput = z.infer<typeof areaFormSchema>;
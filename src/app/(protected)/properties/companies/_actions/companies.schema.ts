
import { z } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const companyFormSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(10, { message: "Kode maksimal 10 karakter" })
    .regex(/^[A-Z0-9-]+$/, {
      message: "Kode hanya boleh huruf kapital, angka, dan dash",
    }),
  name: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  status: z.boolean(),
});

export type CompanyFormInput = z.infer<typeof companyFormSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
import { z } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const roleFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, { message: "Minimal pilih 1 permission" }),
});

export type RoleFormInput = z.infer<typeof roleFormSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

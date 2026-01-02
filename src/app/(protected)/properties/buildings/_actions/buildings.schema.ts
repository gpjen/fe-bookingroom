import { z } from "zod";

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const buildingFormSchema = z.object({
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
  areaId: z.string().min(1, { message: "Area wajib dipilih" }),
  buildingTypeId: z.string().optional().nullable(),
  status: z.boolean(),
  description: z.string().optional().nullable(),
});

export type BuildingFormInput = z.infer<typeof buildingFormSchema>;

// ========================================
// RESPONSE TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// BUILDING WITH RELATIONS TYPE
// ========================================

export interface BuildingWithRelations {
  id: string;
  code: string;
  name: string;
  areaId: string;
  buildingTypeId: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  area: {
    id: string;
    name: string;
  };
  buildingType: {
    id: string;
    name: string;
  } | null;
  _count: {
    rooms: number;
  };
}

// ========================================
// SELECT OPTIONS TYPES
// ========================================

export interface AreaOption {
  id: string;
  code: string;
  name: string;
}

export interface BuildingTypeOption {
  id: string;
  code: string;
  name: string;
}

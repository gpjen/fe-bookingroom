import { z } from "zod";

export const buildingTypeFormSchema = z.object({
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
    .optional(),
  defaultMaxFloors: z
    .number()
    .int()
    .min(1, { message: "Minimal 1 lantai" })
    .max(20, { message: "Maksimal 20 lantai" }),
  defaultFacilities: z.array(z.string()),
  icon: z.string().optional(),
  status: z.boolean(),
});

export type BuildingTypeInput = z.infer<typeof buildingTypeFormSchema>;
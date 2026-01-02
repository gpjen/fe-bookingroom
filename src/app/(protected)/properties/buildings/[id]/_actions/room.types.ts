import { z } from "zod";

// ========================================
// TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface RoomWithBeds {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  roomTypeId: string;
  floorNumber: number;
  floorName: string | null;
  description: string | null;
  allowedOccupantType: "EMPLOYEE_ONLY" | "ALL";
  isBookable: boolean;
  genderPolicy: "MALE_ONLY" | "FEMALE_ONLY" | "MIX" | "FLEXIBLE";
  currentGender: string | null;
  pricePerBed: number | null;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  roomType: {
    id: string;
    code: string;
    name: string;
    bedsPerRoom: number;
    defaultBedType: string;
  };
  beds: {
    id: string;
    code: string;
    label: string;
    position: number;
    bedType: string | null;
    status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomTypeOption {
  id: string;
  code: string;
  name: string;
  bedsPerRoom: number;
  defaultBedType: string;
  defaultAmenities: string[];
}

// ========================================
// VALIDATION SCHEMA
// ========================================

export const roomFormSchema = z.object({
  code: z
    .string()
    .min(2, "Kode minimal 2 karakter")
    .max(20, "Kode maksimal 20 karakter"),
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  buildingId: z.string().min(1, "Building ID wajib"),
  roomTypeId: z.string().min(1, "Tipe ruangan wajib dipilih"),
  floorNumber: z.coerce.number().min(1).max(99, "Lantai 1-99"),
  floorName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  allowedOccupantType: z.enum(["EMPLOYEE_ONLY", "ALL"]),
  isBookable: z.boolean(),
  genderPolicy: z.enum(["MALE_ONLY", "FEMALE_ONLY", "MIX", "FLEXIBLE"]),
  pricePerBed: z.coerce.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
});

export type RoomFormInput = z.infer<typeof roomFormSchema>;

import { z } from "zod";

// ========================================
// BUILDING DETAIL RESPONSE TYPES
// ========================================

export interface BuildingDetailData {
  id: string;
  code: string;
  name: string;
  status: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  area: {
    id: string;
    code: string;
    name: string;
    location: string;
  };
  buildingType: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  } | null;
  _count: {
    rooms: number;
    images: number;
    userBuildings: number;
  };
}

export interface BuildingStatsData {
  totalRooms: number;
  totalBeds: number;
  bedsAvailable: number;
  bedsOccupied: number;
  bedsReserved: number;
  bedsMaintenance: number;
  totalImages: number;
  totalPIC: number;
  occupancyRate: number; // Percentage
  status: boolean;
}

export interface FloorWithRooms {
  floorNumber: number;
  floorName: string | null;
  rooms: RoomData[];
  stats: {
    totalRooms: number;
    totalBeds: number;
    bedsAvailable: number;
    bedsOccupied: number;
  };
}

export interface RoomData {
  id: string;
  code: string;
  name: string;
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
  _count: {
    beds: number;
  };
  beds: BedData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BedData {
  id: string;
  code: string;
  label: string;
  position: number;
  bedType: string | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
  notes: string | null;
}

// ========================================
// ROOM FORM SCHEMA
// ========================================

export const roomFormSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(20, { message: "Kode maksimal 20 karakter" })
    .regex(/^[A-Z0-9-]+$/, {
      message: "Kode hanya boleh huruf kapital, angka, dan dash",
    }),
  name: z
    .string()
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  buildingId: z.string().min(1, { message: "Building ID wajib" }),
  roomTypeId: z.string().min(1, { message: "Tipe ruangan wajib dipilih" }),
  floorNumber: z.number().min(1).max(99, { message: "Lantai 1-99" }),
  floorName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  allowedOccupantType: z.enum(["EMPLOYEE_ONLY", "ALL"]),
  isBookable: z.boolean(),
  genderPolicy: z.enum(["MALE_ONLY", "FEMALE_ONLY", "MIX", "FLEXIBLE"]),
  pricePerBed: z.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
});

export type RoomFormInput = z.infer<typeof roomFormSchema>;

// ========================================
// RESPONSE TYPE
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

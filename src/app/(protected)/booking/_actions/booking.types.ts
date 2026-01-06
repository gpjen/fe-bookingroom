import { z } from "zod";

// ========================================
// ENUMS (Match Prisma Schema)
// ========================================

export const BookingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const OccupantType = {
  EMPLOYEE: "EMPLOYEE",
  GUEST: "GUEST",
} as const;

export type OccupantType = (typeof OccupantType)[keyof typeof OccupantType];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

// ========================================
// CONSTANTS
// ========================================

export const BOOKING_CONSTANTS = {
  MAX_OCCUPANTS: 20,
  MIN_DAYS_AHEAD: 1, // Minimal booking untuk besok
  MAX_DURATION_DAYS: 90,
} as const;

// ========================================
// API RESPONSE TYPES
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// ROOM AVAILABILITY TYPES
// ========================================

export interface AreaOption {
  id: string;
  code: string;
  name: string;
}

export interface BuildingOption {
  id: string;
  code: string;
  name: string;
  areaId: string;
}

export interface BedOccupancyInfo {
  id: string;
  checkInDate: Date;
  checkOutDate: Date | null;
  status: string;
  occupantName?: string;
}

export interface BedAvailability {
  id: string;
  code: string;
  label: string;
  position: number;
  bedType: string | null;
  status: string; // Current bed status
  isAvailable: boolean; // Available in requested date range
  occupancies: BedOccupancyInfo[]; // For timeline visualization
}

export interface RoomAvailability {
  id: string;
  code: string;
  name: string;
  floor: number;
  building: {
    id: string;
    code: string;
    name: string;
  };
  area: {
    id: string;
    name: string;
  };
  roomType: {
    id: string;
    code: string;
    name: string;
  };
  genderPolicy: "MALE_ONLY" | "FEMALE_ONLY" | "MIX" | "FLEXIBLE";
  currentGender: string | null;
  capacity: number;
  availableBeds: number;
  beds: BedAvailability[];
  facilities: string[];
  images: {
    id: string;
    filePath: string;
    caption: string | null;
    isPrimary: boolean;
  }[];
}

// ========================================
// BOOKING INPUT SCHEMAS
// ========================================

export const companionSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, "Nama pendamping wajib diisi"),
  nik: z.string().min(1, "NIK pendamping wajib diisi"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
});

export type CompanionInput = z.infer<typeof companionSchema>;

export const occupantInputSchema = z.object({
  bedId: z.string().min(1, "Bed ID wajib"),
  type: z.enum(["EMPLOYEE", "GUEST"]),
  name: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
});

export type OccupantInput = z.infer<typeof occupantInputSchema>;

export const createBookingSchema = z.object({
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  purpose: z.string().optional(),
  projectCode: z.string().optional(),
  notes: z.string().optional(),
  companion: companionSchema.optional(),
  occupants: z
    .array(occupantInputSchema)
    .min(1, "Minimal 1 occupant")
    .max(BOOKING_CONSTANTS.MAX_OCCUPANTS, `Maksimal ${BOOKING_CONSTANTS.MAX_OCCUPANTS} occupant`),
  attachmentIds: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Check if any occupant is GUEST, companion must exist
    const hasGuest = data.occupants.some((o) => o.type === "GUEST");
    if (hasGuest && !data.companion) {
      return false;
    }
    return true;
  },
  {
    message: "Companion wajib diisi jika ada tamu",
    path: ["companion"],
  }
).refine(
  (data) => {
    // Check dates
    return data.checkOutDate > data.checkInDate;
  },
  {
    message: "Tanggal check-out harus setelah check-in",
    path: ["checkOutDate"],
  }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ========================================
// BOOKING OUTPUT TYPES  
// ========================================

export interface BookingListItem {
  id: string;
  code: string;
  status: BookingStatus;
  checkInDate: Date;
  checkOutDate: Date;
  purpose: string | null;
  projectCode: string | null;
  requesterName: string;
  requesterCompany: string | null;
  occupantCount: number;
  createdAt: Date;
}

export interface BookingDetail extends BookingListItem {
  requesterUserId: string;
  requesterNik: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  requesterDepartment: string | null;
  requesterPosition: string | null;
  
  companionName: string | null;
  companionNik: string | null;
  companionEmail: string | null;
  companionPhone: string | null;
  companionCompany: string | null;
  companionDepartment: string | null;
  
  notes: string | null;
  
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  cancelledBy: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  
  occupancies: {
    id: string;
    status: string;
    checkInDate: Date;
    checkOutDate: Date | null;
    occupant: {
      id: string;
      name: string;
      nik: string | null;
      gender: string | null;
      company: string | null;
    };
    bed: {
      id: string;
      code: string;
      label: string;
      room: {
        id: string;
        code: string;
        name: string;
        building: {
          id: string;
          code: string;
          name: string;
        };
      };
    };
  }[];
  
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    description: string | null;
  }[];
  
  updatedAt: Date;
}

// ========================================
// SEARCH PARAMS
// ========================================

export interface GetAvailableRoomsParams {
  areaId: string;
  buildingId?: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomTypeIds?: string[];
  genderPolicy?: string;
}

export interface GetBookingsParams {
  userId?: string;
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

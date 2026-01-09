import { BookingStatus as PrismaBookingStatus, AllowedOccupantType, GenderPolicy } from "@prisma/client";
import { z } from "zod";

// ========================================
// ENUMS (Match Prisma Schema)
// ========================================

export type BookingStatus = (typeof PrismaBookingStatus)[keyof typeof PrismaBookingStatus];

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

// Pending booking request info (before admin approval)
export interface PendingRequestInfo {
  id: string;
  checkInDate: Date;
  checkOutDate: Date;
  bookingCode: string;
  bookingId: string;
}

export interface BedAvailability {
  id: string;
  code: string;
  label: string;
  position: number;
  bedType: string | null;
  isAvailable: boolean; // Available for the ENTIRE requested date range
  hasPendingRequest?: boolean; // Has any pending booking request
  occupancies: BedOccupancyInfo[]; // Confirmed occupancies (RESERVED, CHECKED_IN)
  pendingRequests: PendingRequestInfo[]; // Pending booking requests (with dates!)
}

export interface RoomAvailability {
  id: string;
  code: string;
  name: string;
  floor: number;
  status: string; // Room status (ACTIVE, MAINTENANCE, etc.)
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
  genderPolicy: GenderPolicy;
  currentGender: string | null;
  allowedOccupantType: AllowedOccupantType; // Room allocation type
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
  // Per-occupant dates (within the global booking date range)
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
}).refine(
  (data) => data.checkOutDate > data.checkInDate,
  {
    message: "Tanggal check-out harus setelah check-in",
    path: ["checkOutDate"],
  }
);

export type OccupantInput = z.infer<typeof occupantInputSchema>;

export const createBookingSchema = z.object({
  // Global date range (for reference/display)
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
    // Check global dates
    return data.checkOutDate > data.checkInDate;
  },
  {
    message: "Tanggal check-out harus setelah check-in",
    path: ["checkOutDate"],
  }
).refine(
  (data) => {
    // Validate each occupant's dates are within global range
    for (const occ of data.occupants) {
      if (occ.checkInDate < data.checkInDate) {
        return false;
      }
      if (occ.checkOutDate > data.checkOutDate) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Tanggal penghuni harus dalam rentang tanggal booking",
    path: ["occupants"],
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
  // Dates derived from occupancies (min checkIn, max checkOut)
  checkInDate: Date | null;
  checkOutDate: Date | null;
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

  // Request items (structured data for pending bookings)
  requestItems: {
    id: string;
    bedId: string;
    name: string;
    nik: string | null;
    gender: string;
    type: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    department: string | null;
    checkInDate: Date;
    checkOutDate: Date;
    // Per-item approval tracking
    approvedByNik: string | null;
    approvedByName: string | null;
    approvedAt: Date | null;
    rejectedByNik: string | null;
    rejectedByName: string | null;
    rejectedAt: Date | null;
    rejectedReason: string | null;
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
  
  occupancies: {
    id: string;
    status: string;
    checkInDate: Date;
    checkOutDate: Date | null;
    // Cancellation info
    cancelledAt: Date | null;
    cancelledBy: string | null;
    cancelledByName: string | null;
    cancelledReason: string | null;
    occupant: {
      id: string;
      name: string;
      nik: string | null;
      type: string; // EMPLOYEE | GUEST
      gender: string | null;
      company: string | null;
      department: string | null;
      phone: string | null;
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
  includeFullRooms?: boolean; // If true, include rooms with no available beds
}

export interface GetBookingsParams {
  userId?: string;
  status?: BookingStatus;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Occupancy types and validation schemas

import { z } from "zod";

// ========================================
// ENUMS (match Prisma)
// ========================================

export type OccupantType = "EMPLOYEE" | "GUEST";
export type OccupancyStatus = "PENDING" | "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
export type Gender = "MALE" | "FEMALE";

// ========================================
// RESPONSE TYPE
// ========================================

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// OCCUPANT DATA TYPES (Master Data)
// ========================================

export interface OccupantData {
  id: string;
  type: OccupantType;
  userId: string | null;
  nik: string;
  name: string;
  gender: Gender;
  phone: string | null;
  email: string | null;
  company: string | null;
  department: string | null;
  position: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// OCCUPANCY DATA TYPES
// ========================================

export interface OccupancyData {
  id: string;
  bookingId: string | null;
  occupantId: string;
  bedId: string;
  
  // Occupant Info (joined from Occupant)
  occupant: OccupantData;
  
  // Dates
  checkInDate: Date;
  checkOutDate: Date | null; // Nullable for indefinite stays
  actualCheckIn: Date | null;
  actualCheckOut: Date | null;
  
  // Status
  status: OccupancyStatus;
  qrCode: string | null;
  
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveOccupancyInfo {
  id: string;
  occupant: {
    id: string;
    name: string;
    type: OccupantType;
    gender: Gender;
    company: string | null;
    nik: string;
  };
  checkInDate: Date;
  checkOutDate: Date | null; // Nullable for indefinite stays
  actualCheckIn: Date | null;
  status: OccupancyStatus;
}

export interface BedWithOccupancy {
  id: string;
  code: string;
  label: string;
  position: number;
  bedType: string | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
  notes: string | null;
  activeOccupancy: ActiveOccupancyInfo | null;
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

export const assignOccupantSchema = z.object({
  bedId: z.string().min(1, "Bed ID wajib"),
  
  // Either use existing occupant or create new
  occupantId: z.string().optional().nullable(), // Use existing occupant
  
  // New occupant fields (used when occupantId is not provided)
  occupantType: z.enum(["EMPLOYEE", "GUEST"]).optional(),
  occupantUserId: z.string().optional().nullable(),
  occupantName: z.string().optional(),
  occupantNik: z.string().optional().nullable(),
  occupantGender: z.enum(["MALE", "FEMALE"]).optional(),
  occupantPhone: z.string().optional().nullable(),
  occupantEmail: z.string().email().optional().nullable().or(z.literal("")),
  occupantCompany: z.string().optional().nullable(),
  occupantDepartment: z.string().optional().nullable(),
  occupantPosition: z.string().optional().nullable(),
  
  // Dates
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date().optional().nullable(), // Optional - employee may not have end date
  
  // Options
  autoCheckIn: z.boolean().default(false), // Langsung check-in atau pending
  notes: z.string().optional().nullable(),
}).refine((data) => {
  // Must have either occupantId (existing) or occupantNik (new)
  if (!data.occupantId && !data.occupantNik) {
    return false;
  }
  return true;
}, {
  message: "Harus pilih occupant yang sudah ada atau masukkan NIK baru",
  path: ["occupantNik"],
}).refine((data) => {
  // If new occupant, name and gender are required
  if (!data.occupantId) {
    if (!data.occupantName || data.occupantName.length < 2) {
      return false;
    }
  }
  return true;
}, {
  message: "Nama wajib diisi (minimal 2 karakter)",
  path: ["occupantName"],
}).refine((data) => {
  // If checkOutDate provided, must be after checkInDate
  if (data.checkOutDate) {
    return data.checkOutDate > data.checkInDate;
  }
  return true;
}, {
  message: "Tanggal keluar harus setelah tanggal masuk",
  path: ["checkOutDate"],
});

export type AssignOccupantInput = z.infer<typeof assignOccupantSchema>;

export const transferOccupantSchema = z.object({
  occupancyId: z.string().min(1, "Occupancy ID wajib"),
  targetBedId: z.string().min(1, "Target bed wajib dipilih"),
  
  // Transfer dates
  transferDate: z.coerce.date(), // When to start at new bed (min: today)
  newCheckOutDate: z.coerce.date().optional().nullable(), // New checkout date (optional)
  
  reason: z.string().min(3, "Alasan minimal 3 karakter"),
}).refine((data) => {
  // If newCheckOutDate provided, must be after transferDate
  if (data.newCheckOutDate) {
    return data.newCheckOutDate > data.transferDate;
  }
  return true;
}, {
  message: "Tanggal berakhir harus setelah tanggal transfer",
  path: ["newCheckOutDate"],
});

export type TransferOccupantInput = z.infer<typeof transferOccupantSchema>;

export const checkoutOccupantSchema = z.object({
  occupancyId: z.string().min(1, "Occupancy ID wajib"),
  reason: z.string().optional().nullable(),
});

export type CheckoutOccupantInput = z.infer<typeof checkoutOccupantSchema>;

// ========================================
// OCCUPANCY LOG TYPES (HISTORY)
// ========================================

export type OccupancyLogAction =
  | "CREATED"
  | "CHECKED_IN"
  | "DATE_CHANGED"
  | "TRANSFERRED"
  | "EARLY_CHECKOUT"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "STATUS_CHANGED";

export interface OccupancyLogData {
  id: string;
  occupancyId: string;
  action: OccupancyLogAction;

  // Context: Where did this action occur? (for non-transfer actions)
  bedId: string | null;

  // Transfer info with full location
  fromBedId: string | null;
  toBedId: string | null;
  fromBedInfo: {
    label: string;
    roomName: string;
    buildingName: string;
  } | null;
  toBedInfo: {
    label: string;
    roomName: string;
    buildingName: string;
  } | null;

  // Date change info
  previousCheckInDate: Date | null;
  newCheckInDate: Date | null;
  previousCheckOutDate: Date | null;
  newCheckOutDate: Date | null;

  // Performer
  performedBy: string;
  performedByName: string;
  performedAt: Date;

  reason: string | null;
  notes: string | null;

  // Occupancy info (joined)
  occupancy: {
    id: string;
    occupant: {
      name: string;
      type: OccupantType;
      gender: Gender;
    };
    bookingId: string | null;
    booking: {
      code: string;
    } | null;
    bed: {
      id: string;
      code: string;
      label: string;
      room: {
        name: string;
        building: {
          name: string;
        };
      };
    };
  };
}

export interface RoomHistoryFilter {
  limit?: number;
  offset?: number;
  actionFilter?: OccupancyLogAction[];
  dateFrom?: Date;
  dateTo?: Date;
}

// ========================================
// SEARCH/LOOKUP TYPES
// ========================================

export interface OccupantSearchResult {
  id: string;
  type: OccupantType;
  nik: string;
  name: string;
  gender: Gender;
  company: string | null;
  department: string | null;
  hasActiveStay: boolean;
  activeStayArea: string | null;
}

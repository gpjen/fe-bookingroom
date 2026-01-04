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
// OCCUPANCY DATA TYPES
// ========================================

export interface OccupancyData {
  id: string;
  bookingId: string | null;
  bedId: string;
  
  // Occupant Info
  occupantType: OccupantType;
  occupantUserId: string | null;
  occupantName: string;
  occupantNik: string | null;
  occupantGender: Gender;
  occupantPhone: string | null;
  occupantEmail: string | null;
  occupantCompany: string | null;
  occupantDepartment: string | null;
  occupantPosition: string | null;
  
  // Dates
  checkInDate: Date;
  checkOutDate: Date;
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
  occupantName: string;
  occupantType: OccupantType;
  occupantGender: Gender;
  occupantCompany: string | null;
  checkInDate: Date;
  checkOutDate: Date;
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
  occupantType: z.enum(["EMPLOYEE", "GUEST"]),
  
  // Occupant Identity
  occupantUserId: z.string().optional().nullable(),
  occupantName: z.string().min(2, "Nama minimal 2 karakter"),
  occupantNik: z.string().optional().nullable(),
  occupantGender: z.enum(["MALE", "FEMALE"]),
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

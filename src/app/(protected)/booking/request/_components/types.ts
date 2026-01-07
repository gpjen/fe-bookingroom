// ==========================================
// SHARED TYPES FOR BOOKING FEATURE
// Import enums directly from Prisma Client
// ==========================================

import type { 
  BookingStatus, 
  OccupancyStatus, 
  Gender, 
  OccupantType 
} from "@prisma/client";

// Re-export Prisma types for convenience
export type { BookingStatus, OccupancyStatus, Gender, OccupantType };

// ==========================================
// UI CONFIG (for displaying status badges, etc)
// ==========================================

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  color: string;
  className: string;
}> = {
  PENDING: {
    label: "Menunggu",
    color: "yellow",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  APPROVED: {
    label: "Disetujui",
    color: "blue",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  REJECTED: {
    label: "Ditolak",
    color: "red",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "gray",
    className: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  },
};

export const OCCUPANCY_STATUS_CONFIG: Record<OccupancyStatus, {
  label: string;
  color: string;
}> = {
  PENDING: { label: "Menunggu", color: "yellow" },
  RESERVED: { label: "Terjadwal", color: "blue" },
  CHECKED_IN: { label: "Check-In", color: "green" },
  CHECKED_OUT: { label: "Check-Out", color: "gray" },
  CANCELLED: { label: "Batal", color: "red" },
  NO_SHOW: { label: "Tidak Hadir", color: "orange" },
};

export const GENDER_CONFIG: Record<Gender, {
  label: string;
  short: string;
}> = {
  MALE: { label: "Laki-laki", short: "L" },
  FEMALE: { label: "Perempuan", short: "P" },
};

export const OCCUPANT_TYPE_CONFIG: Record<OccupantType, {
  label: string;
  color: string;
}> = {
  EMPLOYEE: { label: "Karyawan", color: "blue" },
  GUEST: { label: "Tamu", color: "amber" },
};

// ==========================================
// TABLE TYPES (for DataTable display)
// ==========================================

export interface BookingTableItem {
  id: string;
  bookingCode: string;
  requesterName: string;
  requesterCompany: string;
  status: BookingStatus;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  occupantCount: number;
  purpose: string;
  areaName: string;
  hasGuest: boolean;
  createdAt: Date;
}

// ==========================================
// DIALOG TYPES (for BookingDetailDialog)
// ==========================================

export interface CompanionInfo {
  name: string | null;
  nik: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  department: string | null;
}

export interface BookingAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description: string | null;
}

// This is the structure returned by the API (nested)
export interface BookingOccupancy {
  id: string;
  status: OccupancyStatus;
  checkInDate: Date;
  checkOutDate: Date | null;
  occupant: {
    id: string;
    name: string;
    nik: string | null;
    gender: Gender | null;
    type: "EMPLOYEE" | "GUEST" | null; // Placeholder as DB doesn't have type on occupant yet
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
}

export interface BookingDetailData {
  id: string;
  code: string;
  status: BookingStatus;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  requesterUserId: string;
  requesterName: string;
  requesterNik: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  requesterCompany: string | null;
  requesterDepartment: string | null;
  requesterPosition: string | null;
  
  companion: CompanionInfo | null;
  
  purpose: string | null;
  projectCode: string | null;
  notes: string | null;
  
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  cancelledBy: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  
  occupants: BookingOccupant[]; // Use flat structure for compatibility
  attachments: BookingAttachment[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// LEGACY TYPES (Backward Compatibility)
// Keeping these to avoid breaking 11+ files
// ==========================================

export interface BookingOccupant {
  id: string; 
  name: string;
  identifier: string; // NIK or KTP/Passport
  type: "employee" | "guest"; 
  gender: "L" | "P"; 
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  department?: string | null;
  
  // Form state fields
  inDate?: Date;
  outDate?: Date;
  duration?: number;
  
  // Display/Response properties (optional)
  status?: OccupancyStatus;
  buildingName?: string;
  roomCode?: string;
  bedCode?: string;
  actualCheckInAt?: Date | null;
  actualCheckOutAt?: Date | null;
  cancelledReason?: string | null;
  
  // Selection IDs (for form usage)
  buildingId?: string;
  roomId?: string;
  bedId?: string;
}

export type BookingRequest = BookingDetailData; 
export const BookingType = {
  INDIVIDUAL: "individual",
  GROUP: "group"
} as const;

// Legacy alias for status if needed
// export const OccupantStatus = OccupancyStatus;

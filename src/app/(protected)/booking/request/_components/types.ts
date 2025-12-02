export type BookingStatus =
  | "request"
  | "cancelled"
  | "approved"
  | "rejected"
  | "checkin"
  | "checkout";

export type BookingType = "employee" | "guest" | "others";
export type Gender = "L" | "P";

/**
 * Represents an individual who will be staying.
 */
export interface Occupant {
  id: string;
  name: string;
  identifier: string; // NIK for employees, KTP/Passport for guests
  type: BookingType;
  gender: Gender;
  phone?: string;
  company?: string;
  department?: string;
}

/**
 * Represents the final placement information for an occupant.
 * This is usually filled after the booking is approved.
 */
export interface PlacementInfo {
  occupantId: string;
  areaId: string;
  buildingId: string;
  roomId: string;
  bedId?: string; // Optional, for rooms with multiple beds
}

/**
 * Represents the initial booking request made by a user.
 */
export interface BookingRequest {
  id: string;
  bookingCode: string;

  // User Information (Requester)
  requester: {
    name: string;
    nik: string;
    email: string;
    phone: string;
    company: string;
    department: string;
  };

  // List of people who will be staying
  occupants: Occupant[];

  // Location preference from the requester
  // Can be just an area, or a specific building. Room is not requested here.
  requestedLocation: {
    areaId: string;
    areaName: string;
    buildingId?: string;
    buildingName?: string;
  };

  // Final assigned placements for occupants
  // This is usually populated after approval.
  placements: PlacementInfo[];

  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  durationInDays: number;

  // Status & Workflow
  status: BookingStatus;

  // Notes & Reason
  purpose: string;
  notes?: string;
  adminNotes?: string;

  // Timestamps
  requestedAt: Date;
  verifiedAt?: Date;
  approvedAt?: Date;
  verifiedBy?: string; // Should be a user ID or name
  approvedBy?: string; // Should be a user ID or name
}
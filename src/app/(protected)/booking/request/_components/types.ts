export type BookingStatus =
  | "request"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type OccupantStatus =
  | "scheduled"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type BookingType = "employee" | "guest";
export type Gender = "L" | "P";
export type RoomType = "standard" | "vip" | "vvip" | "suite";

export interface BookingAttachment {
  id: string;
  name: string;
  url: string;
  type: "document" | "image";
}

/**
 * Companion info for guest occupants
 * Contains employee details who accompanies the guest
 */
export interface CompanionInfo {
  nik: string;
  name: string;
  company?: string;
  department?: string;
  email?: string;
  phone?: string;
}

/**
 * History log for room changes (move/extend)
 */
export interface OccupantHistoryLog {
  fromRoomId?: string;
  fromBedId?: string;
  toRoomId?: string;
  toBedId?: string;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

/**
 * Occupant - unified type for both form input and stored data
 * Used for booking request form and displaying booking details
 */
export interface BookingOccupant {
  id: string;
  name: string;
  identifier: string; // NIK for employee, ID/Passport for guest
  type: BookingType;
  gender: Gender;

  phone?: string;
  email?: string;
  company?: string;
  department?: string;

  // Status fields (set by system, optional for form)
  status?: OccupantStatus;
  cancelledAt?: Date;
  cancelReason?: string;

  // Planned stay dates
  inDate: Date;
  outDate?: Date;
  duration?: number; // in days

  // Actual check-in/out timestamps (set by admin)
  actualCheckInAt?: Date;
  actualCheckOutAt?: Date;

  // Location assignment
  areaId?: string;
  areaName?: string;
  buildingId?: string;
  buildingName?: string;
  roomId?: string;
  roomCode?: string;
  bedId?: string;
  bedCode?: string;

  // History log for move/extend
  history?: OccupantHistoryLog[];
}

/**
 * Booking Request - main booking entity
 */
export interface BookingRequest {
  id: string;
  bookingCode: string;

  requester: {
    name: string;
    nik: string;
    department: string;
    company: string;
    email: string;
    phone: string;
  };

  // Primary area requested (mandatory)
  areaId: string;

  // Companion info - required when any occupant is a guest
  companion?: CompanionInfo;

  // Occupants
  occupants: BookingOccupant[];

  attachments: BookingAttachment[];

  purpose: string;
  notes?: string;

  status: BookingStatus;
  rejectReason?: string;
  adminNotes?: string;

  requestedAt: Date;
  expiresAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;

  updatedAt?: Date;
  cancelledAt?: Date;
}

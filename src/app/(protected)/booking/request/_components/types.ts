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
 * Location assignment for an occupant
 * Can be set by requester (optional) or admin (when approving)
 */
export interface OccupantLocation {
  areaId?: string;
  buildingId?: string;
  roomId?: string;
  bedId?: string;
}

/**
 * History log for room changes (move/extend)
 */
export interface OccupantHistoryLog {
  fromLocation?: OccupantLocation;
  toLocation?: OccupantLocation;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

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

  // Companion info - required for guest type occupants
  // Contains the employee who accompanies this guest
  companion?: CompanionInfo;

  status: OccupantStatus;
  cancelledAt?: Date;
  cancelReason?: string;

  // Planned stay dates (from booking request)
  inDate: Date;
  outDate?: Date;
  duration?: number; // in days

  // Actual check-in/out timestamps (set when status changes)
  actualCheckInAt?: Date;
  actualCheckOutAt?: Date;

  // Location assignment (optional - can be set by requester or admin)
  // Requester: can request specific area/building
  // Admin: assigns room and bed when approving
  areaId?: string;
  buildingId?: string;
  roomId?: string;
  bedId?: string;

  // Log history for move/extend
  history?: OccupantHistoryLog[];
}

/**
 * Form data for occupant - used in booking request forms
 * Extends BookingOccupant with display codes for UI
 * Each occupant can have their own location (area/building/room/bed)
 */
export interface OccupantFormData {
  id: string;
  name: string;
  identifier: string; // NIK for employee, ID/Passport for guest
  type: BookingType;
  gender: Gender;

  phone?: string;
  email?: string;
  company?: string;
  department?: string;

  // Companion info - required for guest type occupants
  companion?: CompanionInfo;

  // Planned stay dates
  inDate: Date;
  outDate: Date;
  duration?: number; // in days

  // Location assignment - each occupant can have different location
  // Requester must select area first, then can optionally select building/room/bed
  areaId?: string;
  areaName?: string; // Display name for UI
  buildingId?: string;
  buildingName?: string; // Display name for UI
  roomId?: string;
  roomCode?: string; // Display code for UI (e.g., "R-101")
  bedId?: string;
  bedCode?: string; // Display code for UI (e.g., "A", "B")
}

/**
 * Booking Request - main booking entity
 * 
 * Location hierarchy:
 * - areaId: Required. Requester MUST select an area first
 * - Each occupant can have their own location (building/room/bed) within the same area
 *   which allows flexibility for different occupants to stay in different buildings
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
  // Requester MUST select area first - this determines available buildings for occupants
  areaId: string;

  // Occupants - each can have their own location assignment (building/room/bed)
  // Use BookingOccupant for stored data, OccupantFormData for form input
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

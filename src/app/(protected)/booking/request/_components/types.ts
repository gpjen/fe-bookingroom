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

export interface BookingAttachment {
  id: string;
  name: string;
  url: string;
  type: "document" | "image";
}

export interface BookingOccupant {
  id: string;
  name: string;
  identifier: string; // NIK for employee, ID/Passport for guest
  type: BookingType;
  gender: Gender;

  phone?: string;
  company?: string;
  department?: string;

  // Mark if this employee is a companion for a guest
  isPendamping?: boolean;

  status: OccupantStatus;
  cancelledAt?: Date;
  cancelReason?: string;

  // Planned stay dates (from booking request)
  inDate: Date; // Planned date
  outDate?: Date; // Planned date
  duration?: number; // Planned duration in days

  // Actual check-in/out timestamps (set when status changes)
  actualCheckInAt?: Date; // Actual check-in timestamp
  actualCheckOutAt?: Date; // Actual check-out timestamp

  // Room assignment (optional - can be set by requester or admin)
  roomId?: string;
  bedId?: string;

  // Log history for move/extend
  history?: {
    fromRoomId?: string;
    toRoomId?: string;
    changedAt: Date;
    reason?: string;
  }[];
}

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

  // Main location (mandatory)
  areaId: string;
  buildingId: string;

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

export interface OccupantFormData {
  id: string;
  name: string;
  identifier: string;
  type: BookingType;
  gender: Gender;
  phone?: string;
  company?: string;
  department?: string;
  isPendamping?: boolean;
  inDate?: Date;
  outDate?: Date;
  duration?: number;
  roomId?: string;
  roomCode?: string;
  bedId?: string;
  bedCode?: string;
}

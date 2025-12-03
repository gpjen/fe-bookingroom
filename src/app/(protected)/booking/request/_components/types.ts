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

export type BookingType = "employee" | "guest" | "others";
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
  identifier: string;
  type: BookingType;
  gender: Gender;

  phone?: string;
  company?: string;
  department?: string;

  status: OccupantStatus;
  cancelledAt?: Date;
  cancelReason?: string;

  checkInDate: Date;
  checkOutDate?: Date;
  duration?: number;

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

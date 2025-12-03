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

export type RequestType =
  | "new"
  | "extend"
  | "move"
  | "additional_occupant"
  | "change_bed"
  | "change_room_type"
  | "terminate";

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

  // Location
  areaId: string;
  buildingId?: string;
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
  requestType: RequestType;

  requester: {
    name: string;
    nik: string;
    department: string;
    company: string;
    email: string;
    phone: string;
  };

  // General preference (optional)
  areaId: string;
  buildingId?: string;
  roomTypeId?: string;

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

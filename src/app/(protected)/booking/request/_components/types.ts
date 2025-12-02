export type BookingStatus =
  | "request"
  | "cancelled"
  | "approved"
  | "rejected"
  | "checkin"
  | "checkout";

export type BookingType = "employee" | "guest" | "others";

export interface BookingRequest {
  id: string;
  bookingCode: string;

  // User Information
  requester: {
    name: string;
    nik: string;
    email: string;
    phone: string;
    company: string;
    department: string;
  };

  // Booking Details
  bookingType: BookingType;
  guestInfo?: {
    name: string;
    idNumber: string;
    phone: string;
    company?: string;
    gender: "L" | "P";
  };

  // Room Information
  area: string;
  building: string;
  buildingId: string;
  room: string;
  roomId: string;
  bedCode?: string;

  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  duration: number;

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
  verifiedBy?: string;
  approvedBy?: string;
}

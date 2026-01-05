// Types for occupants management

import { z } from "zod";

// ========================================
// ACTION RESPONSE TYPE
// ========================================

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ========================================
// ENUMS (matching Prisma enums)
// ========================================

export type OccupantType = "EMPLOYEE" | "GUEST";
export type OccupancyStatus = "PENDING" | "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
export type Gender = "MALE" | "FEMALE";

// ========================================
// PAGINATION TYPES
// ========================================

export interface PaginationParams {
  page: number;      // 1-indexed page number
  pageSize: number;  // Items per page (default: 20, max: 100)
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ========================================
// FILTER TYPES
// ========================================

export interface OccupantFilters {
  // Search (name, NIK, email, phone, company)
  search?: string;
  
  // Status filter (multiple allowed)
  status?: OccupancyStatus[];
  
  // Type filter
  occupantType?: OccupantType;
  
  // Gender filter
  gender?: Gender;
  
  // Location filters
  areaId?: string;
  buildingId?: string;
  
  // Date range filters
  checkInFrom?: Date;
  checkInTo?: Date;
  checkOutFrom?: Date;
  checkOutTo?: Date;
  
  // Booking filter
  hasBooking?: boolean; // true = with booking, false = direct placement, undefined = all
  
  // Active only (PENDING, RESERVED, CHECKED_IN)
  activeOnly?: boolean;
}

export interface SortParams {
  field: "occupantName" | "checkInDate" | "checkOutDate" | "status" | "createdAt" | "buildingName";
  direction: "asc" | "desc";
}

// ========================================
// OCCUPANT LIST ITEM (for table)
// ========================================

export interface OccupantListItem {
  id: string; // This is now OCCUPANT ID (User ID), not Occupancy ID
  
  // Occupant Info (from Occupant table)
  occupantId: string; // Redundant but kept for compatibility logic (same as id)
  occupantName: string;
  occupantNik: string;
  occupantType: OccupantType;
  occupantGender: Gender;
  occupantPhone: string | null;
  occupantEmail: string | null;
  occupantCompany: string | null;

  // Primary/Latest Occupancy Info (Flattened for Table Display)
  // If multiple active, this shows the "most relevant" one.
  primaryOccupancyId: string | null;
  checkInDate: Date | null;
  checkOutDate: Date | null; 
  actualCheckIn: Date | null;
  actualCheckOut: Date | null;
  status: OccupancyStatus | null; // Null if no history?
  
  // Location Info (Latest)
  bedId: string | null;
  bedCode: string | null;
  bedLabel: string | null;
  roomId: string | null;
  roomCode: string | null;
  roomName: string | null;
  floorNumber: number | null;
  buildingId: string | null;
  buildingCode: string | null;
  buildingName: string | null;
  areaId: string | null;
  areaName: string | null;
  
  // Booking Info (optional)
  bookingId: string | null;
  bookingCode: string | null;

  // Aggregates
  activeOccupancyCount: number;
  totalOccupancyCount: number;
  
  // Metadata
  createdAt: Date;
  createdBy: string | null;
  createdByName: string | null;
}

// ========================================
// OCCUPANCY DETAIL (Nested in Occupant)
// ========================================

export interface OccupancyLogItem {
    id: string;
    action: OccupancyLogAction;
    
    // Transfer details
    fromBedId: string | null;
    toBedId: string | null;
    fromBedCode: string | null;
    toBedCode: string | null;
    
    // Date change details
    previousCheckInDate: Date | null;
    newCheckInDate: Date | null;
    previousCheckOutDate: Date | null;
    newCheckOutDate: Date | null;
    
    // Performer
    performedBy: string;
    performedByName: string;
    performedAt: Date;
    
    // Details
    reason: string | null;
    notes: string | null;
  
    // Context (Resolved for display)
    buildingName: string;
    roomCode: string;
    bedCode: string;
}

export interface OccupancyDetailItem {
    id: string;
    status: OccupancyStatus;
    
    checkInDate: Date;
    checkOutDate: Date | null;
    originalCheckOutDate: Date | null;
    actualCheckIn: Date | null;
    actualCheckOut: Date | null;
    
    notes: string | null;
    qrCode: string | null;
    
    // Location
    bed: {
        id: string;
        code: string;
        label: string;
        room: {
            id: string;
            code: string;
            name: string;
            floorNumber: number;
            building: {
                id: string;
                name: string;
                area: {
                    name: string;
                }
            }
        }
    };
    
    // Booking
    booking: {
        id: string;
        code: string;
        purpose: string | null;
    } | null;

    // Logs
    logs: OccupancyLogItem[];
}

// ========================================
// OCCUPANT DETAIL (full info + history)
// ========================================

export interface OccupantDetail extends OccupantListItem {
  // Additional occupant info
  occupantUserId: string | null;
  occupantDepartment: string | null;
  occupantPosition: string | null;
  
  // List of all occupancies (Active & History)
  occupancies: OccupancyDetailItem[];
  
  updatedAt: Date;
}

// ========================================
// OCCUPANT LOG ACTION
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

// Alias for backward compat if needed (though we changed structure)
export type OccupantLogItem = OccupancyLogItem;

// ========================================
// FILTER OPTIONS (for dropdowns)
// ========================================

export interface FilterOptions {
  areas: { id: string; code: string; name: string }[];
  buildings: { id: string; code: string; name: string; areaId: string }[];
  statuses: { value: OccupancyStatus; label: string; count: number }[];
}

// ========================================
// QUERY PARAMS SCHEMA (for URL state)
// ========================================

export const occupantQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(100).default(20),
  
  // Search
  search: z.string().optional(),
  
  // Filters
  status: z.string().optional(), // comma-separated: "CHECKED_IN,RESERVED"
  occupantType: z.enum(["EMPLOYEE", "GUEST"]).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  areaId: z.string().optional(),
  buildingId: z.string().optional(),
  hasBooking: z.enum(["true", "false"]).optional(),
  activeOnly: z.enum(["true", "false"]).optional(),
  
  // Date filters
  checkInFrom: z.string().optional(),
  checkInTo: z.string().optional(),
  checkOutFrom: z.string().optional(),
  checkOutTo: z.string().optional(),
  
  // Sort
  sortField: z.enum(["occupantName", "checkInDate", "checkOutDate", "status", "createdAt", "buildingName"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type OccupantQueryParams = z.infer<typeof occupantQuerySchema>;

// ========================================
// STATS TYPE
// ========================================

export interface OccupantStats {
  total: number;
  pending: number;
  reserved: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  noShow: number;
}

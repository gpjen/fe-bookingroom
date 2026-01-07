"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";
import type {
  ActionResponse,
  RoomAvailability,
  BedAvailability,
  BookingListItem,
  BookingDetail,
  GetAvailableRoomsParams,
  GetBookingsParams,
  CreateBookingInput,
  AreaOption,
  BuildingOption,
} from "./booking.types";

import {
  createBookingSchema,
  BOOKING_CONSTANTS,
} from "./booking.types";
import { addDays, startOfDay, format } from "date-fns";

// Re-export types for consumers
// Re-export types removed to avoid reference errors. Import from booking.types.ts directly.

// ========================================
// HELPER: Generate Booking Code
// ========================================

async function generateBookingCode(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `BK-${today}-`;

  // Get count of bookings today
  const count = await prisma.booking.count({
    where: {
      code: {
        startsWith: prefix,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(3, "0");
  return `${prefix}${sequence}`;
}

// ========================================
// HELPER: Calculate Booking Dates from Occupancies
// ========================================

interface OccupancyDates {
  checkInDate: Date;
  checkOutDate: Date | null;
}

function calculateBookingDates(occupancies: OccupancyDates[]): {
  checkInDate: Date | null;
  checkOutDate: Date | null;
} {
  if (!occupancies || occupancies.length === 0) {
    return { checkInDate: null, checkOutDate: null };
  }

  const checkInDates = occupancies.map(o => o.checkInDate).filter(Boolean);
  const checkOutDates = occupancies.map(o => o.checkOutDate).filter(Boolean) as Date[];

  return {
    checkInDate: checkInDates.length > 0 
      ? new Date(Math.min(...checkInDates.map(d => d.getTime()))) 
      : null,
    checkOutDate: checkOutDates.length > 0 
      ? new Date(Math.max(...checkOutDates.map(d => d.getTime()))) 
      : null,
  };
}

// ========================================
// GET AREAS (for filter dropdown)
// ========================================

export async function getAreasForBooking(): Promise<ActionResponse<AreaOption[]>> {
  try {
    const areas = await prisma.area.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: areas };
  } catch (error) {
    console.error("[GET_AREAS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data area" };
  }
}

// ========================================
// GET BUILDINGS BY AREA (for filter dropdown)
// ========================================

export async function getBuildingsByArea(
  areaId: string
): Promise<ActionResponse<BuildingOption[]>> {
  try {
    const buildings = await prisma.building.findMany({
      where: {
        areaId,
        status: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        areaId: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: buildings };
  } catch (error) {
    console.error("[GET_BUILDINGS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data gedung" };
  }
}

// ========================================
// GET AVAILABLE ROOMS
// ========================================

export async function getAvailableRooms(
  params: GetAvailableRoomsParams
): Promise<ActionResponse<RoomAvailability[]>> {
  try {
    const { areaId, buildingId, checkInDate, checkOutDate, roomTypeIds, genderPolicy } = params;

    // Validate dates
    const tomorrow = startOfDay(addDays(new Date(), BOOKING_CONSTANTS.MIN_DAYS_AHEAD));
    if (startOfDay(checkInDate) < tomorrow) {
      return { success: false, error: "Tanggal check-in minimal besok" };
    }

    const maxCheckOut = addDays(checkInDate, BOOKING_CONSTANTS.MAX_DURATION_DAYS);
    if (checkOutDate > maxCheckOut) {
      return { success: false, error: `Maksimal durasi ${BOOKING_CONSTANTS.MAX_DURATION_DAYS} hari` };
    }

    // Build where clause for rooms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomWhere: any = {
      status: "ACTIVE",
      building: {
        areaId,
        status: true,
      },
    };

    if (buildingId) {
      roomWhere.buildingId = buildingId;
    }

    if (roomTypeIds && roomTypeIds.length > 0) {
      roomWhere.roomTypeId = { in: roomTypeIds };
    }

    if (genderPolicy) {
      roomWhere.genderPolicy = genderPolicy;
    }

    // Fetch rooms with beds and their occupancies in the date range
    const rooms = await prisma.room.findMany({
      where: roomWhere,
      include: {
        building: {
          select: {
            id: true,
            code: true,
            name: true,
            area: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        roomType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        beds: {
          where: {
            status: { not: "BLOCKED" }, // Exclude blocked beds
          },
          orderBy: { position: "asc" },
          include: {
            occupancies: {
              where: {
                // Get occupancies that overlap with requested date range
                // An occupancy overlaps if: its start < requested end AND its end > requested start
                AND: [
                  { checkInDate: { lt: checkOutDate } },
                  {
                    OR: [
                      { checkOutDate: { gt: checkInDate } },
                      { checkOutDate: null }, // Open-ended occupancy
                    ],
                  },
                  {
                    status: {
                      in: ["PENDING", "RESERVED", "CHECKED_IN"],
                    },
                  },
                ],
              },
              select: {
                id: true,
                checkInDate: true,
                checkOutDate: true,
                status: true,
                occupant: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { checkInDate: "asc" },
            },
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: {
            id: true,
            filePath: true,
            caption: true,
            isPrimary: true,
          },
        },
      },
      orderBy: [
        { building: { name: "asc" } },
        { floorNumber: "asc" },
        { name: "asc" },
      ],
    });

    // Transform to RoomAvailability format
    const result: RoomAvailability[] = rooms.map((room) => {
      const beds: BedAvailability[] = room.beds.map((bed) => {
        // A bed is available if it has no overlapping occupancies
        const isAvailable = bed.occupancies.length === 0 && bed.status !== "MAINTENANCE";

        return {
          id: bed.id,
          code: bed.code,
          label: bed.label,
          position: bed.position,
          bedType: bed.bedType,
          status: bed.status,
          isAvailable,
          occupancies: bed.occupancies.map((occ) => ({
            id: occ.id,
            checkInDate: occ.checkInDate,
            checkOutDate: occ.checkOutDate,
            status: occ.status,
            occupantName: occ.occupant?.name,
          })),
        };
      });

      const availableBeds = beds.filter((b) => b.isAvailable).length;

      return {
        id: room.id,
        code: room.code,
        name: room.name,
        floor: room.floorNumber,
        building: {
          id: room.building.id,
          code: room.building.code,
          name: room.building.name,
        },
        area: {
          id: room.building.area.id,
          name: room.building.area.name,
        },
        roomType: {
          id: room.roomType.id,
          code: room.roomType.code,
          name: room.roomType.name,
        },
        genderPolicy: room.genderPolicy as "MALE_ONLY" | "FEMALE_ONLY" | "MIX" | "FLEXIBLE",
        currentGender: room.currentGender,
        capacity: room.beds.length,
        availableBeds,
        beds,
        facilities: [], // TODO: Add facilities if needed
        images: room.images,
      };
    });

    // Filter rooms that have at least one available bed
    const availableRooms = result.filter((r) => r.availableBeds > 0);

    return { success: true, data: availableRooms };
  } catch (error) {
    console.error("[GET_AVAILABLE_ROOMS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data ketersediaan kamar" };
  }
}

// ========================================
// CREATE BOOKING REQUEST
// ========================================

export async function createBookingRequest(
  input: CreateBookingInput
): Promise<ActionResponse<{ id: string; code: string }>> {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validation = createBookingSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const data = validation.data;

    // Validate dates again server-side
    const tomorrow = startOfDay(addDays(new Date(), BOOKING_CONSTANTS.MIN_DAYS_AHEAD));
    if (startOfDay(data.checkInDate) < tomorrow) {
      return { success: false, error: "Tanggal check-in minimal besok" };
    }

    // Get requester info from session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    // Validate all beds are available (double-check)
    const bedIds = data.occupants.map((o) => o.bedId);
    const beds = await prisma.bed.findMany({
      where: { id: { in: bedIds } },
      include: {
        occupancies: {
          where: {
            AND: [
              { checkInDate: { lt: data.checkOutDate } },
              {
                OR: [
                  { checkOutDate: { gt: data.checkInDate } },
                  { checkOutDate: null },
                ],
              },
              {
                status: {
                  in: ["PENDING", "RESERVED", "CHECKED_IN"],
                },
              },
            ],
          },
        },
      },
    });

    // Check if all beds exist
    if (beds.length !== bedIds.length) {
      return { success: false, error: "Beberapa bed tidak ditemukan" };
    }

    // Check if any bed has conflicts
    const conflictedBeds = beds.filter((b) => b.occupancies.length > 0);
    if (conflictedBeds.length > 0) {
      const codes = conflictedBeds.map((b) => b.code).join(", ");
      return { success: false, error: `Bed ${codes} sudah terisi dalam rentang tanggal tersebut` };
    }

    // Generate booking code
    const bookingCode = await generateBookingCode();

    // Create booking with transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          code: bookingCode,
          requesterUserId: user.id || user.sub || "unknown",
          requesterName: user.name || "Unknown",
          requesterNik: user.nik || null,
          requesterEmail: user.email || null,
          requesterPhone: null,
          requesterCompany: null,
          requesterDepartment: null,
          requesterPosition: null,
          
          companionUserId: data.companion?.userId || null,
          companionName: data.companion?.name || null,
          companionNik: data.companion?.nik || null,
          companionEmail: data.companion?.email || null,
          companionPhone: data.companion?.phone || null,
          companionCompany: data.companion?.company || null,
          companionDepartment: data.companion?.department || null,
          
          // Note: checkInDate/checkOutDate are now at Occupancy level
          purpose: data.purpose || null,
          projectCode: data.projectCode || null,
          notes: data.notes || null,
          
          status: "PENDING",
        },
      });

      // Note: Occupancies will be created when booking is APPROVED
      // For now, we just store the booking request

      return newBooking;
    });

    revalidatePath("/booking/mine");
    revalidatePath("/booking/admin");

    return {
      success: true,
      data: { id: booking.id, code: booking.code },
    };
  } catch (error) {
    console.error("[CREATE_BOOKING_ERROR]", error);
    return { success: false, error: "Gagal membuat booking" };
  }
}

// ========================================
// GET MY BOOKINGS
// ========================================

export async function getMyBookings(
  params?: GetBookingsParams
): Promise<ActionResponse<{ data: BookingListItem[]; total: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const userId = user.id || user.sub;

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      requesterUserId: userId,
    };

    if (params?.status) {
      where.status = params.status;
    }

    // Date range filter
    if (params?.dateFrom || params?.dateTo) {
      where.checkInDate = {};
      if (params.dateFrom) {
        where.checkInDate.gte = params.dateFrom;
      }
      if (params.dateTo) {
        where.checkInDate.lte = params.dateTo;
      }
    }

    // Search filter
    if (params?.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { purpose: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          purpose: true,
          projectCode: true,
          requesterName: true,
          requesterCompany: true,
          createdAt: true,
          occupancies: {
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const result: BookingListItem[] = bookings.map((b) => {
      // Calculate dates from occupancies
      const checkInDates = b.occupancies.map(o => o.checkInDate).filter(Boolean);
      const checkOutDates = b.occupancies.map(o => o.checkOutDate).filter(Boolean) as Date[];
      
      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingListItem["status"],
        checkInDate: checkInDates.length > 0 ? new Date(Math.min(...checkInDates.map(d => d.getTime()))) : null,
        checkOutDate: checkOutDates.length > 0 ? new Date(Math.max(...checkOutDates.map(d => d.getTime()))) : null,
        purpose: b.purpose,
        projectCode: b.projectCode,
        requesterName: b.requesterName,
        requesterCompany: b.requesterCompany,
        occupantCount: b.occupancies.length,
        createdAt: b.createdAt,
      };
    });

    return { success: true, data: { data: result, total } };
  } catch (error) {
    console.error("[GET_MY_BOOKINGS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data booking" };
  }
}

// ========================================
// ADMIN: GET ALL BOOKINGS (with filters)
// ========================================

export interface GetAllBookingsParams {
  search?: string;
  status?: string; // 'all' or BookingStatus
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface BookingListItemExtended extends BookingListItem {
  areaName?: string;
  hasGuest: boolean;
  companionName?: string;
  notes?: string;
}

export async function getAllBookings(
  params?: GetAllBookingsParams
): Promise<ActionResponse<{ data: BookingListItemExtended[]; total: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // TODO: Check admin permission here

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Status filter
    if (params?.status && params.status !== "all") {
      where.status = params.status;
    }

    // Date range filter (check-in date)
    if (params?.dateFrom || params?.dateTo) {
      where.checkInDate = {};
      if (params.dateFrom) {
        where.checkInDate.gte = params.dateFrom;
      }
      if (params.dateTo) {
        where.checkInDate.lte = params.dateTo;
      }
    }

    // Search filter
    if (params?.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      where.OR = [
        { code: { contains: searchTerm, mode: "insensitive" } },
        { requesterName: { contains: searchTerm, mode: "insensitive" } },
        { requesterNik: { contains: searchTerm, mode: "insensitive" } },
        { purpose: { contains: searchTerm, mode: "insensitive" } },
        { projectCode: { contains: searchTerm, mode: "insensitive" } },
        { companionName: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          purpose: true,
          projectCode: true,
          notes: true,
          requesterName: true,
          requesterCompany: true,
          companionName: true,
          createdAt: true,
          occupancies: {
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              occupant: {
                select: {
                  type: true,
                },
              },
              bed: {
                select: {
                  room: {
                    select: {
                      building: {
                        select: {
                          area: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const result: BookingListItemExtended[] = bookings.map((b) => {
      // Get area name from first occupancy
      const areaName = b.occupancies[0]?.bed?.room?.building?.area?.name || undefined;
      
      // Check if any occupant is a guest
      const hasGuest = b.occupancies.some((o) => o.occupant?.type === "GUEST");

      // Calculate dates from occupancies
      const checkInDates = b.occupancies.map(o => o.checkInDate).filter(Boolean);
      const checkOutDates = b.occupancies.map(o => o.checkOutDate).filter(Boolean) as Date[];

      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingListItem["status"],
        checkInDate: checkInDates.length > 0 ? new Date(Math.min(...checkInDates.map(d => d.getTime()))) : null,
        checkOutDate: checkOutDates.length > 0 ? new Date(Math.max(...checkOutDates.map(d => d.getTime()))) : null,
        purpose: b.purpose,
        projectCode: b.projectCode,
        requesterName: b.requesterName,
        requesterCompany: b.requesterCompany,
        occupantCount: b.occupancies.length,
        createdAt: b.createdAt,
        areaName,
        hasGuest,
        companionName: b.companionName || undefined,
        notes: b.notes || undefined,
      };
    });

    return { success: true, data: { data: result, total } };
  } catch (error) {
    console.error("[GET_ALL_BOOKINGS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data booking" };
  }
}

// ========================================
// GET BOOKING BY ID
// ========================================

export async function getBookingById(
  id: string
): Promise<ActionResponse<BookingDetail>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        occupancies: {
          include: {
            occupant: {
              select: {
                id: true,
                name: true,
                nik: true,
                gender: true,
                company: true,
                department: true,
                phone: true,
              },
            },
            bed: {
              select: {
                id: true,
                code: true,
                label: true,
                room: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    building: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            description: true,
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    // Calculate dates from occupancies
    const dates = calculateBookingDates(booking.occupancies);

    const result: BookingDetail = {
      id: booking.id,
      code: booking.code,
      status: booking.status as BookingDetail["status"],
      checkInDate: dates.checkInDate,
      checkOutDate: dates.checkOutDate,
      purpose: booking.purpose,
      projectCode: booking.projectCode,
      requesterUserId: booking.requesterUserId,
      requesterName: booking.requesterName,
      requesterNik: booking.requesterNik,
      requesterEmail: booking.requesterEmail,
      requesterPhone: booking.requesterPhone,
      requesterCompany: booking.requesterCompany,
      requesterDepartment: booking.requesterDepartment,
      requesterPosition: booking.requesterPosition,
      companionName: booking.companionName,
      companionNik: booking.companionNik,
      companionEmail: booking.companionEmail,
      companionPhone: booking.companionPhone,
      companionCompany: booking.companionCompany,
      companionDepartment: booking.companionDepartment,
      notes: booking.notes,
      approvedBy: booking.approvedBy,
      approvedAt: booking.approvedAt,
      rejectedBy: booking.rejectedBy,
      rejectedAt: booking.rejectedAt,
      rejectionReason: booking.rejectionReason,
      cancelledBy: booking.cancelledBy,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      occupantCount: booking.occupancies.length,
      occupancies: booking.occupancies.map((occ) => ({
        id: occ.id,
        status: occ.status,
        checkInDate: occ.checkInDate,
        checkOutDate: occ.checkOutDate,
        cancelledAt: occ.cancelledAt,
        cancelledBy: occ.cancelledBy,
        cancelledByName: occ.cancelledByName,
        cancelledReason: occ.cancelledReason,
        occupant: {
          id: occ.occupant.id,
          name: occ.occupant.name,
          nik: occ.occupant.nik,
          gender: occ.occupant.gender,
          company: occ.occupant.company,
          department: occ.occupant.department,
          phone: occ.occupant.phone,
        },
        bed: {
          id: occ.bed.id,
          code: occ.bed.code,
          label: occ.bed.label,
          room: {
            id: occ.bed.room.id,
            code: occ.bed.room.code,
            name: occ.bed.room.name,
            building: {
              id: occ.bed.room.building.id,
              code: occ.bed.room.building.code,
              name: occ.bed.room.building.name,
            },
          },
        },
      })),
      attachments: booking.attachments,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("[GET_BOOKING_BY_ID_ERROR]", error);
    return { success: false, error: "Gagal mengambil detail booking" };
  }
}

// ========================================
// ADMIN: GET PENDING BOOKINGS
// ========================================

export async function getPendingBookings(
  params?: { page?: number; limit?: number; status?: string }
): Promise<ActionResponse<{ data: BookingListItem[]; total: number }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // TODO: Check admin permission here

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (params?.status) {
      where.status = params.status;
    } else {
      // Default to PENDING
      where.status = "PENDING";
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          purpose: true,
          projectCode: true,
          requesterName: true,
          requesterCompany: true,
          createdAt: true,
          occupancies: {
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: { createdAt: "asc" }, // Oldest first for pending
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const result: BookingListItem[] = bookings.map((b) => {
      const dates = calculateBookingDates(b.occupancies);
      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingListItem["status"],
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        purpose: b.purpose,
        projectCode: b.projectCode,
        requesterName: b.requesterName,
        requesterCompany: b.requesterCompany,
        occupantCount: b.occupancies.length,
        createdAt: b.createdAt,
      };
    });

    return { success: true, data: { data: result, total } };
  } catch (error) {
    console.error("[GET_PENDING_BOOKINGS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data booking" };
  }
}

// ========================================
// ADMIN: APPROVE BOOKING
// ========================================

interface ApproveBookingInput {
  bookingId: string;
  notes?: string;
  // Occupant data from the booking request form
  occupants: {
    bedId: string;
    type: "EMPLOYEE" | "GUEST";
    name: string;
    nik?: string;
    gender: "MALE" | "FEMALE";
    email?: string;
    phone?: string;
    company?: string;
    department?: string;
    // Each occupant has their own stay dates
    checkInDate: Date;
    checkOutDate: Date;
  }[];
}

export async function approveBooking(
  input: ApproveBookingInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Booking sudah ${booking.status}` };
    }

    // Validate occupants count
    if (!input.occupants || input.occupants.length === 0) {
      return { success: false, error: "Data occupant wajib diisi" };
    }

    // Validate all beds are still available
    const bedIds = input.occupants.map((o) => o.bedId);
    
    // Calculate booking range from input occupants
    const bookingCheckIn = new Date(Math.min(...input.occupants.map(o => o.checkInDate.getTime())));
    const bookingCheckOut = new Date(Math.max(...input.occupants.map(o => o.checkOutDate.getTime())));
    
    const beds = await prisma.bed.findMany({
      where: { id: { in: bedIds } },
      include: {
        occupancies: {
          where: {
            AND: [
              { checkInDate: { lt: bookingCheckOut } },
              {
                OR: [
                  { checkOutDate: { gt: bookingCheckIn } },
                  { checkOutDate: null },
                ],
              },
              {
                status: {
                  in: ["PENDING", "RESERVED", "CHECKED_IN"],
                },
              },
            ],
          },
        },
      },
    });

    // Check if any bed has conflicts
    const conflictedBeds = beds.filter((b) => b.occupancies.length > 0);
    if (conflictedBeds.length > 0) {
      const codes = conflictedBeds.map((b) => b.code).join(", ");
      return { success: false, error: `Bed ${codes} sudah tidak tersedia` };
    }

    // Approve booking and create occupancies
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: "APPROVED",
          approvedBy: user.name || user.preferred_username || "Admin",
          approvedAt: new Date(),
          notes: input.notes || booking.notes,
        },
      });

      // Create occupancies for each occupant
      for (const occupantData of input.occupants) {
        // NIK is required - generate temp if not provided
        const occupantNik = occupantData.nik || `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        // Find or create occupant
        let occupant = occupantData.nik
          ? await tx.occupant.findUnique({ where: { nik: occupantData.nik } })
          : null;

        if (!occupant) {
          // Create new occupant
          occupant = await tx.occupant.create({
            data: {
              name: occupantData.name,
              nik: occupantNik,
              gender: occupantData.gender,
              email: occupantData.email || null,
              phone: occupantData.phone || null,
              company: occupantData.company || null,
              department: occupantData.department || null,
              type: occupantData.type,
            },
          });
        } else {
          // Update existing occupant with latest data
          occupant = await tx.occupant.update({
            where: { id: occupant.id },
            data: {
              name: occupantData.name,
              gender: occupantData.gender,
              email: occupantData.email || occupant.email,
              phone: occupantData.phone || occupant.phone,
              company: occupantData.company || occupant.company,
              department: occupantData.department || occupant.department,
            },
          });
        }

        // Create occupancy
        const createdByName = user.name || user.preferred_username || "System";
        await tx.occupancy.create({
          data: {
            bedId: occupantData.bedId,
            occupantId: occupant.id,
            bookingId: input.bookingId,
            checkInDate: occupantData.checkInDate,
            checkOutDate: occupantData.checkOutDate,
            status: "RESERVED", // Will be CHECKED_IN when they actually arrive
            createdBy: user.id || user.sub || "system",
            createdByName: createdByName,
          },
        });

        // Update bed status if currently AVAILABLE
        await tx.bed.update({
          where: { id: occupantData.bedId },
          data: {
            status: "RESERVED",
          },
        });
      }

      return { id: input.bookingId };
    });

    revalidatePath("/booking/admin");
    revalidatePath("/booking/mine");
    revalidatePath("/properties/buildings");

    return { success: true, data: result };
  } catch (error) {
    console.error("[APPROVE_BOOKING_ERROR]", error);
    return { success: false, error: "Gagal menyetujui booking" };
  }
}

// ========================================
// ADMIN: REJECT BOOKING
// ========================================

interface RejectBookingInput {
  bookingId: string;
  reason: string;
}

export async function rejectBooking(
  input: RejectBookingInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: "Alasan penolakan wajib diisi" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Booking sudah ${booking.status}` };
    }

    // Reject booking
    await prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        status: "REJECTED",
        rejectedBy: user.name || user.preferred_username || "Admin",
        rejectedAt: new Date(),
        rejectionReason: input.reason.trim(),
      },
    });

    revalidatePath("/booking/admin");
    revalidatePath("/booking/mine");

    return { success: true, data: { id: input.bookingId } };
  } catch (error) {
    console.error("[REJECT_BOOKING_ERROR]", error);
    return { success: false, error: "Gagal menolak booking" };
  }
}

// ========================================
// CANCEL BOOKING
// ========================================

interface CancelBookingInput {
  bookingId: string;
  reason: string;
}

export async function cancelBooking(
  input: CancelBookingInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: "Alasan pembatalan wajib diisi" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    // Get booking with occupancies
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        occupancies: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status === "CANCELLED") {
      return { success: false, error: "Booking sudah dibatalkan" };
    }

    if (booking.status === "REJECTED") {
      return { success: false, error: "Booking sudah ditolak" };
    }

    // Cancel booking and related occupancies
    await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: "CANCELLED",
          cancelledBy: user.name || user.preferred_username || "Unknown",
          cancelledAt: new Date(),
          cancellationReason: input.reason.trim(),
        },
      });

      // Cancel all related occupancies (if any)
      if (booking.occupancies.length > 0) {
        const bedIds = booking.occupancies.map((o) => o.bedId);

        await tx.occupancy.updateMany({
          where: { bookingId: input.bookingId },
          data: {
            status: "CANCELLED",
          },
        });

        // Reset bed status to AVAILABLE (if no other active occupancies)
        for (const bedId of bedIds) {
          const activeOccupancies = await tx.occupancy.count({
            where: {
              bedId,
              status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            },
          });

          if (activeOccupancies === 0) {
            await tx.bed.update({
              where: { id: bedId },
              data: { status: "AVAILABLE" },
            });
          }
        }
      }
    });

    revalidatePath("/booking/admin");
    revalidatePath("/booking/mine");
    revalidatePath("/properties/buildings");

    return { success: true, data: { id: input.bookingId } };
  } catch (error) {
    console.error("[CANCEL_BOOKING_ERROR]", error);
    return { success: false, error: "Gagal membatalkan booking" };
  }
}

// ========================================
// CANCEL OCCUPANCY (Single Occupant)
// ========================================

interface CancelOccupancyInput {
  bookingId: string;
  occupancyId: string;
  reason: string;
}

export async function cancelOccupancy(
  input: CancelOccupancyInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: "Alasan pembatalan wajib diisi" };
    }

    // Get booking with this occupancy
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        occupancies: {
          where: { id: input.occupancyId },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status !== "APPROVED") {
      return { success: false, error: "Hanya booking yang disetujui yang dapat dibatalkan per penghuni" };
    }

    const occupancy = booking.occupancies[0];
    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    if (occupancy.status !== "RESERVED") {
      return { success: false, error: "Penghuni ini tidak dapat dibatalkan (status: " + occupancy.status + ")" };
    }

    if (occupancy.actualCheckIn) {
      return { success: false, error: "Penghuni yang sudah check-in tidak dapat dibatalkan" };
    }

    // Check time-based restriction (must be at least H-1)
    const today = startOfDay(new Date());
    const checkInDate = startOfDay(new Date(occupancy.checkInDate));
    const daysUntilCheckIn = Math.floor((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilCheckIn < 1) {
      return { success: false, error: "Tidak dapat membatalkan pada hari check-in (H-0)" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    // Use NIK or preferred_username as identifier, fallback to sub/id
    const userId = user.nik || user.preferred_username || user.sub || user.id || "unknown";
    const userName = user.name || user.preferred_username || "Unknown";

    // Cancel the occupancy
    await prisma.$transaction(async (tx) => {
      await tx.occupancy.update({
        where: { id: input.occupancyId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelledByName: userName,
          cancelledReason: input.reason.trim(),
        },
      });

      // Reset bed status to AVAILABLE if no other active occupancies
      const activeOccupancies = await tx.occupancy.count({
        where: {
          bedId: occupancy.bedId,
          status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
        },
      });

      if (activeOccupancies === 0) {
        await tx.bed.update({
          where: { id: occupancy.bedId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    revalidatePath("/booking/mine");
    revalidatePath("/booking/admin");

    return { success: true, data: { id: input.occupancyId } };
  } catch (error) {
    console.error("[CANCEL_OCCUPANCY_ERROR]", error);
    return { success: false, error: "Gagal membatalkan penghuni" };
  }
}

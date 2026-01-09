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
    const { areaId, buildingId, checkInDate, checkOutDate, roomTypeIds, genderPolicy, includeFullRooms } = params;

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
            deletedAt: null, // Only include non-deleted beds
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
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
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

    // Get all bed IDs from the result
    const allBedIds = rooms.flatMap((room) => room.beds.map((bed) => bed.id));

    // Query pending booking request items for these beds WITH DATES (for timeline)
    const pendingRequestItems = await prisma.bookingRequestItem.findMany({
      where: {
        bedId: { in: allBedIds },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
        booking: { status: "PENDING" },
      },
      select: {
        id: true,
        bedId: true,
        checkInDate: true,
        checkOutDate: true,
        booking: { 
          select: { 
            id: true,
            code: true,
          } 
        },
      },
    });

    // Group pending requests by bedId for efficient lookup
    const pendingByBed = new Map<string, typeof pendingRequestItems>();
    for (const item of pendingRequestItems) {
      const existing = pendingByBed.get(item.bedId) || [];
      existing.push(item);
      pendingByBed.set(item.bedId, existing);
    }

    // Transform to RoomAvailability format
    const result: RoomAvailability[] = rooms.map((room) => {
      const beds: BedAvailability[] = room.beds.map((bed) => {
        // Get pending requests for this bed
        const bedPendingRequests = pendingByBed.get(bed.id) || [];
        const hasPendingRequest = bedPendingRequests.length > 0;

        // A bed is available for the ENTIRE range if:
        // 1. It has no overlapping approved occupancies
        // 2. It has no pending booking requests
        const hasApprovedOccupancy = bed.occupancies.length > 0;
        const isAvailable = !hasApprovedOccupancy && !hasPendingRequest;

        return {
          id: bed.id,
          code: bed.code,
          label: bed.label,
          position: bed.position,
          bedType: bed.bedType,
          isAvailable,
          hasPendingRequest,
          // Confirmed occupancies (RESERVED, CHECKED_IN)
          occupancies: bed.occupancies.map((occ) => ({
            id: occ.id,
            checkInDate: occ.checkInDate,
            checkOutDate: occ.checkOutDate,
            status: occ.status,
            occupantName: occ.occupant?.name || "",
          })),
          // Pending booking requests with dates
          pendingRequests: bedPendingRequests.map((pr) => ({
            id: pr.id,
            checkInDate: pr.checkInDate,
            checkOutDate: pr.checkOutDate,
            bookingCode: pr.booking.code,
            bookingId: pr.booking.id,
          })),
        };
      });

      const availableBeds = beds.filter((b) => b.isAvailable).length;

      return {
        id: room.id,
        code: room.code,
        name: room.name,
        floor: room.floorNumber,
        status: room.status, // Room status (ACTIVE, MAINTENANCE)
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
        genderPolicy: room.genderPolicy,
        currentGender: room.currentGender,
        allowedOccupantType: room.allowedOccupantType,
        capacity: room.beds.length,
        availableBeds,
        beds,
        facilities: [], // TODO: Add facilities if needed
        images: room.images,
      };
    });

    // Filter rooms based on includeFullRooms parameter
    const finalRooms = includeFullRooms 
      ? result // Return all rooms including full ones
      : result.filter((r) => r.availableBeds > 0); // Only rooms with available beds

    return { success: true, data: finalRooms };
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

    // Get requester info details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const username = user.username || user.nik; // Try both fields

    // 1. Find local user for ID reference
    const localUser = username 
      ? await prisma.user.findUnique({ where: { username } })
      : null;

    // 2. Find detailed profile from IAM (for department, company, etc)
    let iamProfile = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = (session as any).accessToken;

    if (username && accessToken) {
        // Dynamic import to avoid potential circular deps if any
        const { searchFromIAM } = await import("@/lib/iam/iam.actions");
        const sr = await searchFromIAM(username, accessToken);
        if (sr && sr.found && sr.data) {
            iamProfile = sr.data;
        }
    }

    const requesterId = localUser?.id || user.id || user.sub || "unknown";
    const requesterName = iamProfile?.name || localUser?.displayName || user.name || "Unknown";
    const requesterNik = username || null;
    const requesterEmail = iamProfile?.email || localUser?.email || user.email || null;
    const requesterPhone = iamProfile?.phone || null;
    const requesterCompany = iamProfile?.company || null;
    const requesterDepartment = iamProfile?.department || null;
    // IAM doesn't return value for position yet in searchEmployeeByNIK based on interface, 
    // but let's leave it null or try to extract if available later.
    const requesterPosition = null; 

    // Validate all beds are available (double-check)
    const bedIds = data.occupants.map((o) => o.bedId);
    const beds = await prisma.bed.findMany({
      where: { id: { in: bedIds }, deletedAt: null },
      include: {
        room: {
          select: {
            id: true,
            code: true,
            genderPolicy: true,
            currentGender: true,
            allowedOccupantType: true,
          },
        },
        occupancies: {
          where: {
            status: {
              in: ["PENDING", "RESERVED", "CHECKED_IN"],
            },
          },
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
          },
        },
      },
    });

    // Check if all beds exist
    if (beds.length !== bedIds.length) {
      return { success: false, error: "Beberapa bed tidak ditemukan" };
    }

    // Create a map for quick lookup
    const bedMap = new Map(beds.map((b) => [b.id, b]));

    // SERVER-SIDE VALIDATION: Gender Policy & Allocation per occupant
    for (const occ of data.occupants) {
      const bed = bedMap.get(occ.bedId);
      if (!bed) continue;

      const room = bed.room;

      // 1. Validate gender policy
      const genderPolicy = room.genderPolicy;
      const occGender = occ.gender; // "MALE" | "FEMALE"

      if (genderPolicy === "MALE_ONLY" && occGender === "FEMALE") {
        return {
          success: false,
          error: `Kamar ${room.code} khusus PRIA. ${occ.name} (perempuan) tidak dapat ditempatkan.`,
        };
      }
      if (genderPolicy === "FEMALE_ONLY" && occGender === "MALE") {
        return {
          success: false,
          error: `Kamar ${room.code} khusus WANITA. ${occ.name} (laki-laki) tidak dapat ditempatkan.`,
        };
      }
      // For FLEXIBLE rooms, check if there's already a different gender in the same room
      if (genderPolicy === "FLEXIBLE" && room.currentGender) {
        if (
          (room.currentGender === "MALE" && occGender === "FEMALE") ||
          (room.currentGender === "FEMALE" && occGender === "MALE")
        ) {
          return {
            success: false,
            error: `Kamar ${room.code} sedang dihuni gender ${room.currentGender === "MALE" ? "pria" : "wanita"}. ${occ.name} tidak dapat ditempatkan.`,
          };
        }
      }

      // 2. Validate room allocation (employee only vs all)
      if (room.allowedOccupantType === "EMPLOYEE_ONLY" && occ.type === "GUEST") {
        return {
          success: false,
          error: `Kamar ${room.code} khusus KARYAWAN. Tamu ${occ.name} tidak dapat ditempatkan.`,
        };
      }
    }

    // CHECK CONFLICTS: Per-occupant date checking for each bed
    const conflictErrors: string[] = [];

    for (const occ of data.occupants) {
      const bed = bedMap.get(occ.bedId);
      if (!bed) continue;

      // Check occupancy conflicts with this occupant's specific dates
      const hasOccupancyConflict = bed.occupancies.some((existing) => {
        // Overlap check: occ.checkIn < existing.checkOut AND occ.checkOut > existing.checkIn
        const existingCheckOut = existing.checkOutDate;
        // If existingCheckOut is null, treat as indefinite (always conflicts with future dates)
        if (existingCheckOut === null) {
          return occ.checkInDate >= existing.checkInDate;
        }
        return (
          occ.checkInDate < existingCheckOut &&
          occ.checkOutDate > existing.checkInDate
        );
      });

      if (hasOccupancyConflict) {
        conflictErrors.push(`Bed ${bed.code}`);
      }
    }

    if (conflictErrors.length > 0) {
      return {
        success: false,
        error: `${conflictErrors.join(", ")} sudah terisi dalam rentang tanggal tersebut`,
      };
    }

    // CHECK FOR CONFLICTS WITH OTHER PENDING BOOKING REQUESTS (per occupant dates)
    const pendingConflicts: string[] = [];

    for (const occ of data.occupants) {
      const pendingItems = await prisma.bookingRequestItem.findMany({
        where: {
          bedId: occ.bedId,
          checkInDate: { lt: occ.checkOutDate },
          checkOutDate: { gt: occ.checkInDate },
          booking: { status: "PENDING" },
        },
        include: {
          booking: { select: { code: true } },
          bed: { select: { code: true } },
        },
      });

      if (pendingItems.length > 0) {
        pendingConflicts.push(
          ...pendingItems.map(
            (item) => `${item.bed.code} (Booking #${item.booking.code})`
          )
        );
      }
    }

    if (pendingConflicts.length > 0) {
      const uniqueConflicts = [...new Set(pendingConflicts)];
      return {
        success: false,
        error: `Bed sedang dalam proses booking lain: ${uniqueConflicts.join(", ")}`,
      };
    }

    // Generate booking code
    const bookingCode = await generateBookingCode();

    // Create booking with transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking header
      const newBooking = await tx.booking.create({
        data: {
          code: bookingCode,
          requesterUserId: requesterId,
          requesterName: requesterName,
          requesterNik: requesterNik,
          requesterEmail: requesterEmail,
          requesterPhone: requesterPhone,
          requesterCompany: requesterCompany,
          requesterDepartment: requesterDepartment,
          requesterPosition: requesterPosition,
          
          companionUserId: data.companion?.userId || null,
          companionName: data.companion?.name || null,
          companionNik: data.companion?.nik || null,
          companionEmail: data.companion?.email || null,
          companionPhone: data.companion?.phone || null,
          companionCompany: data.companion?.company || null,
          companionDepartment: data.companion?.department || null,
          
          purpose: data.purpose || null,
          projectCode: data.projectCode || null,
          notes: data.notes || null,
          
          status: "PENDING",
        },
      });

      // Create BookingRequestItem records with PER-OCCUPANT DATES
      await tx.bookingRequestItem.createMany({
        data: data.occupants.map((occ) => ({
          bookingId: newBooking.id,
          bedId: occ.bedId,
          name: occ.name,
          nik: occ.nik || null,
          gender: occ.gender,
          type: occ.type,
          email: occ.email || null,
          phone: occ.phone || null,
          company: occ.company || null,
          department: occ.department || null,
          // USE PER-OCCUPANT DATES instead of global dates
          checkInDate: occ.checkInDate,
          checkOutDate: occ.checkOutDate,
        })),
      });

      return newBooking;
    });

    revalidatePath("/booking/mine");
    revalidatePath("/booking/admin");
    revalidatePath("/home"); // Refresh room availability

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
  buildingIds?: string[]; // Filter by user's accessible buildings
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

    // Building access filter - only show bookings for accessible buildings
    if (params?.buildingIds && params.buildingIds.length > 0) {
      // Filter bookings where at least one requestItem OR occupancy is in accessible buildings
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            // Check requestItems (pending bookings)
            {
              requestItems: {
                some: {
                  bed: {
                    room: {
                      buildingId: { in: params.buildingIds },
                    },
                  },
                },
              },
            },
            // Check occupancies (approved bookings)
            {
              occupancies: {
                some: {
                  bed: {
                    room: {
                      buildingId: { in: params.buildingIds },
                    },
                  },
                },
              },
            },
          ],
        },
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
          // Use requestItems instead of requestedOccupants
          requestItems: {
            select: {
              id: true,
              type: true,
              checkInDate: true,
              checkOutDate: true,
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

    const result = bookings.map((b) => {
      // Calculate dates - prefer occupancies, fallback to requestItems
      let dates = calculateBookingDates(b.occupancies);
      
      if (!dates.checkInDate && b.requestItems.length > 0) {
        dates = calculateBookingDates(
          b.requestItems.map((ri) => ({
            checkInDate: ri.checkInDate,
            checkOutDate: ri.checkOutDate,
          }))
        );
      }

      // Check has GUEST - check both occupancies and requestItems
      const hasGuest =
        b.occupancies.some((o) => o.occupant.type === "GUEST") ||
        b.requestItems.some((ri) => ri.type === "GUEST");
          
      // Get area name (first one found from occupancies or requestItems)
      const areaName = 
        b.occupancies.find(o => o.bed?.room?.building?.area?.name)?.bed.room.building.area.name ||
        b.requestItems.find(ri => ri.bed?.room?.building?.area?.name)?.bed.room.building.area.name;

      // Occupant count - prefer occupancies, fallback to requestItems
      const occupantCount = b.occupancies.length > 0 
        ? b.occupancies.length 
        : b.requestItems.length;

      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingListItemExtended["status"],
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        purpose: b.purpose,
        projectCode: b.projectCode,
        requesterName: b.requesterName,
        requesterCompany: b.requesterCompany,
        occupantCount,
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
        requestItems: {
          include: {
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
        occupancies: {
          include: {
            occupant: {
              select: {
                id: true,
                name: true,
                nik: true,
                gender: true,
                type: true,
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

    // Calculate dates from occupancies, fallback to requestItems
    let dates = calculateBookingDates(booking.occupancies);

    if (!dates.checkInDate && booking.requestItems.length > 0) {
      dates = calculateBookingDates(
        booking.requestItems.map((ri) => ({
          checkInDate: ri.checkInDate,
          checkOutDate: ri.checkOutDate,
        }))
      );
    }

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
      // Cancellation only (approval/rejection now at item level)
      cancelledBy: booking.cancelledBy,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      requestItems: booking.requestItems.map((ri) => ({
        id: ri.id,
        bedId: ri.bedId,
        name: ri.name,
        nik: ri.nik,
        gender: ri.gender,
        type: ri.type,
        email: ri.email,
        phone: ri.phone,
        company: ri.company,
        department: ri.department,
        checkInDate: ri.checkInDate,
        checkOutDate: ri.checkOutDate,
        // Per-item approval tracking
        approvedByNik: ri.approvedByNik,
        approvedByName: ri.approvedByName,
        approvedAt: ri.approvedAt,
        rejectedByNik: ri.rejectedByNik,
        rejectedByName: ri.rejectedByName,
        rejectedAt: ri.rejectedAt,
        rejectedReason: ri.rejectedReason,
        bed: {
          id: ri.bed.id,
          code: ri.bed.code,
          label: ri.bed.label,
          room: {
            id: ri.bed.room.id,
            code: ri.bed.room.code,
            name: ri.bed.room.name,
            building: {
              id: ri.bed.room.building.id,
              code: ri.bed.room.building.code,
              name: ri.bed.room.building.name,
            },
          },
        },
      })),
      occupantCount: booking.occupancies.length > 0 
        ? booking.occupancies.length 
        : booking.requestItems.length,
      occupancies: booking.occupancies.map((occ) => ({
        id: occ.id,
        status: occ.status,
        checkInDate: occ.checkInDate,
        checkOutDate: occ.checkOutDate,
        // Approval tracking
        approvedByNik: occ.approvedByNik,
        approvedByName: occ.approvedByName,
        approvedAt: occ.approvedAt,
        // Cancellation
        cancelledAt: occ.cancelledAt,
        cancelledBy: occ.cancelledBy,
        cancelledByName: occ.cancelledByName,
        cancelledReason: occ.cancelledReason,
        occupant: {
          id: occ.occupant.id,
          name: occ.occupant.name,
          nik: occ.occupant.nik,
          type: occ.occupant.type,
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
// ADMIN: APPROVE BOOKING ITEMS (Per-Building)
// ========================================

interface ApproveBookingItemsInput {
  bookingId: string;
  itemIds: string[]; // IDs of BookingRequestItems to approve
  buildingIds: string[]; // Admin's accessible buildings (for validation)
  notes?: string;
}

export async function approveBookingItems(
  input: ApproveBookingItemsInput
): Promise<ActionResponse<{ id: string; allApproved: boolean }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const adminNik = user.username || user.nik || user.sub;
    const adminName = user.name || user.preferred_username || "Admin";

    // Get booking with request items
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        requestItems: {
          include: {
            bed: {
              select: {
                id: true,
                room: {
                  select: {
                    buildingId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Booking sudah ${booking.status}` };
    }

    // Validate items exist and admin has access to their buildings
    const itemsToApprove = booking.requestItems.filter((ri) => 
      input.itemIds.includes(ri.id)
    );

    if (itemsToApprove.length === 0) {
      return { success: false, error: "Tidak ada item yang bisa di-approve" };
    }

    // Check building access for each item
    for (const item of itemsToApprove) {
      const itemBuildingId = item.bed.room.buildingId;
      if (!input.buildingIds.includes(itemBuildingId)) {
        return { 
          success: false, 
          error: `Anda tidak memiliki akses ke gedung untuk item ${item.name}` 
        };
      }
      // Check if already approved
      if (item.approvedAt) {
        return { 
          success: false, 
          error: `Item ${item.name} sudah di-approve sebelumnya` 
        };
      }
    }

    // Approve items in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update request items
      await tx.bookingRequestItem.updateMany({
        where: { id: { in: input.itemIds } },
        data: {
          approvedByNik: adminNik,
          approvedByName: adminName,
          approvedAt: new Date(),
        },
      });

      // 2. Check if ALL items are now approved
      const updatedBooking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        include: { requestItems: true },
      });

      const allApproved = updatedBooking!.requestItems.every(
        (ri) => ri.approvedAt !== null
      );
      const anyRejected = updatedBooking!.requestItems.some(
        (ri) => ri.rejectedAt !== null
      );

      // 3. If all approved, update booking status and create occupancies
      if (allApproved && !anyRejected) {
        // Update booking status (no approval fields on Booking anymore)
        await tx.booking.update({
          where: { id: input.bookingId },
          data: {
            status: "APPROVED",
            notes: input.notes || updatedBooking!.notes,
          },
        });

        // Create occupancies from request items
        for (const ri of updatedBooking!.requestItems) {
          // NIK is required - generate temp if not provided
          const occupantNik = ri.nik || `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          // Find or create occupant
          let occupant = ri.nik
            ? await tx.occupant.findUnique({ where: { nik: ri.nik } })
            : null;

          if (!occupant) {
            occupant = await tx.occupant.create({
              data: {
                name: ri.name,
                nik: occupantNik,
                gender: ri.gender,
                email: ri.email || null,
                phone: ri.phone || null,
                company: ri.company || null,
                department: ri.department || null,
                type: ri.type,
              },
            });
          } else {
            // Update existing occupant with latest data
            occupant = await tx.occupant.update({
              where: { id: occupant.id },
              data: {
                name: ri.name,
                gender: ri.gender,
                email: ri.email || occupant.email,
                phone: ri.phone || occupant.phone,
                company: ri.company || occupant.company,
                department: ri.department || occupant.department,
              },
            });
          }

          // Create occupancy with approval info from the item
          await tx.occupancy.create({
            data: {
              bedId: ri.bedId,
              occupantId: occupant.id,
              bookingId: input.bookingId,
              checkInDate: ri.checkInDate,
              checkOutDate: ri.checkOutDate,
              status: "RESERVED",
              createdBy: user.id || user.sub || "system",
              createdByName: adminName,
              // Copy approval info from BookingRequestItem
              approvedByNik: ri.approvedByNik,
              approvedByName: ri.approvedByName,
              approvedAt: ri.approvedAt,
            },
          });
        }
      }

      return { id: input.bookingId, allApproved };
    });

    revalidatePath("/booking/request");
    revalidatePath("/booking/mine");
    revalidatePath("/properties/buildings");

    return { success: true, data: result };
  } catch (error) {
    console.error("[APPROVE_BOOKING_ITEMS_ERROR]", error);
    return { success: false, error: "Gagal menyetujui booking items" };
  }
}

// ========================================
// ADMIN: REJECT BOOKING ITEMS (Per-Building)
// ========================================

interface RejectBookingItemsInput {
  bookingId: string;
  itemIds: string[]; // IDs of BookingRequestItems to reject
  buildingIds: string[]; // Admin's accessible buildings (for validation)
  reason: string; // Required rejection reason
  notes?: string;
}

export async function rejectBookingItems(
  input: RejectBookingItemsInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const adminNik = user.username || user.nik || user.sub;
    const adminName = user.name || user.preferred_username || "Admin";

    // Validate reason is provided
    if (!input.reason?.trim()) {
      return { success: false, error: "Alasan penolakan wajib diisi" };
    }

    // Get booking with request items
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        requestItems: {
          include: {
            bed: {
              select: {
                id: true,
                room: {
                  select: {
                    buildingId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Booking sudah ${booking.status}` };
    }

    // Validate that admin has access to reject these items
    for (const itemId of input.itemIds) {
      const item = booking.requestItems.find((ri) => ri.id === itemId);
      if (!item) {
        return { success: false, error: `Item ${itemId} tidak ditemukan` };
      }

      const itemBuildingId = item.bed?.room?.buildingId;
      if (!itemBuildingId || !input.buildingIds.includes(itemBuildingId)) {
        return {
          success: false,
          error: `Anda tidak memiliki akses untuk menolak item di gedung ini`,
        };
      }

      if (item.rejectedAt) {
        return {
          success: false,
          error: `Item untuk ${item.name} sudah ditolak sebelumnya`,
        };
      }
    }

    // Reject items in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update request items with rejection info
      await tx.bookingRequestItem.updateMany({
        where: {
          id: { in: input.itemIds },
        },
        data: {
          rejectedByNik: adminNik,
          rejectedByName: adminName,
          rejectedAt: new Date(),
          rejectedReason: input.reason.trim(),
        },
      });

      // 2. When any item is rejected, entire booking becomes REJECTED
      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: "REJECTED",
          notes: input.notes || booking.notes,
        },
      });
    });

    revalidatePath("/booking/request");
    revalidatePath("/booking/mine");
    revalidatePath("/properties/buildings");

    return { success: true, data: { id: input.bookingId } };
  } catch (error) {
    console.error("[REJECT_BOOKING_ITEMS_ERROR]", error);
    return { success: false, error: "Gagal menolak booking items" };
  }
}

// ========================================
// ADMIN: APPROVE BOOKING (Legacy - Full Approval)

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
      // Update booking status (no approval fields on Booking anymore)
      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          status: "APPROVED",
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

    // const user = session.user as any;

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

    // TODO: In the new flow, rejection should be per-item via rejectBookingItems
    // This legacy function now only updates status
    await prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        status: "REJECTED",
        // Note: rejection details are now tracked at BookingRequestItem level
        // This function is kept for backward compatibility
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
        await tx.occupancy.updateMany({
          where: { bookingId: input.bookingId },
          data: {
            status: "CANCELLED",
          },
        });
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
    const userId = user.username || user.email || "unknown";
    const userName = user.name || user.given_name || "Unknown";

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
    });

    revalidatePath("/booking/mine");
    revalidatePath("/booking/admin");

    return { success: true, data: { id: input.occupancyId } };
  } catch (error) {
    console.error("[CANCEL_OCCUPANCY_ERROR]", error);
    return { success: false, error: "Gagal membatalkan penghuni" };
  }
}

"use server";

import { prisma } from "@/lib/db";
import {
  ActionResponse,
  OccupantFilters,
  SortParams,
  PaginatedResult,
  OccupantListItem,
  OccupantDetail,
  OccupantLogItem,
  FilterOptions,
  OccupantStats,
  OccupancyStatus,
  occupantQuerySchema,
  OccupantQueryParams,
} from "./occupants.types";

// ========================================
// HELPER: Parse query params to filters
// ========================================

function parseQueryToFilters(query: OccupantQueryParams): {
  filters: OccupantFilters;
  sort: SortParams;
  page: number;
  pageSize: number;
} {
  const parsed = occupantQuerySchema.parse(query);
  
  return {
    filters: {
      search: parsed.search,
      status: parsed.status?.split(",") as OccupancyStatus[] | undefined,
      occupantType: parsed.occupantType,
      gender: parsed.gender,
      areaId: parsed.areaId,
      buildingId: parsed.buildingId,
      hasBooking: parsed.hasBooking === "true" ? true : parsed.hasBooking === "false" ? false : undefined,
      activeOnly: parsed.activeOnly === "true",
      checkInFrom: parsed.checkInFrom ? new Date(parsed.checkInFrom) : undefined,
      checkInTo: parsed.checkInTo ? new Date(parsed.checkInTo) : undefined,
      checkOutFrom: parsed.checkOutFrom ? new Date(parsed.checkOutFrom) : undefined,
      checkOutTo: parsed.checkOutTo ? new Date(parsed.checkOutTo) : undefined,
    },
    sort: {
      field: parsed.sortField,
      direction: parsed.sortDir,
    },
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

// ========================================
// BUILD WHERE CLAUSE
// ========================================

function buildWhereClause(filters: OccupantFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  // Search (name, NIK, email, phone, company)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { occupantName: { contains: searchLower, mode: "insensitive" } },
      { occupantNik: { contains: searchLower, mode: "insensitive" } },
      { occupantEmail: { contains: searchLower, mode: "insensitive" } },
      { occupantPhone: { contains: searchLower, mode: "insensitive" } },
      { occupantCompany: { contains: searchLower, mode: "insensitive" } },
      { bed: { code: { contains: searchLower, mode: "insensitive" } } },
      { bed: { room: { code: { contains: searchLower, mode: "insensitive" } } } },
      { bed: { room: { building: { name: { contains: searchLower, mode: "insensitive" } } } } },
    ];
  }
  
  // Status filter
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  
  // Active only (PENDING, RESERVED, CHECKED_IN)
  if (filters.activeOnly) {
    where.status = { in: ["PENDING", "RESERVED", "CHECKED_IN"] };
  }
  
  // Occupant type
  if (filters.occupantType) {
    where.occupantType = filters.occupantType;
  }
  
  // Gender
  if (filters.gender) {
    where.occupantGender = filters.gender;
  }
  
  // Building filter
  if (filters.buildingId) {
    where.bed = {
      room: {
        buildingId: filters.buildingId,
      },
    };
  }
  
  // Area filter (via building)
  if (filters.areaId && !filters.buildingId) {
    where.bed = {
      room: {
        building: {
          areaId: filters.areaId,
        },
      },
    };
  }
  
  // Has booking filter
  if (filters.hasBooking === true) {
    where.bookingId = { not: null };
  } else if (filters.hasBooking === false) {
    where.bookingId = null;
  }
  
  // Date range filters
  if (filters.checkInFrom || filters.checkInTo) {
    where.checkInDate = {};
    if (filters.checkInFrom) {
      where.checkInDate.gte = filters.checkInFrom;
    }
    if (filters.checkInTo) {
      where.checkInDate.lte = filters.checkInTo;
    }
  }
  
  if (filters.checkOutFrom || filters.checkOutTo) {
    where.checkOutDate = {};
    if (filters.checkOutFrom) {
      where.checkOutDate.gte = filters.checkOutFrom;
    }
    if (filters.checkOutTo) {
      where.checkOutDate.lte = filters.checkOutTo;
    }
  }
  
  return where;
}

// ========================================
// BUILD ORDER BY CLAUSE
// ========================================

import { Prisma } from "@prisma/client";

function buildOrderBy(sort: SortParams): Prisma.OccupancyOrderByWithRelationInput {
  const dir = sort.direction as Prisma.SortOrder;
  switch (sort.field) {
    case "occupantName":
      return { occupantName: dir };
    case "checkInDate":
      return { checkInDate: dir };
    case "checkOutDate":
      return { checkOutDate: dir };
    case "status":
      return { status: dir };
    case "createdAt":
      return { createdAt: dir };
    case "buildingName":
      return { bed: { room: { building: { name: dir } } } };
    default:
      return { createdAt: "desc" };
  }
}

// ========================================
// GET OCCUPANTS (PAGINATED + FILTERED)
// ========================================

export async function getOccupants(
  filters: OccupantFilters = {},
  sort: SortParams = { field: "createdAt", direction: "desc" },
  page: number = 1,
  pageSize: number = 20
): Promise<ActionResponse<PaginatedResult<OccupantListItem>>> {
  try {
    const where = buildWhereClause(filters);
    const orderBy = buildOrderBy(sort);
    
    // Get total count
    const totalItems = await prisma.occupancy.count({ where });
    
    // Calculate pagination
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (page - 1) * pageSize;
    
    // Fetch data with relations using include for better type inference
    const occupancies = await prisma.occupancy.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        booking: {
          select: {
            code: true,
          },
        },
        bed: {
          include: {
            room: {
              include: {
                building: {
                  include: {
                    area: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    // Transform to OccupantListItem
    const data: OccupantListItem[] = occupancies.map((occ) => ({
      id: occ.id,
      occupantName: occ.occupantName,
      occupantNik: occ.occupantNik,
      occupantType: occ.occupantType,
      occupantGender: occ.occupantGender,
      occupantPhone: occ.occupantPhone,
      occupantEmail: occ.occupantEmail,
      occupantCompany: occ.occupantCompany,
      checkInDate: occ.checkInDate,
      checkOutDate: occ.checkOutDate,
      actualCheckIn: occ.actualCheckIn,
      actualCheckOut: occ.actualCheckOut,
      status: occ.status,
      bedId: occ.bed.id,
      bedCode: occ.bed.code,
      bedLabel: occ.bed.label,
      roomId: occ.bed.room.id,
      roomCode: occ.bed.room.code,
      roomName: occ.bed.room.name,
      floorNumber: occ.bed.room.floorNumber,
      buildingId: occ.bed.room.building.id,
      buildingCode: occ.bed.room.building.code,
      buildingName: occ.bed.room.building.name,
      areaId: occ.bed.room.building.area.id,
      areaName: occ.bed.room.building.area.name,
      bookingId: occ.bookingId,
      bookingCode: occ.booking?.code || null,
      createdAt: occ.createdAt,
      createdBy: occ.createdBy,
      createdByName: occ.createdByName,
    }));
    
    return {
      success: true,
      data: {
        data,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("[GET_OCCUPANTS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data penghuni" };
  }
}

// ========================================
// GET OCCUPANT BY ID (DETAIL + HISTORY)
// ========================================

export async function getOccupantById(
  id: string
): Promise<ActionResponse<OccupantDetail>> {
  try {
    const occupancy = await prisma.occupancy.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            code: true,
            requesterName: true,
            requesterCompany: true,
            purpose: true,
            projectCode: true,
            status: true,
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
                floorNumber: true,
                floorName: true,
                genderPolicy: true,
                roomType: {
                  select: {
                    name: true,
                  },
                },
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
              },
            },
          },
        },
        logs: {
          orderBy: { performedAt: "desc" },
          select: {
            id: true,
            action: true,
            fromBedId: true,
            toBedId: true,
            previousCheckInDate: true,
            newCheckInDate: true,
            previousCheckOutDate: true,
            newCheckOutDate: true,
            performedBy: true,
            performedByName: true,
            performedAt: true,
            reason: true,
            notes: true,
          },
        },
      },
    });
    
    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }
    
    // Get bed codes for transfer logs
    const bedIds = occupancy.logs
      .flatMap((log) => [log.fromBedId, log.toBedId])
      .filter((id): id is string => id !== null);
    
    const beds = bedIds.length > 0
      ? await prisma.bed.findMany({
          where: { id: { in: bedIds } },
          select: { id: true, code: true },
        })
      : [];
    
    const bedCodeMap = new Map(beds.map((b) => [b.id, b.code]));
    
    // Transform logs
    const logs: OccupantLogItem[] = occupancy.logs.map((log) => ({
      id: log.id,
      action: log.action,
      fromBedId: log.fromBedId,
      toBedId: log.toBedId,
      fromBedCode: log.fromBedId ? bedCodeMap.get(log.fromBedId) || null : null,
      toBedCode: log.toBedId ? bedCodeMap.get(log.toBedId) || null : null,
      previousCheckInDate: log.previousCheckInDate,
      newCheckInDate: log.newCheckInDate,
      previousCheckOutDate: log.previousCheckOutDate,
      newCheckOutDate: log.newCheckOutDate,
      performedBy: log.performedBy,
      performedByName: log.performedByName,
      performedAt: log.performedAt,
      reason: log.reason,
      notes: log.notes,
    }));
    
    const detail: OccupantDetail = {
      id: occupancy.id,
      occupantName: occupancy.occupantName,
      occupantNik: occupancy.occupantNik,
      occupantType: occupancy.occupantType,
      occupantGender: occupancy.occupantGender,
      occupantPhone: occupancy.occupantPhone,
      occupantEmail: occupancy.occupantEmail,
      occupantCompany: occupancy.occupantCompany,
      occupantUserId: occupancy.occupantUserId,
      occupantDepartment: occupancy.occupantDepartment,
      occupantPosition: occupancy.occupantPosition,
      checkInDate: occupancy.checkInDate,
      checkOutDate: occupancy.checkOutDate,
      originalCheckOutDate: occupancy.originalCheckOutDate,
      actualCheckIn: occupancy.actualCheckIn,
      actualCheckOut: occupancy.actualCheckOut,
      status: occupancy.status,
      qrCode: occupancy.qrCode,
      notes: occupancy.notes,
      bedId: occupancy.bed.id,
      bedCode: occupancy.bed.code,
      bedLabel: occupancy.bed.label,
      roomId: occupancy.bed.room.id,
      roomCode: occupancy.bed.room.code,
      roomName: occupancy.bed.room.name,
      floorNumber: occupancy.bed.room.floorNumber,
      buildingId: occupancy.bed.room.building.id,
      buildingCode: occupancy.bed.room.building.code,
      buildingName: occupancy.bed.room.building.name,
      areaId: occupancy.bed.room.building.area.id,
      areaName: occupancy.bed.room.building.area.name,
      bookingId: occupancy.bookingId,
      bookingCode: occupancy.booking?.code || null,
      createdAt: occupancy.createdAt,
      createdBy: occupancy.createdBy,
      createdByName: occupancy.createdByName,
      updatedAt: occupancy.updatedAt,
      transferredFromBedId: occupancy.transferredFromBedId,
      transferReason: occupancy.transferReason,
      transferredAt: occupancy.transferredAt,
      transferredBy: occupancy.transferredBy,
      transferredByName: occupancy.transferredByName,
      checkoutReason: occupancy.checkoutReason,
      checkoutBy: occupancy.checkoutBy,
      checkoutByName: occupancy.checkoutByName,
      booking: occupancy.booking
        ? {
            id: occupancy.booking.id,
            code: occupancy.booking.code,
            requesterName: occupancy.booking.requesterName,
            requesterCompany: occupancy.booking.requesterCompany,
            purpose: occupancy.booking.purpose,
            projectCode: occupancy.booking.projectCode,
            status: occupancy.booking.status,
          }
        : null,
      room: {
        id: occupancy.bed.room.id,
        code: occupancy.bed.room.code,
        name: occupancy.bed.room.name,
        floorNumber: occupancy.bed.room.floorNumber,
        floorName: occupancy.bed.room.floorName,
        genderPolicy: occupancy.bed.room.genderPolicy,
        roomTypeName: occupancy.bed.room.roomType.name,
      },
      logs,
    };
    
    return { success: true, data: detail };
  } catch (error) {
    console.error("[GET_OCCUPANT_BY_ID_ERROR]", error);
    return { success: false, error: "Gagal mengambil detail penghuni" };
  }
}

// ========================================
// GET FILTER OPTIONS (for dropdowns)
// ========================================

export async function getFilterOptions(): Promise<ActionResponse<FilterOptions>> {
  try {
    // Get areas
    const areas = await prisma.area.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
    
    // Get buildings
    const buildings = await prisma.building.findMany({
      where: { status: true },
      select: { id: true, code: true, name: true, areaId: true },
      orderBy: { name: "asc" },
    });
    
    // Get status counts
    const statusCounts = await prisma.occupancy.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    
    const statusLabels: Record<OccupancyStatus, string> = {
      PENDING: "Menunggu",
      RESERVED: "Dipesan",
      CHECKED_IN: "Check-In",
      CHECKED_OUT: "Check-Out",
      CANCELLED: "Dibatalkan",
      NO_SHOW: "Tidak Hadir",
    };
    
    const statuses = Object.entries(statusLabels).map(([value, label]) => ({
      value: value as OccupancyStatus,
      label,
      count: statusCounts.find((s) => s.status === value)?._count.status || 0,
    }));
    
    return {
      success: true,
      data: { areas, buildings, statuses },
    };
  } catch (error) {
    console.error("[GET_FILTER_OPTIONS_ERROR]", error);
    return { success: false, error: "Gagal mengambil opsi filter" };
  }
}

// ========================================
// GET OCCUPANT STATS
// ========================================

export async function getOccupantStats(): Promise<ActionResponse<OccupantStats>> {
  try {
    const counts = await prisma.occupancy.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    
    const getCount = (status: OccupancyStatus) =>
      counts.find((c) => c.status === status)?._count.status || 0;
    
    const stats: OccupantStats = {
      total: counts.reduce((sum, c) => sum + c._count.status, 0),
      pending: getCount("PENDING"),
      reserved: getCount("RESERVED"),
      checkedIn: getCount("CHECKED_IN"),
      checkedOut: getCount("CHECKED_OUT"),
      cancelled: getCount("CANCELLED"),
      noShow: getCount("NO_SHOW"),
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error("[GET_OCCUPANT_STATS_ERROR]", error);
    return { success: false, error: "Gagal mengambil statistik penghuni" };
  }
}

// ========================================
// GET ALL PAGE DATA (OPTIMIZED)
// ========================================

export interface OccupantsPageData {
  occupants: PaginatedResult<OccupantListItem>;
  stats: OccupantStats;
  filterOptions: FilterOptions;
}

export async function getOccupantsPageData(
  query: OccupantQueryParams
): Promise<ActionResponse<OccupantsPageData>> {
  try {
    const { filters, sort, page, pageSize } = parseQueryToFilters(query);
    
    // Parallel fetch
    const [occupantsResult, statsResult, filterOptionsResult] = await Promise.all([
      getOccupants(filters, sort, page, pageSize),
      getOccupantStats(),
      getFilterOptions(),
    ]);
    
    if (!occupantsResult.success) {
      return { success: false, error: occupantsResult.error };
    }
    if (!statsResult.success) {
      return { success: false, error: statsResult.error };
    }
    if (!filterOptionsResult.success) {
      return { success: false, error: filterOptionsResult.error };
    }
    
    return {
      success: true,
      data: {
        occupants: occupantsResult.data,
        stats: statsResult.data,
        filterOptions: filterOptionsResult.data,
      },
    };
  } catch (error) {
    console.error("[GET_OCCUPANTS_PAGE_DATA_ERROR]", error);
    return { success: false, error: "Gagal mengambil data halaman penghuni" };
  }
}

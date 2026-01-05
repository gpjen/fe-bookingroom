"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  ActionResponse,
  OccupantFilters,
  SortParams,
  PaginatedResult,
  OccupantListItem,
  OccupantDetail,
  FilterOptions,
  OccupantStats,
  OccupancyStatus,
  occupantQuerySchema,
  OccupantQueryParams,
  OccupancyDetailItem,
  OccupancyLogItem,
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
// BUILD WHERE CLAUSE (Targeting Occupant Table)
// ========================================

function buildWhereClause(filters: OccupantFilters): Prisma.OccupantWhereInput {
  const where: Prisma.OccupantWhereInput = {};
  
  // Search (name, NIK, email, phone, company)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { name: { contains: searchLower, mode: "insensitive" } },
      { nik: { contains: searchLower, mode: "insensitive" } },
      { email: { contains: searchLower, mode: "insensitive" } },
      { phone: { contains: searchLower, mode: "insensitive" } },
      { company: { contains: searchLower, mode: "insensitive" } },
      // Search in stays (occupancies) for Bed/Room matches
      {
        stays: {
          some: {
            OR: [
              { bed: { code: { contains: searchLower, mode: "insensitive" } } },
              { bed: { room: { code: { contains: searchLower, mode: "insensitive" } } } },
              { bed: { room: { building: { name: { contains: searchLower, mode: "insensitive" } } } } },
            ]
          }
        }
      }
    ];
  }
  
  // Filters definition
  const occupancyWhere: Prisma.OccupancyWhereInput = {};

  // Status filter
  if (filters.status && filters.status.length > 0) {
    occupancyWhere.status = { in: filters.status };
  }
  
  // Active only (PENDING, RESERVED, CHECKED_IN)
  if (filters.activeOnly) {
    occupancyWhere.status = { in: ["PENDING", "RESERVED", "CHECKED_IN"] };
  }
  
  // Building filter
  if (filters.buildingId) {
    occupancyWhere.bed = {
      room: {
        buildingId: filters.buildingId,
      },
    };
  }
  
  // Area filter (via building)
  if (filters.areaId && !filters.buildingId) {
    occupancyWhere.bed = {
      room: {
        building: {
          areaId: filters.areaId,
        },
      },
    };
  }
  
  // Has booking filter
  if (filters.hasBooking === true) {
    occupancyWhere.bookingId = { not: null };
  } else if (filters.hasBooking === false) {
    occupancyWhere.bookingId = null;
  }
  
  // Date range filters
  if (filters.checkInFrom || filters.checkInTo) {
    occupancyWhere.checkInDate = {};
    if (filters.checkInFrom) {
      occupancyWhere.checkInDate.gte = filters.checkInFrom;
    }
    if (filters.checkInTo) {
      occupancyWhere.checkInDate.lte = filters.checkInTo;
    }
  }
  
  if (filters.checkOutFrom || filters.checkOutTo) {
    occupancyWhere.checkOutDate = {};
    if (filters.checkOutFrom) {
      occupancyWhere.checkOutDate.gte = filters.checkOutFrom;
    }
    if (filters.checkOutTo) {
      occupancyWhere.checkOutDate.lte = filters.checkOutTo;
    }
  }

  // Apply occupancy filters if any
  if (Object.keys(occupancyWhere).length > 0) {
    where.stays = { some: occupancyWhere };
  }

  // Direct Occupant filters
  if (filters.occupantType) {
    where.type = filters.occupantType;
  }
  if (filters.gender) {
    where.gender = filters.gender;
  }
  
  return where;
}

// ========================================
// BUILD ORDER BY CLAUSE
// ========================================

function buildOrderBy(sort: SortParams): Prisma.OccupantOrderByWithRelationInput {
  const dir = sort.direction as Prisma.SortOrder;
  switch (sort.field) {
    case "occupantName":
      return { name: dir };
    case "createdAt":
      return { createdAt: dir };
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
    
    // Get total count of unique occupants
    const totalItems = await prisma.occupant.count({ where });
    
    // Calculate pagination
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (page - 1) * pageSize;
    
    // Fetch occupants with their latest/relevant stays
    const occupants = await prisma.occupant.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        stays: {
          orderBy: [
             // Hacky sort: we want Active first. But we can't custom sort in Prisma easily in one go for list item selection
             // We will sort in JS after fetching
             { checkInDate: 'desc' },
          ],
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    building: {
                      include: { area: true }
                    }
                  }
                }
              }
            },
            booking: true
          }
        }
      },
    });
    
    // Transform to OccupantListItem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: OccupantListItem[] = occupants.map((occ: any) => {
      // Determine primary occupancy
      const activeStats = ["CHECKED_IN", "RESERVED", "PENDING"];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sortedOccupancies = [...occ.stays].sort((a: any, b: any) => {
         // Custom sort: Active first, then by date desc
         const aActive = activeStats.includes(a.status);
         const bActive = activeStats.includes(b.status);
         if (aActive && !bActive) return -1;
         if (!aActive && bActive) return 1;
         return new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
      });

      const primary = sortedOccupancies[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeCount = occ.stays.filter((o: any) => activeStats.includes(o.status)).length;

      return {
        id: occ.id, // User ID
        occupantId: occ.id,
        occupantName: occ.name,
        occupantNik: occ.nik,
        occupantType: occ.type,
        occupantGender: occ.gender,
        occupantPhone: occ.phone,
        occupantEmail: occ.email,
        occupantCompany: occ.company,
        
        // Primary Occupancy Info
        primaryOccupancyId: primary?.id || null,
        checkInDate: primary?.checkInDate || null,
        checkOutDate: primary?.checkOutDate || null,
        actualCheckIn: primary?.actualCheckIn || null,
        actualCheckOut: primary?.actualCheckOut || null,
        status: primary?.status || null,

        // Location
        bedId: primary?.bedId || null,
        bedCode: primary?.bed.code || null,
        bedLabel: primary?.bed.label || null,
        roomId: primary?.bed.room.id || null,
        roomCode: primary?.bed.room.code || null,
        roomName: primary?.bed.room.name || null,
        floorNumber: primary?.bed.room.floorNumber || null,
        buildingId: primary?.bed.room.building.id || null,
        buildingCode: primary?.bed.room.building.code || null,
        buildingName: primary?.bed.room.building.name || null,
        areaId: primary?.bed.room.building.area.id || null,
        areaName: primary?.bed.room.building.area.name || null,

        bookingId: primary?.bookingId || null,
        bookingCode: primary?.booking?.code || null,
        
        activeOccupancyCount: activeCount,
        totalOccupancyCount: occ.stays.length,

        createdAt: occ.createdAt,
        createdBy: null, // Occupant doesn't have createdBy field directly visible/needed
        createdByName: null,
      };
    });
    
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
// GET OCCUPANT BY ID (DETAIL + NESTED HISTORY)
// ========================================

export async function getOccupantById(
  id: string // Occupant ID
): Promise<ActionResponse<OccupantDetail>> {
  try {
    const occupant = await prisma.occupant.findUnique({
      where: { id },
      include: {
        stays: {
          orderBy: { checkInDate: "desc" },
          include: {
            booking: true,
            bed: {
              include: {
                room: {
                  include: {
                    roomType: true,
                    building: {
                      include: {
                        area: true
                      }
                    }
                  }
                }
              }
            },
            logs: {
              orderBy: { performedAt: "desc" }
            }
          }
        }
      }
    });

    if (!occupant) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    // Resolve Context for proper display of Flat fields
    // We reuse the logic from getOccupants to pick "Primary"
    const activeStats = ["CHECKED_IN", "RESERVED", "PENDING"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedOccupancies = [...occupant.stays].sort((a: any, b: any) => {
       const aActive = activeStats.includes(a.status);
       const bActive = activeStats.includes(b.status);
       if (aActive && !bActive) return -1;
       if (!aActive && bActive) return 1;
       return new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
    });
    const primary = sortedOccupancies[0];

    // RESOLVE LOGS CONTEXT (Bed/Room Names)
    const bedIds = new Set<string>();
    occupant.stays.forEach(occ => {
        bedIds.add(occ.bedId);
        occ.logs.forEach(log => {
            if (log.bedId) bedIds.add(log.bedId);
            if (log.fromBedId) bedIds.add(log.fromBedId);
            if (log.toBedId) bedIds.add(log.toBedId);
        });
    });

    const bedsInfo = await prisma.bed.findMany({
      where: { id: { in: Array.from(bedIds) } },
      select: {
        id: true,
        code: true,
        room: {
            select: {
                code: true,
                building: { select: { name: true } }
            }
        }
      }
    });
    const bedMap = new Map(bedsInfo.map(b => [b.id, b]));

    // Map Nested Occupancies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedOccupancies: OccupancyDetailItem[] = occupant.stays.map((occ: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedLogs: OccupancyLogItem[] = occ.logs.map((log: any) => {
            const contextBedId = log.bedId || log.toBedId || log.fromBedId || occ.bedId;
            const bedInfo = contextBedId ? bedMap.get(contextBedId) : null;
            
            return {
                id: log.id,
                action: log.action,
                fromBedId: log.fromBedId,
                toBedId: log.toBedId,
                fromBedCode: log.fromBedId ? bedMap.get(log.fromBedId)?.code || null : null,
                toBedCode: log.toBedId ? bedMap.get(log.toBedId)?.code || null : null,
                previousCheckInDate: log.previousCheckInDate,
                newCheckInDate: log.newCheckInDate,
                previousCheckOutDate: log.previousCheckOutDate,
                newCheckOutDate: log.newCheckOutDate,
                performedBy: log.performedBy,
                performedByName: log.performedByName,
                performedAt: log.performedAt,
                reason: log.reason,
                notes: log.notes,
                buildingName: bedInfo?.room.building.name || "-",
                roomCode: bedInfo?.room.code || "-",
                bedCode: bedInfo?.code || "-",
            };
        });

        return {
            id: occ.id,
            status: occ.status,
            checkInDate: occ.checkInDate,
            checkOutDate: occ.checkOutDate,
            originalCheckOutDate: occ.originalCheckOutDate,
            actualCheckIn: occ.actualCheckIn,
            actualCheckOut: occ.actualCheckOut,
            notes: occ.notes,
            qrCode: occ.qrCode,
            bed: {
                id: occ.bed.id,
                code: occ.bed.code,
                label: occ.bed.label,
                room: {
                    id: occ.bed.room.id,
                    code: occ.bed.room.code,
                    name: occ.bed.room.name,
                    floorNumber: occ.bed.room.floorNumber,
                    building: {
                        id: occ.bed.room.building.id,
                        name: occ.bed.room.building.name,
                        area: {
                            name: occ.bed.room.building.area.name
                        }
                    }
                }
            },
            booking: occ.booking ? {
                id: occ.booking.id,
                code: occ.booking.code,
                purpose: occ.booking.purpose,
            } : null,
            logs: mappedLogs,
        };
    });

    // Construct Detail
    const detail: OccupantDetail = {
      // Base List Item Props
      id: occupant.id,
      occupantId: occupant.id,
      occupantName: occupant.name,
      occupantNik: occupant.nik,
      occupantType: occupant.type,
      occupantGender: occupant.gender,
      occupantPhone: occupant.phone,
      occupantEmail: occupant.email,
      occupantCompany: occupant.company,
      
      // Primary Info
      primaryOccupancyId: primary?.id || null,
      checkInDate: primary?.checkInDate || null,
      checkOutDate: primary?.checkOutDate || null,
      actualCheckIn: primary?.actualCheckIn || null,
      actualCheckOut: primary?.actualCheckOut || null,
      status: primary?.status || null,

      bedId: primary?.bedId || null,
      bedCode: primary?.bed.code || null,
      bedLabel: primary?.bed.label || null,
      roomId: primary?.bed.room.id || null,
      roomCode: primary?.bed.room.code || null,
      roomName: primary?.bed.room.name || null,
      floorNumber: primary?.bed.room.floorNumber || null,
      buildingId: primary?.bed.room.building.id || null,
      buildingCode: primary?.bed.room.building.code || null,
      buildingName: primary?.bed.room.building.name || null,
      areaId: primary?.bed.room.building.area.id || null,
      areaName: primary?.bed.room.building.area.name || null,

      bookingId: primary?.bookingId || null,
      bookingCode: primary?.booking?.code || null,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeOccupancyCount: occupant.stays.filter((o: any) => activeStats.includes(o.status)).length,
      totalOccupancyCount: occupant.stays.length,

      createdAt: occupant.createdAt,
      createdBy: null,
      createdByName: null,

      // Detail Props
      occupantUserId: occupant.userId,
      occupantDepartment: occupant.department,
      occupantPosition: occupant.position,
      updatedAt: occupant.updatedAt,
      
      occupancies: mappedOccupancies
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
    const areas = await prisma.area.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
    
    const buildings = await prisma.building.findMany({
      where: { status: true },
      select: { id: true, code: true, name: true, areaId: true },
      orderBy: { name: "asc" },
    });
    
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
// GET ALL PAGE DATA
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

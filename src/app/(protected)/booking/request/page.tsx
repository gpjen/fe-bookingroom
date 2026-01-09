"use client";

import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import {
  ClipboardList,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { usePermissions } from "@/providers/permissions-provider";

// Local components & types
import { getColumns } from "./_components/columns";
import { BookingDetailDialog } from "./_components/booking-detail-dialog";
import { BookingFilters } from "./_components/booking-filters";
import {
  BookingTableItem,
  BookingDetailData,
  OccupancyStatus,
} from "./_components/types";

// API actions & types
import {
  getAllBookings,
  getBookingById,
  approveBookingItems,
  rejectBooking,
  type BookingListItemExtended,
} from "../_actions/booking.actions";
import { type BookingDetail } from "../_actions/booking.types";

// ==========================================
// TRANSFORM FUNCTIONS
// ==========================================

function transformToTableItem(
  booking: BookingListItemExtended
): BookingTableItem {
  return {
    id: booking.id,
    bookingCode: booking.code,
    requesterName: booking.requesterName,
    requesterCompany: booking.requesterCompany || "-",
    status: booking.status,
    checkInDate: booking.checkInDate ? new Date(booking.checkInDate) : null,
    checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate) : null,
    occupantCount: booking.occupantCount,
    purpose: booking.purpose || "-",
    areaName: booking.areaName || "-",
    hasGuest: booking.hasGuest,
    createdAt: new Date(booking.createdAt),
  };
}

function transformToDetailData(data: BookingDetail): BookingDetailData {
  // DEBUG: Log raw data from API
  console.log("=== DEBUG transformToDetailData ===");
  console.log(
    "Raw requestItems from API:",
    data.requestItems?.map((ri) => ({
      name: ri.name,
      bedId: ri.bedId,
      bed: ri.bed,
      "ri.bed?.room": ri.bed?.room,
      "ri.bed?.room?.building": ri.bed?.room?.building,
      "ri.bed?.room?.building?.id": ri.bed?.room?.building?.id,
    }))
  );
  console.log("===================================");

  return {
    id: data.id,
    code: data.code,
    status: data.status,
    checkInDate: data.checkInDate ? new Date(data.checkInDate) : null,
    checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : null,
    requesterUserId: data.requesterUserId,
    requesterName: data.requesterName,
    requesterNik: data.requesterNik,
    requesterEmail: data.requesterEmail,
    requesterPhone: data.requesterPhone,
    requesterCompany: data.requesterCompany,
    requesterDepartment: data.requesterDepartment,
    requesterPosition: data.requesterPosition,
    companion: data.companionName
      ? {
          name: data.companionName,
          nik: data.companionNik,
          email: data.companionEmail,
          phone: data.companionPhone,
          company: data.companionCompany,
          department: data.companionDepartment,
        }
      : null,
    purpose: data.purpose,
    projectCode: data.projectCode,
    notes: data.notes,
    approvedBy: data.approvedBy,
    approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
    rejectedBy: data.rejectedBy,
    rejectedAt: data.rejectedAt ? new Date(data.rejectedAt) : null,
    rejectionReason: data.rejectionReason,
    cancelledBy: data.cancelledBy,
    cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null,
    cancellationReason: data.cancellationReason,
    occupants: (() => {
      console.log(
        "DEBUG: occupancies.length =",
        data.occupancies.length,
        "requestItems.length =",
        data.requestItems.length
      );
      console.log(
        "DEBUG: Using",
        data.occupancies.length > 0 ? "OCCUPANCIES" : "REQUEST_ITEMS",
        "path"
      );
      return data.occupancies.length > 0;
    })()
      ? data.occupancies.map((occ) => ({
          id: occ.id,
          name: occ.occupant.name,
          identifier: occ.occupant.nik || "-",
          type:
            occ.occupant.type === "GUEST"
              ? ("guest" as const)
              : ("employee" as const),
          gender:
            occ.occupant.gender === "FEMALE" ? ("P" as const) : ("L" as const),
          company: occ.occupant.company,
          department: occ.occupant.department,
          phone: occ.occupant.phone,
          inDate: new Date(occ.checkInDate),
          outDate: occ.checkOutDate
            ? new Date(occ.checkOutDate)
            : new Date(occ.checkInDate),
          status: occ.status as OccupancyStatus,
          buildingId: occ.bed?.room?.building?.id || "",
          buildingName: occ.bed?.room?.building?.name,
          roomCode: occ.bed?.room?.code,
          bedCode: occ.bed?.code,
          bedId: occ.bed?.id,
          cancelledAt: occ.cancelledAt ? new Date(occ.cancelledAt) : null,
          cancelledByName: occ.cancelledByName,
          cancelledReason: occ.cancelledReason,
        }))
      : data.requestItems.map((ri) => ({
          id: ri.id,
          name: ri.name,
          identifier: ri.nik || "-",
          type:
            ri.type === "GUEST" ? ("guest" as const) : ("employee" as const),
          gender: ri.gender === "FEMALE" ? ("P" as const) : ("L" as const),
          company: ri.company,
          department: ri.department,
          phone: ri.phone,
          inDate: new Date(ri.checkInDate),
          outDate: new Date(ri.checkOutDate),
          status: (ri.approvedAt
            ? "RESERVED"
            : ri.rejectedAt
            ? "CANCELLED"
            : "PENDING") as OccupancyStatus,
          buildingId: ri.bed?.room?.building?.id || "",
          buildingName: ri.bed?.room?.building?.name || "",
          roomCode: ri.bed?.room?.code || "",
          bedCode: ri.bed?.code || "",
          bedId: ri.bedId,
          // Approval tracking
          approvedAt: ri.approvedAt ? new Date(ri.approvedAt) : null,
          approvedByName: ri.approvedByName,
          rejectedAt: ri.rejectedAt ? new Date(ri.rejectedAt) : null,
          rejectedByName: ri.rejectedByName,
          rejectedReason: ri.rejectedReason,
        })),
    attachments: data.attachments,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function BookingRequestPage() {
  // Get user's accessible buildings
  const { buildings, isLoading: permissionsLoading } = usePermissions();
  const buildingIds = buildings.map((b) => b.id);

  // List state
  const [bookings, setBookings] = useState<BookingTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<BookingDetailData | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ==========================================
  // API CALLS
  // ==========================================

  const fetchBookings = useCallback(async () => {
    // Wait for permissions to load
    if (permissionsLoading) return;

    // If no building access, show empty
    if (buildingIds.length === 0) {
      setBookings([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getAllBookings({
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
      buildingIds, // Filter by user's accessible buildings
    });

    if (result.success) {
      setBookings(result.data.data.map(transformToTableItem));
      setTotal(result.data.total);
    } else {
      setError(result.error);
      toast.error(result.error);
    }

    setIsLoading(false);
  }, [searchQuery, statusFilter, dateRange, buildingIds, permissionsLoading]);

  const fetchBookingDetail = useCallback(
    async (bookingId: string) => {
      setIsLoadingDetail(true);
      setBookingDetail(null);

      const result = await getBookingById(bookingId);

      if (result.success) {
        // Transform and add canApprove flag based on buildingIds
        const detailData = transformToDetailData(result.data);

        // DEBUG: Log building access
        console.log("=== DEBUG canApprove ===");
        console.log("User's buildingIds:", buildingIds);
        console.log(
          "Occupants buildingIds:",
          detailData.occupants.map((o) => ({
            name: o.name,
            buildingId: o.buildingId,
            buildingName: o.buildingName,
          }))
        );

        // Mark which items admin can approve
        detailData.occupants = detailData.occupants.map((occ) => ({
          ...occ,
          canApprove: occ.buildingId
            ? buildingIds.includes(occ.buildingId)
            : false,
        }));

        console.log(
          "canApprove results:",
          detailData.occupants.map((o) => ({
            name: o.name,
            canApprove: o.canApprove,
          }))
        );
        console.log("========================");

        setBookingDetail(detailData);
      } else {
        toast.error(result.error);
      }

      setIsLoadingDetail(false);
    },
    [buildingIds]
  );

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleViewBooking = (booking: BookingTableItem) => {
    setIsDialogOpen(true);
    fetchBookingDetail(booking.id);
  };

  const handleApprove = async (bookingId: string, notes?: string) => {
    if (!bookingDetail) return;

    // DEBUG: Log current state
    console.log("=== DEBUG handleApprove ===");
    console.log("Current buildingIds:", buildingIds);
    console.log(
      "Occupants:",
      bookingDetail.occupants.map((o) => ({
        id: o.id,
        name: o.name,
        buildingId: o.buildingId,
        approvedAt: o.approvedAt,
        rejectedAt: o.rejectedAt,
      }))
    );

    // Compute which items admin can approve NOW (using current buildingIds)
    const itemsToApprove = bookingDetail.occupants
      .filter((occ) => {
        const hasAccess = occ.buildingId
          ? buildingIds.includes(occ.buildingId)
          : false;
        const notApproved = !occ.approvedAt;
        const notRejected = !occ.rejectedAt;
        console.log(
          `Item ${occ.name}: buildingId=${occ.buildingId}, hasAccess=${hasAccess}, notApproved=${notApproved}, notRejected=${notRejected}`
        );
        return hasAccess && notApproved && notRejected;
      })
      .map((occ) => occ.id);

    console.log("Items to approve:", itemsToApprove);
    console.log("===========================");

    if (itemsToApprove.length === 0) {
      toast.error("Tidak ada item yang bisa Anda approve");
      return;
    }

    const result = await approveBookingItems({
      bookingId,
      itemIds: itemsToApprove,
      buildingIds,
      notes,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.data.allApproved) {
      toast.success("Booking sepenuhnya disetujui!");
    } else {
      toast.success(
        `${itemsToApprove.length} item berhasil disetujui. Menunggu approval gedung lain.`
      );
    }

    await fetchBookings();
  };

  const handleReject = async (bookingId: string, reason: string) => {
    const result = await rejectBooking({ bookingId, reason });

    if (!result.success) {
      throw new Error(result.error);
    }

    await fetchBookings();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setBookingDetail(null);
  };

  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    fetchBookings();
  };

  const handleExport = () => {
    toast.success("Export dimulai", {
      description: `Mengekspor ${bookings.length} data`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");

    setDateRange(undefined);
    toast.info("Filter telah direset");
  };

  const activeFiltersCount = [
    statusFilter !== "all",

    dateRange?.from || dateRange?.to,
    searchQuery,
  ].filter(Boolean).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6" /> Permintaan Pemesanan
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola dan verifikasi permintaan pemesanan ruangan.
              {total > 0 && (
                <span className="ml-2 text-sm font-medium">
                  ({total} total data)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Muat Ulang
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <BookingFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            clearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
              <p className="text-lg font-medium">Gagal memuat data</p>
              <p className="text-sm">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="rounded-md">
              {isLoading && bookings.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Memuat data...
                  </span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Tidak ada data booking</p>
                  <p className="text-sm">
                    Belum ada permintaan pemesanan yang tersedia
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={getColumns({ onView: handleViewBooking })}
                  data={bookings}
                />
              )}
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <BookingDetailDialog
          booking={bookingDetail}
          isOpen={isDialogOpen}
          isLoading={isLoadingDetail}
          onClose={handleCloseDialog}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, BookingTableItem } from "./_components/columns";
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
import { BookingDetailDialog } from "./_components/booking-detail-dialog";
import { BookingFilters } from "./_components/booking-filters";
import {
  getAllBookings,
  type BookingListItemExtended,
} from "../_actions/booking.actions";

// Map database status to UI status
function mapStatus(dbStatus: string): BookingTableItem["status"] {
  switch (dbStatus) {
    case "PENDING":
      return "request";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    default:
      return "request";
  }
}

// Map UI status to database status
function mapStatusToDb(uiStatus: string): string {
  switch (uiStatus) {
    case "request":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    default:
      return uiStatus.toUpperCase();
  }
}

// Transform API data to table format
function transformBooking(booking: BookingListItemExtended): BookingTableItem {
  return {
    id: booking.id,
    bookingCode: booking.code,
    requesterName: booking.requesterName,
    requesterCompany: booking.requesterCompany || "-",
    status: mapStatus(booking.status),
    checkInDate: new Date(booking.checkInDate),
    checkOutDate: new Date(booking.checkOutDate),
    occupantCount: booking.occupantCount,
    purpose: booking.purpose || "-",
    areaName: booking.areaName || "-",
    hasGuest: booking.hasGuest,
    createdAt: new Date(booking.createdAt),
  };
}

export default function BookingRequestPage() {
  const [bookings, setBookings] = useState<BookingTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog states
  const [selectedBooking, setSelectedBooking] =
    useState<BookingTableItem | null>(null);
  const [actionType, setActionType] = useState<
    "view" | "approve" | "reject" | null
  >(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getAllBookings({
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? mapStatusToDb(statusFilter) : undefined,
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
    });

    if (result.success) {
      setBookings(result.data.data.map(transformBooking));
      setTotal(result.data.total);
    } else {
      setError(result.error);
      toast.error(result.error);
    }

    setIsLoading(false);
  }, [searchQuery, statusFilter, dateRange]);

  // Initial load and refresh on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const handleAction = (
    booking: BookingTableItem,
    type: "view" | "approve" | "reject"
  ) => {
    setSelectedBooking(booking);
    setActionType(type);
  };

  const handleConfirmAction = () => {
    // TODO: Implement approve/reject with API
    toast.info("Fitur approve/reject akan diimplementasi");
    setSelectedBooking(null);
    setActionType(null);
    setAdminNotes("");
    setRejectReason("");
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
    setTypeFilter("all");
    setDateRange(undefined);
    toast.info("Filter telah direset");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    searchQuery !== "",
    dateRange?.from !== undefined || dateRange?.to !== undefined,
  ].filter(Boolean).length;

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
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

        <div className="space-y-4">
          <BookingFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
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
                  columns={getColumns({
                    onView: (b) => handleAction(b, "view"),
                  })}
                  data={bookings}
                />
              )}
            </div>
          )}
        </div>

        {/* Keep dialog for future use - will implement detail view later */}
        {selectedBooking && (
          <BookingDetailDialog
            booking={null} // Will implement proper mapping later
            actionType={actionType}
            adminNotes={adminNotes}
            onAdminNotesChange={setAdminNotes}
            rejectReason={rejectReason}
            onRejectReasonChange={setRejectReason}
            onConfirm={handleConfirmAction}
            onRequestApprove={() => setActionType("approve")}
            onRequestReject={() => setActionType("reject")}
            onCancel={() => {
              setSelectedBooking(null);
              setActionType(null);
              setAdminNotes("");
              setRejectReason("");
            }}
          />
        )}
      </div>
    </Card>
  );
}

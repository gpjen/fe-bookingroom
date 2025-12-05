"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./_components/columns";
import { BookingRequest, BookingStatus } from "./_components/types";
import { MOCK_BOOKING_REQUESTS, BUILDINGS } from "./_components/mock-data";
import { DateRange } from "react-day-picker";
import { ClipboardList, Download, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { addDays } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookingDetailDialog } from "./_components/booking-detail-dialog";
import { BookingFilters } from "./_components/booking-filters";

export default function BookingRequestPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>(
    MOCK_BOOKING_REQUESTS
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<
    "view" | "approve" | "reject" | null
  >(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const handleAction = (
    booking: BookingRequest,
    type: "view" | "approve" | "reject"
  ) => {
    setSelectedBooking(booking);
    setActionType(type);
    setAdminNotes(booking.adminNotes || "");
    setRejectReason(booking.rejectReason || "");
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      booking.bookingCode.toLowerCase().includes(searchLower) ||
      booking.requester.name.toLowerCase().includes(searchLower) ||
      booking.requester.nik.toLowerCase().includes(searchLower) ||
      booking.occupants.some((occ) =>
        occ.name.toLowerCase().includes(searchLower)
      ) ||
      booking.occupants.some((occ) =>
        BUILDINGS.find((b) => b.id === occ.buildingId)
          ?.name.toLowerCase()
          .includes(searchLower)
      ) ||
      BUILDINGS.find((b) => b.areaId === booking.areaId)
        ?.area.toLowerCase()
        .includes(searchLower);

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;

    const matchesDate =
      !dateRange?.from ||
      booking.occupants.some(
        (occ) =>
          occ.inDate >= dateRange.from! &&
          (!dateRange.to || occ.inDate <= dateRange.to!)
      );

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleConfirmAction = (updatedBookingFromDialog?: BookingRequest) => {
    if (!selectedBooking || !actionType) return;

    const updatedBookings = bookings.map((b) => {
      if (b.id === selectedBooking.id) {
        const baseBooking = updatedBookingFromDialog || b;

        return {
          ...baseBooking,
          status:
            actionType === "approve"
              ? ("approved" as BookingStatus)
              : actionType === "reject"
              ? ("rejected" as BookingStatus)
              : baseBooking.status,
          adminNotes: adminNotes,
          rejectReason: actionType === "reject" ? rejectReason : undefined,
          approvedAt: actionType === "approve" ? new Date() : undefined,
          approvedBy: actionType === "approve" ? "Admin System" : undefined,
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    toast.success(
      actionType === "approve"
        ? "Booking berhasil disetujui"
        : "Booking berhasil ditolak"
    );
    setSelectedBooking(null);
    setActionType(null);
    setAdminNotes("");
    setRejectReason("");
  };

  const handleCancelAction = () => {
    setActionType(null);
    setSelectedBooking(null);
    setAdminNotes("");
    setRejectReason(""); // Reset rejectReason on cancel
  };

  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    setTimeout(() => {
      setBookings(MOCK_BOOKING_REQUESTS);
      toast.success("Data berhasil dimuat ulang");
    }, 500);
  };

  const handleExport = () => {
    toast.success("Export dimulai", {
      description: `Mengekspor ${filteredBookings.length} data`,
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
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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

          <div className="rounded-md">
            <DataTable
              columns={getColumns({
                onView: (b) => handleAction(b, "view"),
              })}
              data={filteredBookings}
            />
          </div>
        </div>

        <BookingDetailDialog
          booking={selectedBooking}
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
      </div>
    </Card>
  );
}

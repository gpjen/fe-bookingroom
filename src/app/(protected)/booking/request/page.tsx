"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./_components/columns";
import { BookingRequest } from "./_components/types";
import { MOCK_BOOKING_REQUESTS } from "./_components/mock-data";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<
    "view" | "approve" | "reject" | null
  >(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.requester.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking.requester.nik.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const matchesType =
      typeFilter === "all" || booking.bookingType === typeFilter;

    const matchesDate =
      (!dateRange?.from || booking.checkInDate >= dateRange.from) &&
      (!dateRange?.to || booking.checkInDate <= addDays(dateRange.to, 1));

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handleView = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setActionType("view");
    setAdminNotes("");
  };

  const handleApprove = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setActionType("approve");
    setAdminNotes("");
  };

  const handleReject = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setActionType("reject");
    setAdminNotes("");
  };

  const handleConfirmAction = () => {
    if (!selectedBooking || !actionType) return;

    const updatedBookings = bookings.map((b) => {
      if (b.id === selectedBooking.id) {
        const updated = { ...b };

        if (actionType === "approve") {
          updated.status = "approved";
          updated.approvedAt = new Date();
          updated.approvedBy = "Admin System";
          if (adminNotes) updated.adminNotes = adminNotes;
          toast.success("Booking berhasil disetujui", {
            description: `${updated.bookingCode} - ${updated.requester.name}`,
          });
        } else if (actionType === "reject") {
          updated.status = "rejected";
          updated.adminNotes = adminNotes || "Ditolak oleh admin";
          toast.error("Booking ditolak", {
            description: `${updated.bookingCode} - ${updated.requester.name}`,
          });
        }

        return updated;
      }
      return b;
    });

    setBookings(updatedBookings);
    setSelectedBooking(null);
    setActionType(null);
    setAdminNotes("");
  };

  const handleCancelAction = () => {
    setActionType(null);
    setSelectedBooking(null);
    setAdminNotes("");
  };

  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    // Simulate refresh
    setTimeout(() => {
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
    setDateRange({
      from: addDays(new Date(), -7),
      to: new Date(),
    });
    toast.info("Filter telah direset");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const columns = getColumns({
    onView: handleView,
    onApprove: handleApprove,
    onReject: handleReject,
  });

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

        {/* Main Content */}
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

          <DataTable columns={columns} data={filteredBookings} />
        </div>

        {/* Detail Dialog */}
        {selectedBooking && actionType && (
          <BookingDetailDialog
            booking={selectedBooking}
            actionType={actionType}
            adminNotes={adminNotes}
            onAdminNotesChange={setAdminNotes}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
          />
        )}
      </div>
    </Card>
  );
}

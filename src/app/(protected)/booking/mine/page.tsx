"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/ui/data-table";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { MyBookingDetailDialog } from "./_components/my-booking-detail-dialog";
import {
  MOCK_BOOKING_REQUESTS,
  BUILDINGS,
} from "@/app/(protected)/booking/request/_components/mock-data";
import type {
  BookingRequest,
  BookingStatus,
  OccupantStatus,
} from "@/app/(protected)/booking/request/_components/types";
import { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn, formatDate } from "@/lib/utils";
import {
  FileText,
  Search,
  Filter,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { BookingRequestForm } from "@/components/booking/booking-request-form";

const getStatusConfig = (status: BookingStatus) => {
  const config: Record<
    BookingStatus,
    { label: string; className: string; icon: typeof Clock }
  > = {
    request: {
      label: "Menunggu",
      className:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
      icon: Clock,
    },
    approved: {
      label: "Disetujui",
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: CheckCircle,
    },
    rejected: {
      label: "Ditolak",
      className:
        "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400",
      icon: XCircle,
    },
    cancelled: {
      label: "Dibatalkan",
      className:
        "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
      icon: Ban,
    },
    expired: {
      label: "Kedaluwarsa",
      className:
        "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
      icon: AlertCircle,
    },
  };
  return config[status];
};

interface ColumnsProps {
  onView: (booking: BookingRequest) => void;
}

const getColumns = ({ onView }: ColumnsProps): ColumnDef<BookingRequest>[] => [
  {
    id: "no",
    header: () => <div className="text-center font-semibold">NO</div>,
    cell: ({ row, table }) => {
      const paginatedRows = table.getPaginationRowModel().rows;
      const indexInPage = paginatedRows.findIndex((r) => r.id === row.id);
      const { pageIndex, pageSize } = table.getState().pagination;
      const number = pageIndex * pageSize + indexInPage + 1;

      return (
        <div className="text-center font-medium text-muted-foreground w-12">
          {number}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "bookingCode",
    header: "Kode Booking",
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold text-primary">
        {row.original.bookingCode}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = getStatusConfig(status);
      const Icon = config.icon;
      const expiredDate = row.original.expiresAt;

      return (
        <div className="flex flex-col">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs font-medium flex items-center w-fit",
              config.className
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>

          {expiredDate && status === "request" && (
            <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
              Exp: {formatDate(expiredDate)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "occupants",
    header: "Penghuni",
    cell: ({ row }) => {
      const occupants = row.original.occupants;
      const count = occupants.length;
      const types = occupants.reduce(
        (acc, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const summary = Object.entries(types)
        .map(([type, cnt]) => {
          const label = type === "employee" ? "Karyawan" : "Tamu";
          return `${cnt} ${label}`;
        })
        .join(", ");

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{count} Orang</span>
          <span className="text-xs text-muted-foreground">{summary}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Lokasi",
    cell: ({ row }) => {
      const booking = row.original;
      // Get unique buildings from occupants
      const uniqueBuildingIds = [
        ...new Set(
          booking.occupants.filter((o) => o.buildingId).map((o) => o.buildingId)
        ),
      ];
      const buildingNames = uniqueBuildingIds
        .map((id) => BUILDINGS.find((b) => b.id === id)?.name)
        .filter(Boolean);
      const areaName =
        BUILDINGS.find((b) => b.areaId === booking.areaId)?.area || "-";

      return (
        <div className="flex flex-col space-y-0.5">
          <span className="font-medium text-sm">
            {buildingNames.length > 0 ? buildingNames.join(", ") : "Belum ditentukan"}
          </span>
          <span className="text-xs text-muted-foreground">
            {areaName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "dateRange",
    header: "Periode",
    cell: ({ row }) => {
      const occupants = row.original.occupants;
      if (occupants.length === 0) return <span>-</span>;

      const earliestDate = occupants.reduce(
        (min, occ) => (occ.inDate < min ? occ.inDate : min),
        occupants[0].inDate
      );
      const latestDate = occupants.reduce(
        (max, occ) => (occ.outDate && occ.outDate > max ? occ.outDate : max),
        occupants[0].outDate || occupants[0].inDate
      );

      return (
        <div className="flex flex-col space-y-0.5">
          <span className="text-sm font-medium">
            {format(earliestDate, "dd MMM", { locale: localeId })} -{" "}
            {format(latestDate, "dd MMM yyyy", { locale: localeId })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "purpose",
    header: "Tujuan",
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <div className="flex flex-col max-w-[200px]">
          <span className="text-sm font-medium truncate">{booking.purpose}</span>
          {booking.notes && (
            <span className="text-xs text-muted-foreground truncate italic">
              &quot;{booking.notes}&quot;
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "requestedAt",
    header: "Tgl Pengajuan",
    cell: ({ row }) => (
      <div className="text-sm">{formatDate(row.original.requestedAt)}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(booking)}
            className="h-8 px-3"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Detail
          </Button>
        </div>
      );
    },
  },
];

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>(MOCK_BOOKING_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog states
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        booking.bookingCode.toLowerCase().includes(searchLower) ||
        booking.purpose.toLowerCase().includes(searchLower) ||
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
        booking.occupants.some((occ) => {
          const checkIn = occ.inDate;
          return (
            checkIn >= dateRange.from! &&
            (!dateRange.to || checkIn <= dateRange.to)
          );
        });

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }, [bookings, searchQuery, statusFilter, dateRange]);

  const handleView = (booking: BookingRequest) => {
    setSelectedBooking(booking);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange(undefined);
    toast.info("Filter telah direset");
  };

  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    setTimeout(() => {
      toast.success("Data berhasil dimuat ulang");
    }, 500);
  };

  const handleFormSubmit = (data: unknown) => {
    console.log("Booking Request Data:", data);
    setIsFormOpen(false);
    toast.success("Permintaan booking berhasil dibuat");
  };

  const handleCancelRequest = (bookingId: string, reason: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "cancelled" as BookingStatus,
              cancelledAt: new Date(),
              adminNotes: reason,
            }
          : b
      )
    );
    toast.success("Permintaan booking berhasil dibatalkan");
  };

  const handleCancelOccupant = (
    bookingId: string,
    occupantId: string,
    reason: string
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              occupants: b.occupants.map((occ) =>
                occ.id === occupantId
                  ? {
                      ...occ,
                      status: "cancelled" as OccupantStatus,
                      cancelledAt: new Date(),
                      cancelReason: reason,
                    }
                  : occ
              ),
            }
          : b
      )
    );
    toast.success("Penghuni berhasil dibatalkan dari booking");
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    searchQuery !== "",
    dateRange?.from !== undefined,
  ].filter(Boolean).length;

  // Stats
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((r) => r.status === "request").length,
      approved: bookings.filter((r) => r.status === "approved").length,
      rejected: bookings.filter((r) => r.status === "rejected").length,
    };
  }, [bookings]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" /> Pemesanan Saya
            </h1>
            <p className="text-muted-foreground mt-1">
              Daftar semua permintaan booking yang telah Anda ajukan.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Muat Ulang
            </Button>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Permintaan
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Menunggu</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Disetujui</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Ditolak</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="p-4 md:p-6">
          <div className="space-y-4">
            {/* Filters */}
            <div className="w-full">
              {/* Desktop Filter Bar */}
              <div className="hidden lg:flex flex-wrap items-center gap-3 p-1 rounded-lg">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode, nama penghuni, lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <div className="h-8 w-[1px] bg-border mx-1" />

                <DatePickerWithRange
                  date={dateRange}
                  setDate={setDateRange}
                  className="w-auto h-9"
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="request">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground ml-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Mobile/Tablet Filter */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full"
                  />
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 relative"
                    >
                      <Filter className="h-4 w-4" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filter Data</SheetTitle>
                      <SheetDescription>
                        Sesuaikan filter untuk menemukan data yang Anda cari.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Periode Tanggal
                        </label>
                        <DatePickerWithRange
                          date={dateRange}
                          setDate={setDateRange}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Status Booking
                        </label>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="request">Menunggu</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                            <SelectItem value="expired">Kedaluwarsa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <SheetFooter className="flex-col sm:flex-row gap-2">
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full sm:w-auto"
                        >
                          Reset Filter
                        </Button>
                      )}
                      <SheetClose asChild>
                        <Button className="w-full sm:w-auto">Terapkan</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-md">
              <DataTable
                columns={getColumns({ onView: handleView })}
                data={filteredBookings}
                showColumnToggle={true}
                showPagination={true}
                pageSizeOptions={[10, 20, 50, 100]}
                emptyMessage="Tidak ada data pemesanan ditemukan."
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Booking Detail Dialog */}
      {selectedBooking && (
        <MyBookingDetailDialog
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelRequest={handleCancelRequest}
          onCancelOccupant={handleCancelOccupant}
        />
      )}

      {/* Booking Request Form Dialog */}
      <BookingRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import { DataTable } from "@/components/ui/data-table";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { MyBookingDetailDialog } from "./_components/my-booking-detail-dialog";
import {
  BookingRequest,
  BookingStatus,
  OccupancyStatus,
  BookingOccupant,
  BOOKING_STATUS_CONFIG,
  CompanionInfo,
} from "@/app/(protected)/booking/request/_components/types";
import { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { cn, formatDate } from "@/lib/utils";
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BookingRequestForm } from "@/components/booking/booking-request-form";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  getMyBookings,
  getBookingById,
  cancelBooking,
  cancelOccupancy,
  createBookingRequest,
} from "../_actions/booking.actions";
import {
  type BookingDetail,
  type BookingListItem,
  type CreateBookingInput,
} from "../_actions/booking.types";

// ==========================================
// TRANSFORMER
// ==========================================

function transformToDetailData(data: BookingDetail): BookingRequest {
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
    // Cancellation only (approval/rejection now at item level)
    cancelledBy: data.cancelledBy,
    cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null,
    cancellationReason: data.cancellationReason,
    occupants:
      data.occupancies.length > 0
        ? data.occupancies.map((occ) => ({
            id: occ.id,
            name: occ.occupant.name,
            identifier: occ.occupant.nik || "-",
            type: occ.occupant.type === "GUEST" ? "guest" : "employee",
            gender:
              occ.occupant.gender === "FEMALE"
                ? ("P" as const)
                : ("L" as const),
            company: occ.occupant.company,
            department: occ.occupant.department,
            phone: occ.occupant.phone,
            inDate: new Date(occ.checkInDate),
            outDate: occ.checkOutDate
              ? new Date(occ.checkOutDate)
              : new Date(occ.checkInDate),
            status: occ.status as OccupancyStatus,
            buildingName: occ.bed?.room?.building?.name,
            roomCode: occ.bed?.room?.code,
            bedCode: occ.bed?.code,
            // Approval tracking
            approvedAt: occ.approvedAt ? new Date(occ.approvedAt) : null,
            approvedByName: occ.approvedByName,
            rejectedAt: null,
            rejectedByName: null,
            rejectedReason: null,
            // Cancellation
            cancelledAt: occ.cancelledAt ? new Date(occ.cancelledAt) : null,
            cancelledByName: occ.cancelledByName,
            cancelledReason: occ.cancelledReason,
          }))
        : data.requestItems.map((ri) => ({
            id: ri.id,
            name: ri.name,
            identifier: ri.nik || "-",
            type: ri.type === "GUEST" ? "guest" : "employee",
            gender: ri.gender === "FEMALE" ? "P" : "L",
            company: ri.company,
            department: ri.department,
            phone: ri.phone,
            inDate: new Date(ri.checkInDate),
            outDate: new Date(ri.checkOutDate),
            status: "PENDING" as OccupancyStatus,
            buildingName: ri.bed?.room?.building?.name || "",
            roomCode: ri.bed?.room?.code || "",
            bedCode: ri.bed?.code || "",
          })),
    attachments: data.attachments,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

// ==========================================
// COLUMNS
// ==========================================

interface ColumnsProps {
  onView: (booking: BookingListItem) => void;
}

const getColumns = ({ onView }: ColumnsProps): ColumnDef<BookingListItem>[] => [
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
    accessorKey: "code",
    header: "Kode Booking",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = BOOKING_STATUS_CONFIG[status];
      // Fallback if config missing
      if (!config) return <Badge>{status}</Badge>;

      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 text-xs font-medium flex items-center w-fit",
            config.className
          )}
        >
          {status === "PENDING" && <Clock className="h-3 w-3" />}
          {status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
          {status === "REJECTED" && <XCircle className="h-3 w-3" />}
          {status === "CANCELLED" && <Ban className="h-3 w-3" />}
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "occupantCount",
    header: () => <div className="text-center">Penghuni</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.occupantCount} org
      </div>
    ),
  },
  {
    accessorKey: "purpose",
    header: "Tujuan",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className="text-sm line-clamp-1 max-w-[200px] cursor-help">
              {row.original.purpose}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[400px] p-4 text-sm bg-popover text-popover-foreground shadow-xl">
            <p className="whitespace-pre-wrap">{row.original.purpose}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal Request",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(row.original)}
          title="Lihat Detail"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function MyBookingsPage() {
  // State
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog state
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // API Call
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMyBookings({
        search: searchQuery || undefined,
        status:
          statusFilter !== "all" ? (statusFilter as BookingStatus) : undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
        limit: 50, // Reasonable limit for "My Bookings"
      });

      if (result.success) {
        setBookings(result.data.data);
        setTotal(result.data.total);
      } else {
        setError(result.error);
        toast.error("Gagal memuat data booking", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem");
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, dateRange]);

  // View Detail Handler
  const handleView = async (item: BookingListItem) => {
    setIsDetailOpen(true);
    setSelectedBooking(null);

    try {
      const result = await getBookingById(item.id);
      if (result.success) {
        const detail = transformToDetailData(result.data);
        setSelectedBooking(detail);
      } else {
        toast.error("Gagal memuat detail", { description: result.error });
        setIsDetailOpen(false);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat detail");
      setIsDetailOpen(false);
    }
  };

  // Initial Fetch & Debounce
  useEffect(() => {
    const timer = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  // Handlers
  const handleRefresh = () => {
    toast.info("Memuat ulang data...");
    fetchBookings();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange(undefined);
    toast.info("Filter direset");
  };

  const handleFormSubmit = async (data: {
    areaId: string;
    purpose: string;
    notes?: string;
    occupants: BookingOccupant[];
    companion?: CompanionInfo;
  }) => {
    try {
      // Calculate check-in/out dates from occupants
      const occupants = data.occupants;

      const checkInDateValue = occupants.reduce((min, o) => {
        const date = o.inDate ? new Date(o.inDate).getTime() : Infinity;
        return date < min ? date : min;
      }, Infinity);

      const checkInDate =
        checkInDateValue === Infinity ? new Date() : new Date(checkInDateValue);

      const checkOutDateValue = occupants.reduce((max, o) => {
        const date = o.outDate ? new Date(o.outDate).getTime() : 0;
        return date > max ? date : max;
      }, 0);

      const checkOutDate =
        checkOutDateValue > 0
          ? new Date(checkOutDateValue)
          : new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000); // Default 1 day

      const payload: CreateBookingInput = {
        purpose: data.purpose,
        notes: data.notes,
        checkInDate,
        checkOutDate,
        occupants: occupants.map((o) => ({
          bedId: o.bedId || "",
          name: o.name,
          nik: o.identifier,
          type: o.type === "guest" ? "GUEST" : "EMPLOYEE",
          gender: o.gender === "P" ? "FEMALE" : "MALE",
          email: o.email || undefined,
          phone: o.phone || undefined,
          company: o.company || undefined,
          department: o.department || undefined,
          // Per-occupant dates
          checkInDate: o.inDate,
          checkOutDate: o.outDate,
        })),
        companion: data.companion
          ? {
              name: data.companion.name || "",
              nik: data.companion.nik || "",
              email: data.companion.email || undefined,
              phone: data.companion.phone || undefined,
              company: data.companion.company || undefined,
              department: data.companion.department || undefined,
            }
          : undefined,
      };

      const result = await createBookingRequest(payload);

      if (result.success) {
        setIsFormOpen(false);
        toast.success("Permintaan booking berhasil dibuat");
        fetchBookings(); // Reload data
      } else {
        toast.error("Gagal membuat booking", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleCancelRequest = async (bookingId: string, reason: string) => {
    try {
      const result = await cancelBooking({ bookingId, reason });
      if (result.success) {
        toast.success("Booking berhasil dibatalkan");
        fetchBookings();
        setIsDetailOpen(false);
      } else {
        toast.error("Gagal membatalkan", { description: result.error });
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleCancelOccupant = async (
    bookingId: string,
    occupantId: string,
    reason: string
  ) => {
    try {
      const result = await cancelOccupancy({
        bookingId,
        occupancyId: occupantId,
        reason,
      });
      if (result.success) {
        toast.success("Penghuni berhasil dibatalkan");
        // Refetch the detail to update the UI
        if (selectedBooking) {
          const updatedDetail = await getBookingById(selectedBooking.id);
          if (updatedDetail.success) {
            setSelectedBooking(transformToDetailData(updatedDetail.data));
          }
        }
        fetchBookings(); // Refresh list
      } else {
        toast.error("Gagal membatalkan penghuni", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  // Stats Logic (based on loaded bookings)
  const stats = useMemo(() => {
    return {
      total: total, // Use API total
      pending: bookings.filter((b) => b.status === "PENDING").length,
      approved: bookings.filter((b) => b.status === "APPROVED").length,
      rejected: bookings.filter((b) => b.status === "REJECTED").length,
    };
  }, [bookings, total]);

  const activeFiltersCount = [
    statusFilter !== "all",
    searchQuery !== "",
    dateRange?.from !== undefined,
  ].filter(Boolean).length;

  return (
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Muat Ulang
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Permintaan
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Request</p>
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
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode booking, nama, catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                <DatePickerWithRange
                  date={dateRange}
                  setDate={setDateRange}
                  className="w-auto h-10"
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="APPROVED">Disetujui</SelectItem>
                    <SelectItem value="REJECTED">Ditolak</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFilters}
                    className="px-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
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
            <div className="">
              {isLoading && bookings.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Memuat data...
                  </span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Belum ada booking</p>
                  <p className="text-sm">
                    Anda belum membuat permintaan booking apapun.
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={getColumns({ onView: handleView })}
                  data={bookings}
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Dialogs */}
      <MyBookingDetailDialog
        booking={isDetailOpen ? selectedBooking : null}
        onClose={() => setIsDetailOpen(false)}
        onCancelRequest={handleCancelRequest}
        onCancelOccupant={handleCancelOccupant}
      />

      <BookingRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

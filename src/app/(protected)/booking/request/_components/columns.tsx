"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BookingRequest } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ColumnsProps {
  onView: (booking: BookingRequest) => void;
  onApprove: (booking: BookingRequest) => void;
  onReject: (booking: BookingRequest) => void;
}

export const getColumns = ({
  onView,
  onApprove,
  onReject,
}: ColumnsProps): ColumnDef<BookingRequest>[] => [
  {
    id: "no",
    header: () => <div className="text-center font-semibold">NO</div>,
    cell: ({ row, table }) => {
      // Get the paginated rows (current page only)
      const paginatedRows = table.getPaginationRowModel().rows;

      // Find index in current page
      const indexInPage = paginatedRows.findIndex((r) => r.id === row.id);

      // Get pagination state
      const { pageIndex, pageSize } = table.getState().pagination;

      // Calculate number: (pageIndex * pageSize) + indexInCurrentPage + 1
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
    header: "Kode",
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.original.bookingCode}
      </div>
    ),
  },
  {
    accessorKey: "requester",
    header: "Pemohon",
    cell: ({ row }) => {
      const { requester, bookingType, guestInfo } = row.original;
      const typeLabel =
        bookingType === "employee"
          ? "Karyawan"
          : bookingType === "guest"
          ? "Tamu"
          : "Kontraktor";

      return (
        <div className="flex flex-col gap-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{requester.name}</span>
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              {typeLabel}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{requester.nik}</span>
          {bookingType !== "employee" && guestInfo && (
            <span className="text-xs text-muted-foreground">
              Pendamping: {guestInfo.name}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "room",
    header: "Ruangan",
    cell: ({ row }) => (
      <div className="flex flex-col min-w-[140px]">
        <span className="font-medium text-sm">{row.original.building}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.room}
          {row.original.bedCode && ` - ${row.original.bedCode}`}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "checkInDate",
    header: "Periode",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs min-w-[120px]">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">In:</span>
          <span className="font-medium">
            {format(row.original.checkInDate, "dd MMM yy", { locale: id })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Out:</span>
          <span className="font-medium">
            {format(row.original.checkOutDate, "dd MMM yy", { locale: id })}
          </span>
        </div>
        <span className="text-muted-foreground mt-0.5">
          {row.original.duration} hari
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusConfig = {
        request: {
          label: "Menunggu",
          className: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: Clock,
        },
        approved: {
          label: "Disetujui",
          className: "bg-blue-100 text-blue-800 border-blue-300",
          icon: CheckCircle,
        },
        checkin: {
          label: "Check-In",
          className: "bg-green-100 text-green-800 border-green-300",
          icon: CheckCircle,
        },
        checkout: {
          label: "Check-Out",
          className: "bg-gray-100 text-gray-800 border-gray-300",
          icon: CheckCircle,
        },
        rejected: {
          label: "Ditolak",
          className: "bg-red-100 text-red-800 border-red-300",
          icon: XCircle,
        },
        cancelled: {
          label: "Dibatalkan",
          className: "bg-gray-100 text-gray-800 border-gray-300",
          icon: XCircle,
        },
      };

      const config = statusConfig[status];
      const Icon = config.icon;

      return (
        <Badge
          variant="outline"
          className={cn("gap-1 text-xs", config.className)}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const booking = row.original;
      const canApprove = booking.status === "request";
      const canReject = booking.status === "request";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(booking)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canApprove && (
              <DropdownMenuItem onClick={() => onApprove(booking)}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Setujui
              </DropdownMenuItem>
            )}
            {canReject && (
              <DropdownMenuItem
                onClick={() => onReject(booking)}
                className="text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

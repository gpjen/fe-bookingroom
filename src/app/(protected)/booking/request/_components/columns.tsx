// src/app/(protected)/booking/request/_components/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { BookingTableItem, BOOKING_STATUS_CONFIG } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Re-export for convenience
export type { BookingTableItem };

interface ColumnsProps {
  onView: (booking: BookingTableItem) => void;
}

export const getColumns = ({
  onView,
}: ColumnsProps): ColumnDef<BookingTableItem>[] => [
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
      <span className="font-mono text-sm font-medium">
        {row.original.bookingCode}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = BOOKING_STATUS_CONFIG[status];

      const StatusIcon =
        status === "PENDING"
          ? Clock
          : status === "APPROVED"
          ? CheckCircle
          : XCircle;

      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 text-xs font-medium flex items-center w-fit",
            config.className
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "requesterName",
    header: "Pemohon",
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{booking.requesterName}</span>
          <span className="text-xs text-muted-foreground">
            {booking.requesterCompany}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "occupantCount",
    header: () => <div className="text-center">Penghuni</div>,
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex items-center justify-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{booking.occupantCount}</span>
          {booking.hasGuest && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              Tamu
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "checkInDate",
    header: "Check-in",
    cell: ({ row }) => {
      const booking = row.original;

      if (!booking.checkInDate || !booking.checkOutDate) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }

      const nights = Math.ceil(
        (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return (
        <div className="flex flex-col">
          <span className="text-sm">{formatDate(booking.checkInDate)}</span>
          <span className="text-xs text-muted-foreground">{nights} malam</span>
        </div>
      );
    },
  },
  {
    accessorKey: "purpose",
    header: "Tujuan",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className="text-sm line-clamp-1 max-w-[150px] cursor-help">
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
    header: () => <div className="text-center">Aksi</div>,
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
    enableSorting: false,
    enableHiding: false,
  },
];

// src/app/(protected)/booking/request/_components/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// Table item type that matches the transformed API data
export interface BookingTableItem {
  id: string;
  bookingCode: string;
  requesterName: string;
  requesterCompany: string;
  status: "request" | "approved" | "rejected" | "cancelled";
  checkInDate: Date;
  checkOutDate: Date;
  occupantCount: number;
  purpose: string;
  areaName: string;
  hasGuest: boolean;
  createdAt: Date;
}

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
      const statusConfig = {
        request: {
          label: "Menunggu",
          className:
            "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: Clock,
        },
        approved: {
          label: "Disetujui",
          className:
            "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
          icon: CheckCircle,
        },
        rejected: {
          label: "Ditolak",
          className:
            "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400",
          icon: XCircle,
        },
        cancelled: {
          label: "Dibatalkan",
          className:
            "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
          icon: XCircle,
        },
      };

      const config = statusConfig[status];
      const Icon = config.icon;

      return (
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
      );
    },
  },
  {
    accessorKey: "requesterName",
    header: "Pemohon",
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex flex-col space-y-0.5">
          <span className="font-semibold text-sm">{booking.requesterName}</span>
          <span className="text-xs text-muted-foreground">
            {booking.requesterCompany}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "occupantCount",
    header: "Penghuni",
    cell: ({ row }) => {
      const booking = row.original;
      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {booking.occupantCount} Orang
            </span>
            {booking.hasGuest && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Ada tamu
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "areaName",
    header: "Area",
    cell: ({ row }) => {
      return (
        <span className="font-medium text-sm">{row.original.areaName}</span>
      );
    },
  },
  {
    accessorKey: "checkInDate",
    header: "Check-in",
    cell: ({ row }) => {
      const booking = row.original;
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
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px]">
          <span className="text-sm font-medium truncate block">
            {row.original.purpose}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tgl Pengajuan",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original;

      return (
        <div className="text-right">
          <Button
            variant="ghost"
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

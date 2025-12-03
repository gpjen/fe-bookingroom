// src/app/(protected)/booking/request/_components/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BookingRequest } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { BUILDINGS } from "./mock-data";
import { stat } from "fs";

interface ColumnsProps {
  onView: (booking: BookingRequest) => void;
}

export const getColumns = ({
  onView,
}: ColumnsProps): ColumnDef<BookingRequest>[] => [
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
        expired: {
          label: "Kadaluarsa",
          className:
            "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
          icon: Clock,
        },
      };

      const expiredDate = row.original.expiresAt;

      const config = statusConfig[status];
      const Icon = config.icon;

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
    accessorKey: "requester",
    header: "Pemohon",
    cell: ({ row }) => {
      const requester = row.original.requester;
      return (
        <div className="flex flex-col space-y-0.5">
          <span className="font-semibold text-sm">{requester.name}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {requester.nik}
          </span>
          <span className="text-xs text-muted-foreground">
            {requester.company}
          </span>
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
      const types = occupants.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summary = Object.entries(types)
        .map(([type, count]) => {
          const label =
            type === "employee"
              ? "Karyawan"
              : type === "guest"
              ? "Tamu"
              : "Lainnya";
          return `${count} ${label}`;
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
    header: "Lokasi Diminta",
    cell: ({ row }) => {
      const booking = row.original;
      const buildingName =
        BUILDINGS.find((b) => b.id === booking.buildingId)?.name ||
        "Tidak ditentukan";
      const areaName =
        BUILDINGS.find((b) => b.areaId === booking.areaId)?.area ||
        booking.areaId;

      return (
        <div className="flex flex-col space-y-0.5">
          <span className="font-medium text-sm">{buildingName}</span>
          <span className="text-xs text-muted-foreground">{areaName}</span>
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
          <span className="text-sm font-medium truncate">
            {booking.purpose}
          </span>
          {booking.notes && (
            <span className="text-xs text-muted-foreground truncate italic">
              "{booking.notes}"
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "requestedAt",
    header: "Tanggal Request",
    cell: ({ row }) => {
      return (
        <div className="text-sm">{formatDate(row.original.requestedAt)}</div>
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

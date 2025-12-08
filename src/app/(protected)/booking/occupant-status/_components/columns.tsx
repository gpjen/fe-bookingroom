"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  LogIn, 
  LogOut,
  Building,
  Bed,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { OccupantWithBooking } from "./mock-data";
import type { OccupantStatus } from "../../request/_components/types";

interface GetColumnsProps {
  onView: (occupant: OccupantWithBooking) => void;
  onCheckIn: (occupant: OccupantWithBooking) => void;
  onCheckOut: (occupant: OccupantWithBooking) => void;
}

const getStatusConfig = (status: OccupantStatus) => {
  const configs: Record<OccupantStatus, { label: string; className: string }> = {
    scheduled: {
      label: "Terjadwal",
      className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
    },
    checked_in: {
      label: "Check-In",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    checked_out: {
      label: "Check-Out",
      className: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400",
    },
    cancelled: {
      label: "Dibatalkan",
      className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };
  return configs[status];
};

export function getColumns({ onView, onCheckIn, onCheckOut }: GetColumnsProps): ColumnDef<OccupantWithBooking>[] {
  return [
    {
      accessorKey: "bookingCode",
      header: "Kode Booking",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("bookingCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Penghuni",
      cell: ({ row }) => {
        const occupant = row.original;
        return (
          <div>
            <p className="font-medium text-sm">{occupant.name}</p>
            <p className="text-xs text-muted-foreground">{occupant.identifier}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant="outline" className="text-xs">
            {type === "employee" ? "Karyawan" : "Tamu"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as OccupantStatus;
        const config = getStatusConfig(status);
        return (
          <Badge variant="outline" className={cn("text-xs", config.className)}>
            {config.label}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "buildingName",
      header: "Lokasi",
      cell: ({ row }) => {
        const occupant = row.original;
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span>{occupant.buildingName}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Bed className="h-3 w-3" />
              <span>R.{occupant.roomCode} / Bed {occupant.bedCode}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "inDate",
      header: "Check-In",
      cell: ({ row }) => {
        const occupant = row.original;
        const inDate = new Date(occupant.inDate);
        return (
          <div className="text-xs">
            <p className="font-medium">{format(inDate, "dd MMM yyyy", { locale: id })}</p>
            {occupant.actualCheckInAt && (
              <p className="text-emerald-600 dark:text-emerald-400">
                Aktual: {format(new Date(occupant.actualCheckInAt), "dd/MM HH:mm")}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "outDate",
      header: "Check-Out",
      cell: ({ row }) => {
        const occupant = row.original;
        const outDate = occupant.outDate ? new Date(occupant.outDate) : null;
        return (
          <div className="text-xs">
            <p className="font-medium">
              {outDate ? format(outDate, "dd MMM yyyy", { locale: id }) : "-"}
            </p>
            {occupant.actualCheckOutAt && (
              <p className="text-slate-600 dark:text-slate-400">
                Aktual: {format(new Date(occupant.actualCheckOutAt), "dd/MM HH:mm")}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Durasi",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("duration")} Hari</span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const occupant = row.original;
        const canCheckIn = occupant.status === "scheduled";
        const canCheckOut = occupant.status === "checked_in";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(occupant)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canCheckIn && (
                <DropdownMenuItem onClick={() => onCheckIn(occupant)}>
                  <LogIn className="mr-2 h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Check-In</span>
                </DropdownMenuItem>
              )}
              {canCheckOut && (
                <DropdownMenuItem onClick={() => onCheckOut(occupant)}>
                  <LogOut className="mr-2 h-4 w-4 text-orange-600" />
                  <span className="text-orange-600">Check-Out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

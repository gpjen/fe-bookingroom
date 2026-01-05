"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreHorizontal,
  LogIn,
  LogOut,
  ArrowRightLeft,
  User,
  Briefcase,
} from "lucide-react";
import {
  OccupantListItem,
  OccupancyStatus,
  OccupantType,
  Gender,
} from "../_actions/occupants.types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// ========================================
// STATUS CONFIG
// ========================================

const statusConfig: Record<
  OccupancyStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  PENDING: {
    label: "Menunggu",
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  },
  RESERVED: {
    label: "Dipesan",
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  },
  CHECKED_IN: {
    label: "Check-In",
    variant: "default",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    variant: "outline",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200",
  },
  CANCELLED: {
    label: "Dibatalkan",
    variant: "destructive",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
  },
  NO_SHOW: {
    label: "Tidak Hadir",
    variant: "destructive",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  },
};

const typeConfig: Record<
  OccupantType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  EMPLOYEE: {
    label: "Karyawan",
    icon: Briefcase,
    className: "text-blue-600 dark:text-blue-400",
  },
  GUEST: {
    label: "Tamu",
    icon: User,
    className: "text-purple-600 dark:text-purple-400",
  },
};

const genderConfig: Record<Gender, { label: string; className: string }> = {
  MALE: { label: "L", className: "text-blue-600" },
  FEMALE: { label: "P", className: "text-pink-600" },
};

// ========================================
// COLUMN ACTIONS PROPS
// ========================================

export interface ColumnActionsProps {
  onView: (occupant: OccupantListItem) => void;
  onCheckIn?: (occupant: OccupantListItem) => void;
  onCheckOut?: (occupant: OccupantListItem) => void;
  onTransfer?: (occupant: OccupantListItem) => void;
}

// ========================================
// COLUMNS DEFINITION
// ========================================

export function getColumns(
  actions: ColumnActionsProps
): ColumnDef<OccupantListItem>[] {
  return [
    // Occupant Info
    {
      accessorKey: "occupantName",
      header: "Penghuni",
      cell: ({ row }) => {
        const occ = row.original;
        const TypeIcon = typeConfig[occ.occupantType].icon;

        return (
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${typeConfig[occ.occupantType].className}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div
                className="font-medium truncate max-w-[180px]"
                title={occ.occupantName}
              >
                {occ.occupantName}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {occ.occupantNik && <span>{occ.occupantNik}</span>}
                <span
                  className={`font-semibold ${
                    genderConfig[occ.occupantGender].className
                  }`}
                >
                  ({genderConfig[occ.occupantGender].label})
                </span>
              </div>
              {occ.occupantCompany && (
                <div
                  className="text-xs text-muted-foreground truncate max-w-[180px]"
                  title={occ.occupantCompany}
                >
                  {occ.occupantCompany}
                </div>
              )}
            </div>
          </div>
        );
      },
    },

    // Status
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status];
        return (
          <Badge
            variant={config.variant}
            className={`text-xs ${config.className}`}
          >
            {config.label}
          </Badge>
        );
      },
    },

    // Location
    {
      id: "location",
      header: "Lokasi",
      cell: ({ row }) => {
        const occ = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium">{occ.buildingName}</div>
            <div className="text-xs text-muted-foreground">
              {occ.roomCode} • {occ.bedLabel}
            </div>
            <div className="text-xs text-muted-foreground">
              Lt. {occ.floorNumber}
            </div>
          </div>
        );
      },
    },

    // Stay Period
    {
      id: "period",
      header: "Periode Menginap",
      cell: ({ row }) => {
        const occ = row.original;
        const checkIn = new Date(occ.checkInDate);
        const checkOut = occ.checkOutDate ? new Date(occ.checkOutDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // For indefinite stays
        if (!checkOut) {
          return (
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <span>{format(checkIn, "dd MMM yyyy", { locale: id })}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground italic">~</span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                Belum ditentukan
              </div>
            </div>
          );
        }

        // Calculate days
        const diffTime = checkOut.getTime() - checkIn.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if overdue
        const isOverdue = occ.status === "CHECKED_IN" && today > checkOut;

        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <span>{format(checkIn, "dd MMM", { locale: id })}</span>
              <span className="text-muted-foreground">→</span>
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {format(checkOut, "dd MMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {diffDays} hari
              {isOverdue && (
                <span className="text-red-600 ml-1">(Overdue!)</span>
              )}
            </div>
          </div>
        );
      },
    },

    // Booking
    {
      accessorKey: "bookingCode",
      header: "Booking",
      cell: ({ row }) => {
        const code = row.original.bookingCode;
        return code ? (
          <Badge variant="outline" className="text-xs font-mono">
            {code}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground italic">Direct</span>
        );
      },
    },

    // Actions
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const occ = row.original;
        const canCheckIn =
          occ.status === "RESERVED" || occ.status === "PENDING";
        const canCheckOut = occ.status === "CHECKED_IN";
        const canTransfer = occ.status === "CHECKED_IN";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(occ)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>

              {(canCheckIn || canCheckOut || canTransfer) && (
                <DropdownMenuSeparator />
              )}

              {canCheckIn && actions.onCheckIn && (
                <DropdownMenuItem onClick={() => actions.onCheckIn!(occ)}>
                  <LogIn className="mr-2 h-4 w-4 text-emerald-600" />
                  Check-In
                </DropdownMenuItem>
              )}

              {canCheckOut && actions.onCheckOut && (
                <DropdownMenuItem onClick={() => actions.onCheckOut!(occ)}>
                  <LogOut className="mr-2 h-4 w-4 text-slate-600" />
                  Check-Out
                </DropdownMenuItem>
              )}

              {canTransfer && actions.onTransfer && (
                <DropdownMenuItem onClick={() => actions.onTransfer!(occ)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-600" />
                  Transfer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

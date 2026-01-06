"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, User, Briefcase, MapPin, Building2 } from "lucide-react";
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
    shortLabel: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    dotColor: string;
  }
> = {
  PENDING: {
    label: "Menunggu",
    shortLabel: "Pending",
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    dotColor: "bg-amber-500",
  },
  RESERVED: {
    label: "Dipesan",
    shortLabel: "Reserved",
    variant: "secondary",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    dotColor: "bg-blue-500",
  },
  CHECKED_IN: {
    label: "Check-In",
    shortLabel: "Active",
    variant: "default",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    shortLabel: "Done",
    variant: "outline",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200",
    dotColor: "bg-slate-400",
  },
  CANCELLED: {
    label: "Dibatalkan",
    shortLabel: "Cancelled",
    variant: "destructive",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    dotColor: "bg-red-500",
  },
  NO_SHOW: {
    label: "Tidak Hadir",
    shortLabel: "No Show",
    variant: "destructive",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
    dotColor: "bg-orange-500",
  },
};

const typeConfig: Record<
  OccupantType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    bgClassName: string;
  }
> = {
  EMPLOYEE: {
    label: "Karyawan",
    icon: Briefcase,
    className: "text-blue-600 dark:text-blue-400",
    bgClassName: "bg-blue-100 dark:bg-blue-900/30",
  },
  GUEST: {
    label: "Tamu",
    icon: User,
    className: "text-purple-600 dark:text-purple-400",
    bgClassName: "bg-purple-100 dark:bg-purple-900/30",
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
            <div
              className={`mt-0.5 p-1.5 rounded-lg ${
                typeConfig[occ.occupantType].bgClassName
              }`}
            >
              <TypeIcon
                className={`h-4 w-4 ${typeConfig[occ.occupantType].className}`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold truncate max-w-[160px]"
                  title={occ.occupantName}
                >
                  {occ.occupantName}
                </span>
                <span
                  className={`text-xs font-bold ${
                    genderConfig[occ.occupantGender].className
                  }`}
                >
                  ({genderConfig[occ.occupantGender].label})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {occ.occupantNik && (
                  <span className="font-mono">{occ.occupantNik}</span>
                )}
              </div>
              {occ.occupantCompany && (
                <div
                  className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5"
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

    // Status & Stays Info
    {
      id: "staysInfo",
      header: "Status",
      cell: ({ row }) => {
        const occ = row.original;
        const activeCount = occ.activeOccupancyCount || 0;
        const totalCount = occ.totalOccupancyCount || 0;
        const status = occ.status;

        // Has active stays (PENDING, RESERVED, CHECKED_IN)
        if (activeCount > 0 && status) {
          return (
            <div className="flex flex-col items-start gap-1.5">
              {/* Status badge */}
              <Badge
                variant={statusConfig[status].variant}
                className={`text-xs ${statusConfig[status].className}`}
              >
                {statusConfig[status].label}
              </Badge>

              {/* Multi-stay indicator */}
              {activeCount > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 cursor-help"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {activeCount} lokasi
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Menginap di {activeCount} lokasi berbeda
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* History count */}
              {totalCount > activeCount && (
                <span className="text-[10px] text-muted-foreground">
                  +{totalCount - activeCount} riwayat
                </span>
              )}
            </div>
          );
        }

        // No active stays - show last status or "Belum Ada"
        if (totalCount === 0) {
          // Never had any stay
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-muted-foreground italic">
                Belum ada hunian
              </span>
            </div>
          );
        }

        // Had stays before but none active now - show last status
        if (status) {
          const config = statusConfig[status];
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge
                variant={config.variant}
                className={`text-xs ${config.className}`}
              >
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {totalCount} riwayat
              </span>
            </div>
          );
        }

        // Fallback
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs text-muted-foreground">
              {totalCount} riwayat
            </span>
          </div>
        );
      },
    },

    // Location (Primary + indicator for more)
    {
      id: "location",
      header: "Lokasi Saat Ini",
      cell: ({ row }) => {
        const occ = row.original;
        const activeCount = occ.activeOccupancyCount || 0;

        if (!occ.buildingName || activeCount === 0) {
          return <div className="text-sm text-muted-foreground italic">-</div>;
        }

        return (
          <div className="text-sm">
            {/* Primary location */}
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div
                  className="font-medium truncate max-w-[150px]"
                  title={occ.buildingName}
                >
                  {occ.buildingName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {occ.roomCode} • {occ.bedLabel}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lt. {occ.floorNumber} • {occ.areaName}
                </div>
              </div>
            </div>

            {/* Indicator for additional locations */}
            {activeCount > 1 && (
              <div className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                +{activeCount - 1} lokasi lainnya
              </div>
            )}
          </div>
        );
      },
    },

    // Stay Period
    {
      id: "period",
      header: "Periode",
      cell: ({ row }) => {
        const occ = row.original;
        const activeCount = occ.activeOccupancyCount || 0;

        if (!occ.checkInDate || activeCount === 0) {
          return <div className="text-sm text-muted-foreground italic">-</div>;
        }

        const checkIn = new Date(occ.checkInDate);
        const checkOut = occ.checkOutDate ? new Date(occ.checkOutDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // For indefinite stays
        if (!checkOut) {
          return (
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {format(checkIn, "dd MMM", { locale: id })}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground italic text-xs">
                  Belum ditentukan
                </span>
              </div>
              {activeCount > 1 && (
                <div className="text-[10px] text-violet-600 mt-1">
                  *periode lokasi utama
                </div>
              )}
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
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {format(checkIn, "dd MMM", { locale: id })}
              </span>
              <span className="text-muted-foreground">→</span>
              <span
                className={
                  isOverdue ? "text-red-600 font-semibold" : "font-medium"
                }
              >
                {format(checkOut, "dd MMM", { locale: id })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>{diffDays} hari</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                  Overdue!
                </Badge>
              )}
            </div>
            {activeCount > 1 && (
              <div className="text-[10px] text-violet-600 mt-1">
                *periode lokasi utama
              </div>
            )}
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
          <Badge variant="outline" className="text-xs font-mono bg-background">
            {code}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-[10px] bg-slate-100 text-slate-600"
          >
            Direct
          </Badge>
        );
      },
    },

    // Actions
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const occ = row.original;

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => actions.onView(occ)}
          >
            <Eye className="h-3.5 w-3.5" />
            Detail
          </Button>
        );
      },
    },
  ];
}

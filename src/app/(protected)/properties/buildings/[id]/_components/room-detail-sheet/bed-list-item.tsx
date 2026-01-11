"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, UserPlus, LogIn, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BedWithOccupancy } from "../../_actions/occupancy.types";
import { bedStatusConfig } from "./config";

// ========================================
// TYPES
// ========================================

type BedDisplayStatus = keyof typeof bedStatusConfig;

export interface BedListItemProps {
  bed: BedWithOccupancy;
  onAssign: () => void;
  onCheckIn: () => void;
  onCheckout: () => void;
  onCancel: () => void;
  onTransfer: () => void;
  isLoading: boolean;
}

export function BedListItem({
  bed,
  onAssign,
  onCheckIn,
  onCheckout,
  onCancel,
  onTransfer,
  isLoading,
}: BedListItemProps) {
  const occupancy = bed.activeOccupancy;

  // Derive status from occupancy and pending requests for UI display
  let displayStatus: BedDisplayStatus = "AVAILABLE";
  if (occupancy) {
    if (occupancy.status === "CHECKED_IN") displayStatus = "OCCUPIED";
    else if (["RESERVED", "PENDING"].includes(occupancy.status))
      displayStatus = "RESERVED";
  }
  // NOTE: We don't change status to PENDING_REQUEST anymore to allow "Assign"
  // action even if there are future pending requests.

  const config = bedStatusConfig[displayStatus];
  const Icon = config.icon;

  // Format date - handle null for indefinite stays
  const formatDate = (date: Date | null) => {
    if (!date) return "~";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        config.bg,
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              "bg-white dark:bg-slate-800 border",
              config.border
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
          <div>
            <p className="font-medium text-sm">{bed.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {bed.code}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {bed.pendingRequests?.length > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-900/20"
            >
              {bed.pendingRequests.length} Request
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-[10px]", config.color)}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Occupant Info (ACTIVE) */}
      {occupancy && (
        <div className="mb-2 p-2 rounded bg-white/50 dark:bg-slate-800/50 border border-dashed">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {occupancy.occupant.name}
            </span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {occupancy.occupant.type === "EMPLOYEE" ? "Karyawan" : "Tamu"}
            </Badge>
          </div>
          {occupancy.occupant.company && (
            <p className="text-[10px] text-muted-foreground ml-5 truncate">
              {occupancy.occupant.company}
            </p>
          )}
          <div className="flex items-center gap-1.5 ml-5 mt-1">
            <div
              className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
              title="Active"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              {formatDate(occupancy.checkInDate)} -{" "}
              {occupancy.checkOutDate ? (
                formatDate(occupancy.checkOutDate)
              ) : (
                <span className="italic text-amber-600">Belum ditentukan</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* UPCOMING & PENDING Reservations Combined List */}
      {(bed.upcomingOccupancies?.length > 0 ||
        bed.pendingRequests?.length > 0) && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Agenda Bed
          </p>
          {[
            ...(bed.upcomingOccupancies || []).map((o) => ({
              id: o.id,
              name: o.occupant.name,
              type: o.occupant.type,
              checkIn: o.checkInDate,
              checkOut: o.checkOutDate,
              isConfirmed: true,
              bookingCode: undefined, // Fixes TS error: ensures shape matches
              meta: "Confirmed",
            })),
            ...(bed.pendingRequests || []).map((r) => ({
              id: r.id,
              name: r.name,
              type: r.type,
              checkIn: r.checkInDate,
              checkOut: r.checkOutDate,
              isConfirmed: false,
              bookingCode: r.bookingCode,
              meta: "Waiting Confirmation",
            })),
          ]
            .sort(
              (a, b) =>
                new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
            )
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-2 rounded border text-xs relative overflow-hidden",
                  item.isConfirmed
                    ? "bg-slate-50 dark:bg-slate-900 border-l-2 border-l-blue-400 border-slate-200"
                    : "bg-orange-50/50 dark:bg-orange-900/10 border-dashed border-orange-300"
                )}
              >
                <div className="flex justify-between items-start">
                  <div
                    className={cn(
                      "font-medium truncate pr-2",
                      item.isConfirmed
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-orange-700 dark:text-orange-300"
                    )}
                  >
                    {item.name}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] h-4 px-1 flex-shrink-0",
                      !item.isConfirmed && "border-orange-200 text-orange-700"
                    )}
                  >
                    {formatDate(item.checkIn)}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between items-end">
                  <div>
                    <span className="capitalize">
                      {item.type === "EMPLOYEE" ? "Karyawan" : "Tamu"}
                    </span>
                    <span className="mx-1">•</span>
                    Checkout:{" "}
                    {item.checkOut ? formatDate(item.checkOut) : "Open"}
                  </div>
                </div>
                {!item.isConfirmed && (
                  <div className="mt-1 text-[9px] text-orange-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Menunggu konfirmasi ({item.bookingCode})
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        {displayStatus === "AVAILABLE" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={onAssign}
            disabled={isLoading}
          >
            <UserPlus className="h-3 w-3" />
            Assign
          </Button>
        )}

        {displayStatus === "RESERVED" && occupancy && (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              onClick={onCheckIn}
              disabled={isLoading}
            >
              <LogIn className="h-3 w-3" />
              Check-in
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
              Batal
            </Button>
          </>
        )}

        {displayStatus === "OCCUPIED" && occupancy && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onCheckout}
              disabled={isLoading}
            >
              <LogOut className="h-3 w-3" />
              Checkout
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onTransfer}
              disabled={isLoading}
            >
              <LogIn className="h-3 w-3" />
              Transfer
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

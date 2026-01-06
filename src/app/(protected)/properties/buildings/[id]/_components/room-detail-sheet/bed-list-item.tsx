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

export interface BedListItemProps {
  bed: BedWithOccupancy;
  onAssign: () => void;
  onCheckIn: () => void;
  onCheckout: () => void;
  onCancel: () => void;
  onTransfer: () => void;
  isLoading: boolean;
}

// ========================================
// COMPONENT
// ========================================

export function BedListItem({
  bed,
  onAssign,
  onCheckIn,
  onCheckout,
  onCancel,
  onTransfer,
  isLoading,
}: BedListItemProps) {
  const config = bedStatusConfig[bed.status];
  const Icon = config.icon;
  const occupancy = bed.activeOccupancy;

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
        <Badge variant="outline" className={cn("text-[10px]", config.color)}>
          {config.label}
        </Badge>
      </div>

      {/* Occupant Info */}
      {occupancy && (
        <div className="mb-2 p-2 rounded bg-white/50 dark:bg-slate-800/50 border border-dashed">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {occupancy.occupant.name}
            </span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {occupancy.occupant.type === "EMPLOYEE" ? "Karyawan" : "Tamu"}
            </Badge>
          </div>
          {occupancy.occupant.company && (
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
              {occupancy.occupant.company}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 ml-5">
            {formatDate(occupancy.checkInDate)} -{" "}
            {occupancy.checkOutDate ? (
              formatDate(occupancy.checkOutDate)
            ) : (
              <span className="italic">Belum ditentukan</span>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        {bed.status === "AVAILABLE" && (
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

        {bed.status === "RESERVED" && occupancy && (
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

        {bed.status === "OCCUPIED" && occupancy && (
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

        {(bed.status === "MAINTENANCE" || bed.status === "BLOCKED") && (
          <p className="text-xs text-muted-foreground italic">
            Tidak dapat digunakan
          </p>
        )}
      </div>
    </div>
  );
}

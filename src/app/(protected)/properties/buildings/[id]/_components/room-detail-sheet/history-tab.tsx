"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RoomData } from "../../_actions/building-detail.schema";
import {
  OccupancyLogData,
  OccupancyLogAction,
} from "../../_actions/occupancy.types";
import { getRoomHistory } from "../../_actions/occupancy.actions";

// ========================================
// ACTION CONFIG
// ========================================

const actionConfig: Record<
  OccupancyLogAction,
  { label: string; icon: string; color: string; bg: string }
> = {
  CREATED: {
    label: "Penempatan",
    icon: "📝",
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  CHECKED_IN: {
    label: "Check-In",
    icon: "✅",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  DATE_CHANGED: {
    label: "Perubahan Tanggal",
    icon: "📅",
    color: "text-yellow-600",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  TRANSFERRED: {
    label: "Transfer",
    icon: "🔄",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  EARLY_CHECKOUT: {
    label: "Checkout Awal",
    icon: "⚡",
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    icon: "🚪",
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
  CANCELLED: {
    label: "Dibatalkan",
    icon: "❌",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  STATUS_CHANGED: {
    label: "Status Berubah",
    icon: "🔧",
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
};

// ========================================
// TYPES
// ========================================

export interface HistoryTabProps {
  room: RoomData;
}

// ========================================
// COMPONENT
// ========================================

export function HistoryTab({ room }: HistoryTabProps) {
  const [logs, setLogs] = useState<OccupancyLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 15;

  // Load history
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      const result = await getRoomHistory(room.id, { limit, offset });
      if (result.success) {
        if (offset === 0) {
          setLogs(result.data.logs);
        } else {
          setLogs((prev) => [...prev, ...result.data.logs]);
        }
        setTotal(result.data.total);
      } else {
        toast.error(result.error);
      }
      setIsLoading(false);
    }
    loadHistory();
  }, [room.id, offset]);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get action description
  const getActionDescription = (log: OccupancyLogData): string => {
    const name = log.occupancy.occupant.name;
    const currentBed = log.occupancy.bed;
    const currentLocation = `${currentBed.label} (${currentBed.room.name}, ${currentBed.room.building.name})`;

    switch (log.action) {
      case "CREATED":
        return `${name} ditempatkan di ${currentLocation}`;
      case "CHECKED_IN":
        return `${name} check-in di ${currentLocation}`;
      case "CHECKED_OUT":
      case "EARLY_CHECKOUT":
        return `${name} check-out dari ${currentLocation}`;
      case "TRANSFERRED": {
        const from = log.fromBedInfo
          ? `${log.fromBedInfo.label} (${log.fromBedInfo.roomName}, ${log.fromBedInfo.buildingName})`
          : "?";
        const to = log.toBedInfo
          ? `${log.toBedInfo.label} (${log.toBedInfo.roomName}, ${log.toBedInfo.buildingName})`
          : "?";
        return `${name} dipindahkan dari ${from} ke ${to}`;
      }
      case "CANCELLED":
        return `Reservasi ${name} dibatalkan`;
      case "DATE_CHANGED":
        return `Tanggal ${name} diubah`;
      default:
        return `Aktivitas pada ${currentLocation}`;
    }
  };

  // Empty state
  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-3">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-medium mb-1">Belum Ada Riwayat</h4>
        <p className="text-sm text-muted-foreground max-w-xs">
          Riwayat aktivitas akan muncul ketika ada penghuni yang check-in,
          check-out, atau transfer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Riwayat Aktivitas</h4>
          <p className="text-xs text-muted-foreground">
            {total} aktivitas tercatat
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Log Items */}
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = actionConfig[log.action];
            return (
              <div key={log.id} className="relative pl-10">
                {/* Dot */}
                <div
                  className={cn(
                    "absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    config.bg
                  )}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "p-3 rounded-lg border bg-card",
                    index === 0 && "ring-2 ring-primary/20"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5", config.color)}
                      >
                        {config.label}
                      </Badge>
                      {log.occupancy.bookingId && log.occupancy.booking && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 font-mono"
                        >
                          #{log.occupancy.booking.code}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.performedAt)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm font-medium">
                    {getActionDescription(log)}
                  </p>

                  {/* Details */}
                  <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                    <p>Oleh: {log.performedByName}</p>
                    {log.reason && <p>Alasan: {log.reason}</p>}
                    {log.notes && <p>Catatan: {log.notes}</p>}

                    {/* Date changes */}
                    {log.action === "DATE_CHANGED" && (
                      <>
                        {log.previousCheckInDate && log.newCheckInDate && (
                          <p>
                            Check-in: {formatDate(log.previousCheckInDate)} →{" "}
                            {formatDate(log.newCheckInDate)}
                          </p>
                        )}
                        {log.previousCheckOutDate && log.newCheckOutDate && (
                          <p>
                            Check-out: {formatDate(log.previousCheckOutDate)} →{" "}
                            {formatDate(log.newCheckOutDate)}
                          </p>
                        )}
                      </>
                    )}

                    {/* Occupant type badge */}
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {log.occupancy.occupant.type === "EMPLOYEE"
                          ? "Karyawan"
                          : "Tamu"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {logs.length < total && (
          <div className="pt-4 pl-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Muat lebih banyak ({logs.length}/{total})
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && logs.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

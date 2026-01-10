"use client";

import { useMemo } from "react";
import { format, eachDayOfInterval, startOfDay, isBefore } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  BedDouble,
  Mars,
  Venus,
  Briefcase,
  User,
  Users,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomAvailability } from "./room-search-api";
import type { SelectedBed } from "./booking-request-types";

interface RoomAvailabilityTimelineProps {
  rooms: RoomAvailability[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRoomDetail?: (room: RoomAvailability) => void;
  onRoomSelect?: (room: RoomAvailability) => void;
  selectedBeds?: SelectedBed[];
  maxBedSelection?: number;
  selectionMode?: boolean;
}

export function RoomAvailabilityTimeline({
  rooms,
  startDate,
  endDate,
  onRoomSelect,
  selectedBeds = [],
  maxBedSelection = 0,
  selectionMode = false,
}: RoomAvailabilityTimelineProps) {
  void maxBedSelection;

  const getSelectedBedsInRoom = (roomId: string) => {
    return selectedBeds.filter((b) => b.roomId === roomId);
  };

  const days = useMemo(() => {
    if (!startDate || !endDate) return [];
    try {
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch {
      return [];
    }
  }, [startDate, endDate]);

  // Calculate per-day status for each bed in a room
  const getDayStatus = (room: RoomAvailability, date: Date) => {
    const dayStart = startOfDay(date);

    const bedStatuses = room.beds.map((bed) => {
      let status:
        | "available"
        | "occupied"
        | "reserved"
        | "pending"
        | "maintenance" = "available";

      // 1. Check confirmed occupancies (CHECKED_IN, RESERVED)
      for (const occ of bed.occupancies) {
        const occStart = startOfDay(occ.checkInDate);
        const occEnd = occ.checkOutDate ? startOfDay(occ.checkOutDate) : null;

        // Check if this date overlaps with the occupancy
        let isOccupied = false;
        if (occEnd === null) {
          // Indefinite stay: occupied from checkIn onwards
          isOccupied = !isBefore(dayStart, occStart);
        } else {
          // Fixed period: checkIn <= date < checkOut
          isOccupied =
            !isBefore(dayStart, occStart) && isBefore(dayStart, occEnd);
        }

        if (isOccupied) {
          // Determine if it's occupied (checked-in) or reserved
          if (occ.status === "CHECKED_IN") {
            status = "occupied";
          } else if (occ.status === "RESERVED" || occ.status === "PENDING") {
            status = "reserved";
          }
          break; // One occupancy is enough to block the day
        }
      }

      // 2. If not occupied/reserved, check pending booking requests
      if (status === "available") {
        for (const pr of bed.pendingRequests) {
          const prStart = startOfDay(pr.checkInDate);
          const prEnd = startOfDay(pr.checkOutDate);

          // Check if this date is within the pending request period
          // checkIn <= date < checkOut
          const isPending =
            !isBefore(dayStart, prStart) && isBefore(dayStart, prEnd);

          if (isPending) {
            status = "pending"; // Pending approval
            break;
          }
        }
      }

      return { ...bed, currentStatus: status };
    });

    const total = bedStatuses.length;
    // Count available beds (not occupied, reserved, pending, or maintenance)
    const available = bedStatuses.filter(
      (b) => b.currentStatus === "available"
    ).length;

    return {
      available,
      total,
      beds: bedStatuses,
    };
  };

  if (!startDate || !endDate || days.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/10">
        Pilih rentang tanggal untuk melihat timeline ketersediaan
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Legend */}
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          {/* Gradient Scale */}
          <span className="text-muted-foreground mr-1">Ketersediaan:</span>
          <div
            className="flex items-center gap-0.5"
            title="Gradasi warna berdasarkan ketersediaan"
          >
            <span
              className="w-4 h-4 rounded-sm bg-emerald-200 dark:bg-emerald-800"
              title="Semua kosong"
            />
            <span className="w-4 h-4 rounded-sm bg-emerald-100 dark:bg-emerald-900" />
            <span className="w-4 h-4 rounded-sm bg-lime-100 dark:bg-lime-900" />
            <span className="w-4 h-4 rounded-sm bg-amber-200 dark:bg-amber-800" />
            <span className="w-4 h-4 rounded-sm bg-orange-200 dark:bg-orange-800" />
            <span
              className="w-4 h-4 rounded-sm bg-rose-300 dark:bg-rose-700"
              title="Penuh"
            />
          </div>
          <span className="text-muted-foreground ml-1">Penuh</span>

          {/* Separator */}
          <span className="mx-2 text-border">|</span>

          {/* Bed Status */}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" />
            Menunggu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-400" />
            Maintenance
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {rooms.length} kamar
        </Badge>
      </div>

      {/* Timeline Container */}
      <div className="overflow-auto isolate">
        <div className="min-w-max relative">
          {/* Header Row */}
          <div className="flex sticky top-0 z-10 bg-background border-b">
            {/* Sticky Corner - Room Header */}
            <div className="w-[160px] md:w-[200px] flex-shrink-0 sticky left-0 z-10 bg-muted/50 backdrop-blur-sm px-3 py-2 border-r flex items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kamar
              </span>
            </div>

            {/* Date Columns */}
            {days.map((day) => (
              <div
                key={day.toString()}
                className="w-12 md:w-14 flex-shrink-0 py-2 text-center border-r bg-muted/30 last:border-r-0"
              >
                <div className="text-[10px] font-medium text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: localeId })}
                </div>
                <div className="text-sm font-bold">{format(day, "d")}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(day, "MMM", { locale: localeId })}
                </div>
              </div>
            ))}
          </div>

          {/* Room Rows */}
          <TooltipProvider delayDuration={100}>
            {rooms.map((room, index) => {
              const selectedInRoom = getSelectedBedsInRoom(room.id);
              const isSelected = selectedInRoom.length > 0;

              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex border-b last:border-b-0 transition-colors",
                    index % 2 === 0
                      ? "bg-white dark:bg-zinc-950"
                      : "bg-zinc-50/50 dark:bg-zinc-900/50",
                    isSelected && "bg-emerald-50/50 dark:bg-emerald-950/20"
                  )}
                >
                  {/* Room Info - Sticky Left */}
                  <div
                    className={cn(
                      "w-[160px] md:w-[200px] flex-shrink-0 sticky left-0 px-3 py-2 border-r transition-colors",
                      index % 2 === 0
                        ? "bg-white dark:bg-zinc-950"
                        : "bg-zinc-50/50 dark:bg-zinc-900/50",
                      isSelected && "bg-emerald-50/50 dark:bg-emerald-950/20",
                      selectionMode && "cursor-pointer hover:bg-muted/30"
                    )}
                    onClick={() => selectionMode && onRoomSelect?.(room)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Room Code & Type */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{room.code}</span>
                          <Badge
                            variant={
                              room.roomType.code.toLowerCase().includes("vvip")
                                ? "default"
                                : room.roomType.code
                                    .toLowerCase()
                                    .includes("vip")
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[9px] h-4 px-1.5 font-normal"
                          >
                            {room.roomType.name}
                          </Badge>
                        </div>

                        {/* Building */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {room.buildingName}
                          </span>
                        </div>

                        {/* Gender & Allocation */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {room.gender === "male" ? (
                              <Mars className="h-3.5 w-3.5 text-blue-500" />
                            ) : room.gender === "female" ? (
                              <Venus className="h-3.5 w-3.5 text-pink-500" />
                            ) : room.gender === "flexible" ? (
                              <Users className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Users className="h-3.5 w-3.5 text-purple-500" />
                            )}
                            {room.allocation === "employee" ? (
                              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {room.beds.length} bed
                          </span>
                        </div>
                      </div>

                      {/* Selection Button */}
                      {selectionMode && (
                        <div className="shrink-0">
                          {isSelected ? (
                            <Badge className="bg-emerald-600 text-white text-xs h-6 px-2 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {selectedInRoom.length}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRoomSelect?.(room);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Pilih
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Cells */}
                  {days.map((day) => {
                    const status = getDayStatus(room, day);
                    // Room-level maintenance check
                    const isRoomMaintenance = room.status === "maintenance";

                    // Calculate occupancy ratio for gradient coloring
                    const occupiedCount = status.total - status.available;
                    const occupancyRatio =
                      status.total > 0 ? occupiedCount / status.total : 0;

                    // Gradient colors based on occupancy percentage
                    // 0% occupied = bright green
                    // 25% occupied = light green
                    // 50% occupied = yellow/amber
                    // 75% occupied = orange
                    // 100% occupied = red
                    let cellClass = "";
                    let textClass = "";

                    if (isRoomMaintenance) {
                      cellClass = "bg-gray-200 dark:bg-gray-800";
                      textClass = "text-gray-500";
                    } else if (occupancyRatio === 0) {
                      // Fully available (0% occupied) - bright green
                      cellClass = "bg-emerald-200 dark:bg-emerald-800/50";
                      textClass = "text-emerald-800 dark:text-emerald-300";
                    } else if (occupancyRatio <= 0.25) {
                      // Up to 25% occupied - light green
                      cellClass = "bg-emerald-100 dark:bg-emerald-900/40";
                      textClass = "text-emerald-700 dark:text-emerald-400";
                    } else if (occupancyRatio <= 0.5) {
                      // 26-50% occupied - lime/yellow-green
                      cellClass = "bg-lime-100 dark:bg-lime-900/40";
                      textClass = "text-lime-700 dark:text-lime-400";
                    } else if (occupancyRatio <= 0.75) {
                      // 51-75% occupied - amber/orange
                      cellClass = "bg-amber-200 dark:bg-amber-800/50";
                      textClass = "text-amber-800 dark:text-amber-300";
                    } else if (occupancyRatio < 1) {
                      // 76-99% occupied - orange-red
                      cellClass = "bg-orange-200 dark:bg-orange-800/50";
                      textClass = "text-orange-800 dark:text-orange-300";
                    } else {
                      // Fully occupied (100%) - red
                      cellClass = "bg-rose-300 dark:bg-rose-700/60";
                      textClass = "text-rose-900 dark:text-rose-200";
                    }

                    return (
                      <div
                        key={day.toString()}
                        className="w-12 md:w-14 flex-shrink-0 border-r last:border-r-0 p-0.5"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-full min-h-[52px] rounded flex items-center justify-center cursor-help transition-all hover:opacity-80",
                                cellClass
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs font-bold font-mono",
                                  textClass
                                )}
                              >
                                {isRoomMaintenance
                                  ? "MT"
                                  : `${status.available}/${status.total}`}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="center"
                            sideOffset={6}
                            className="p-0 border shadow-xl"
                          >
                            {/* Tooltip Header */}
                            <div className="bg-primary px-3 py-1.5 text-primary-foreground">
                              <p className="font-semibold text-xs flex items-center gap-2">
                                <BedDouble className="h-3.5 w-3.5" />
                                Kamar {room.code} •{" "}
                                {format(day, "EEE, d MMM", {
                                  locale: localeId,
                                })}
                              </p>
                            </div>

                            {/* Tooltip Body - Bed List */}
                            <div className="p-2 bg-popover min-w-[200px]">
                              <div className="space-y-1">
                                {status.beds.map((bed) => (
                                  <div
                                    key={bed.id}
                                    className={cn(
                                      "flex items-center justify-between text-sm px-2 py-1.5 rounded",
                                      bed.currentStatus === "available"
                                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                                        : bed.currentStatus === "occupied"
                                        ? "bg-rose-50 dark:bg-rose-950/30"
                                        : bed.currentStatus === "reserved"
                                        ? "bg-amber-50 dark:bg-amber-950/30"
                                        : bed.currentStatus === "pending"
                                        ? "bg-blue-50 dark:bg-blue-950/30"
                                        : "bg-gray-100 dark:bg-gray-800"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          bed.currentStatus === "available"
                                            ? "bg-emerald-500"
                                            : bed.currentStatus === "occupied"
                                            ? "bg-rose-500"
                                            : bed.currentStatus === "reserved"
                                            ? "bg-amber-500"
                                            : bed.currentStatus === "pending"
                                            ? "bg-blue-500"
                                            : "bg-gray-400"
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "font-semibold",
                                          bed.currentStatus === "available"
                                            ? "text-emerald-800 dark:text-emerald-300"
                                            : bed.currentStatus === "occupied"
                                            ? "text-rose-800 dark:text-rose-300"
                                            : bed.currentStatus === "reserved"
                                            ? "text-amber-800 dark:text-amber-300"
                                            : bed.currentStatus === "pending"
                                            ? "text-blue-800 dark:text-blue-300"
                                            : "text-gray-800 dark:text-gray-300"
                                        )}
                                      >
                                        Bed {bed.code}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-xs font-medium px-1.5 py-0.5 rounded",
                                        bed.currentStatus === "available"
                                          ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400"
                                          : bed.currentStatus === "occupied"
                                          ? "text-rose-700 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-400"
                                          : bed.currentStatus === "reserved"
                                          ? "text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400"
                                          : bed.currentStatus === "pending"
                                          ? "text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400"
                                          : "text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                      )}
                                    >
                                      {bed.currentStatus === "available" &&
                                        "Kosong"}
                                      {bed.currentStatus === "occupied" &&
                                        "Terisi"}
                                      {bed.currentStatus === "reserved" &&
                                        "Direservasi"}
                                      {bed.currentStatus === "pending" &&
                                        "Menunggu"}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Summary */}
                              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex justify-between">
                                <span>Total {status.total} bed</span>
                                <span className="font-semibold text-emerald-600">
                                  {status.available} tersedia
                                </span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

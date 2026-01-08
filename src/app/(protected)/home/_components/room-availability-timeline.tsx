"use client";

import { useMemo } from "react";
import {
  format,
  eachDayOfInterval,
  isWithinInterval,
  startOfDay,
  isBefore,
} from "date-fns";
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

  const getDayStatus = (room: RoomAvailability, date: Date) => {
    const dayStart = startOfDay(date);

    const bedStatuses = room.beds.map((bed) => {
      let status: "available" | "occupied" | "reserved" | "maintenance" =
        "available";

      if (bed.status === "maintenance") {
        status = "maintenance";
      } else if (bed.status === "occupied") {
        // Occupied: has CHECKED_IN occupancy
        // Check if the day is within the occupancy period
        if (bed.occupantCheckOut) {
          if (isBefore(dayStart, startOfDay(bed.occupantCheckOut))) {
            status = "occupied";
          }
        } else {
          // No checkout date = indefinite stay, always occupied from check-in date onwards
          if (
            bed.occupantCheckIn &&
            !isBefore(dayStart, startOfDay(bed.occupantCheckIn))
          ) {
            status = "occupied";
          }
        }
      } else if (bed.status === "reserved") {
        // Reserved: has PENDING/RESERVED occupancy OR has pending booking request
        if (bed.reservedFrom) {
          const rStart = startOfDay(bed.reservedFrom);
          if (bed.reservedTo) {
            const rEnd = startOfDay(bed.reservedTo);
            if (
              isWithinInterval(dayStart, { start: rStart, end: rEnd }) &&
              isBefore(dayStart, rEnd)
            ) {
              status = "reserved";
            }
          } else {
            // No end date = indefinite reservation, always reserved from start date onwards
            if (!isBefore(dayStart, rStart)) {
              status = "reserved";
            }
          }
        } else if (bed.hasPendingRequest) {
          // Has pending request without specific dates - treat as reserved for entire requested period
          status = "reserved";
        }
      } else if (bed.hasPendingRequest) {
        // Handle pending booking requests that aren't reflected in bed.status
        status = "reserved";
      }

      return { ...bed, currentStatus: status };
    });

    const total = bedStatuses.length;
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
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            Tersedia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            Sebagian
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            Penuh
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
                              room.type === "vvip"
                                ? "default"
                                : room.type === "vip"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[9px] h-4 px-1.5 font-normal uppercase"
                          >
                            {room.type}
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
                    const allMaintenance = status.beds.every(
                      (b) => b.currentStatus === "maintenance"
                    );

                    let cellClass = "bg-emerald-100 dark:bg-emerald-900/30";
                    let textClass = "text-emerald-700 dark:text-emerald-400";

                    if (allMaintenance) {
                      cellClass = "bg-gray-200 dark:bg-gray-800";
                      textClass = "text-gray-500";
                    } else if (status.available === 0) {
                      cellClass = "bg-rose-100 dark:bg-rose-900/30";
                      textClass = "text-rose-700 dark:text-rose-400";
                    } else if (status.available < status.total) {
                      cellClass = "bg-amber-100 dark:bg-amber-900/30";
                      textClass = "text-amber-700 dark:text-amber-400";
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
                                {allMaintenance
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
                                          : "text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                      )}
                                    >
                                      {bed.currentStatus === "available" &&
                                        "Kosong"}
                                      {bed.currentStatus === "occupied" &&
                                        "Terisi"}
                                      {bed.currentStatus === "reserved" &&
                                        "Booked"}
                                      {bed.currentStatus === "maintenance" &&
                                        "Maintenance"}
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

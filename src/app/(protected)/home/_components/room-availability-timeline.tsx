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
  Info,
  Mars,
  Venus,
  Briefcase,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomAvailability } from "./mock-data";

interface RoomAvailabilityTimelineProps {
  rooms: RoomAvailability[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRoomDetail?: (room: RoomAvailability) => void;
}

export function RoomAvailabilityTimeline({
  rooms,
  startDate,
  endDate,
  onRoomDetail,
}: RoomAvailabilityTimelineProps) {
  // Generate days array
  const days = useMemo(() => {
    if (!startDate || !endDate) return [];
    try {
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch (e) {
      return [];
    }
  }, [startDate, endDate]);

  const getDayStatus = (room: RoomAvailability, date: Date) => {
    const dayStart = startOfDay(date);

    // Map each bed to its status on this day
    const bedStatuses = room.beds.map((bed) => {
      let status: "available" | "occupied" | "reserved" | "maintenance" =
        "available";

      if (bed.status === "maintenance") {
        status = "maintenance";
      } else if (bed.status === "occupied" && bed.occupantCheckOut) {
        // Assume occupied until checkout day (exclusive or inclusive depending on business logic)
        // Usually checkout day is free for checkin. so if date < checkout, it's occupied.
        if (isBefore(dayStart, startOfDay(bed.occupantCheckOut))) {
          status = "occupied";
        }
      } else if (
        bed.status === "reserved" &&
        bed.reservedFrom &&
        bed.reservedTo
      ) {
        // Check overlap
        const rStart = startOfDay(bed.reservedFrom);
        const rEnd = startOfDay(bed.reservedTo);
        // Simple inclusive check for now
        if (
          isWithinInterval(dayStart, { start: rStart, end: rEnd }) &&
          isBefore(dayStart, rEnd)
        ) {
          status = "reserved";
        }
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
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm h-[700px] md:h-[1000px] flex flex-col">
      <div
        className="flex-1 overflow-auto relative scroll-smooth"
        style={{ maxHeight: "100%" }}
      >
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex sticky top-0 z-30 bg-background border-b shadow-sm">
            {/* Sticky Corner */}
            <div className="w-[130px] sm:w-[180px] md:w-[190px] sticky left-0 z-40 bg-muted/30 backdrop-blur-sm p-3 sm:p-4 border-r border-b flex items-center justify-between transition-all duration-300">
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Kamar
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal">
                Total: {rooms.length}
              </Badge>
            </div>

            {/* Date Columns */}
            {days.map((day) => (
              <div
                key={day.toString()}
                className="w-12 sm:w-16 md:w-20 flex-shrink-0 p-1 sm:p-2 text-center border-r bg-muted/10 last:border-r-0"
              >
                <div className="text-[10px] font-semibold text-muted-foreground uppercase truncate">
                  {format(day, "EEE", { locale: localeId })}
                </div>
                <div className="text-xs sm:text-sm font-bold">
                  {format(day, "d")}
                </div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">
                  {format(day, "MMM", { locale: localeId })}
                </div>
              </div>
            ))}
          </div>

          {/* Room Rows */}
          <TooltipProvider delayDuration={0}>
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className={cn(
                  "flex group hover:bg-muted/5 transition-colors border-b last:border-b-0",
                  index % 2 === 0
                    ? "bg-white dark:bg-zinc-950"
                    : "bg-zinc-50/50 dark:bg-zinc-900/50"
                )}
              >
                {/* Room Info - Sticky Left */}
                <div className="w-[130px] sm:w-[180px] md:w-[190px] sticky left-0 z-20 bg-background p-2 sm:p-4 border-r group-hover:bg-muted/5 transition-all duration-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                        {room.code}
                        <Badge
                          variant={
                            room.type === "vvip"
                              ? "default"
                              : room.type === "vip"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 font-normal truncate max-w-[50px] sm:max-w-none"
                        >
                          {room.type}
                        </Badge>
                        {onRoomDetail && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 text-muted-foreground hover:text-primary"
                            onClick={() => onRoomDetail(room)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {room.buildingName}
                      </div>
                    </div>
                  </div>
                  {/* Room Attributes */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 gap-1 font-normal text-[10px] bg-muted/50"
                    >
                      {room.gender === "male" ? (
                        <Mars className="h-3 w-3 text-blue-500" />
                      ) : room.gender === "female" ? (
                        <Venus className="h-3 w-3 text-pink-500" />
                      ) : (
                        <Users className="h-3 w-3 text-purple-500" />
                      )}
                      <span className="hidden sm:inline">
                        {room.gender === "male"
                          ? "Pria"
                          : room.gender === "female"
                          ? "Wanita"
                          : "Campur"}
                      </span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 gap-1 font-normal text-[10px] bg-muted/50"
                    >
                      {room.allocation === "employee" ? (
                        <Briefcase className="h-3 w-3 text-blue-600" />
                      ) : (
                        <User className="h-3 w-3 text-amber-600" />
                      )}
                      <span className="hidden sm:inline">
                        {room.allocation === "employee" ? "Karyawan" : "Tamu"}
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Timeline Cells */}
                {days.map((day) => {
                  const status = getDayStatus(room, day);
                  let bgClass =
                    "bg-emerald-100/40 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
                  let borderClass =
                    "border-emerald-200 dark:border-emerald-900/30";

                  // Override logic
                  if (status.available === 0) {
                    bgClass =
                      "bg-rose-100/40 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 text-rose-700 dark:text-rose-400";
                    borderClass = "border-rose-200 dark:border-rose-900/30";
                  } else if (status.available < status.total) {
                    bgClass =
                      "bg-amber-100/40 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400";
                    borderClass = "border-amber-200 dark:border-amber-900/30";
                  }

                  // Check maintenance
                  const allMaintenance = status.beds.every(
                    (b) => b.currentStatus === "maintenance"
                  );
                  if (allMaintenance) {
                    bgClass =
                      "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500";
                    borderClass = "border-gray-200 dark:border-gray-700";
                  }

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "w-12 sm:w-16 md:w-20 flex-shrink-0 border-r p-0.5 sm:p-1 flex flex-col justify-center",
                        index % 2 === 0
                          ? "bg-white dark:bg-zinc-950"
                          : "bg-zinc-50/50 dark:bg-zinc-900/50"
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-full h-full rounded-md border flex items-center justify-center cursor-help transition-all duration-200",
                              bgClass,
                              borderClass
                            )}
                          >
                            <span className="text-xs font-bold font-mono">
                              {allMaintenance
                                ? "MT"
                                : `${status.available}/${status.total}`}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="p-0 border-2 overflow-hidden shadow-xl"
                          align="center"
                        >
                          <div className="bg-primary px-3 py-2 text-primary-foreground">
                            <p className="font-semibold text-xs flex items-center gap-2">
                              <BedDouble className="h-3.5 w-3.5" />
                              Detail Bed •{" "}
                              {format(day, "d MMM", { locale: localeId })}
                            </p>
                          </div>
                          <div className="p-2 bg-background min-w-[200px]">
                            <div className="space-y-1">
                              {status.beds.map((bed) => (
                                <div
                                  key={bed.code}
                                  className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50"
                                >
                                  <div className="font-medium flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        bed.currentStatus === "available"
                                          ? "bg-emerald-500"
                                          : bed.currentStatus === "occupied"
                                          ? "bg-rose-500"
                                          : bed.currentStatus === "reserved"
                                          ? "bg-amber-500"
                                          : "bg-gray-500"
                                      )}
                                    />
                                    {bed.code}
                                  </div>
                                  <div className="text-right">
                                    {bed.currentStatus === "available" && (
                                      <span className="text-emerald-600 font-medium">
                                        Kosong
                                      </span>
                                    )}
                                    {bed.currentStatus === "occupied" && (
                                      <span className="text-rose-600 font-medium">
                                        Terisi
                                      </span>
                                    )}
                                    {bed.currentStatus === "reserved" && (
                                      <span className="text-amber-600 font-medium">
                                        Booked
                                      </span>
                                    )}
                                    {bed.currentStatus === "maintenance" && (
                                      <span className="text-gray-500 font-medium">
                                        Perbaikan
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Occupant Info Preview if occupied? Maybe too detailed for now */}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

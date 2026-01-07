"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Building2,
  BedDouble,
  Users,
  Calendar,
  Mars,
  Venus,
  Briefcase,
  User,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { RoomAvailability } from "./room-search-api";
import type { SelectedBed } from "./booking-request-types";
import {
  startOfDay,
  eachDayOfInterval,
  isBefore,
  isWithinInterval,
} from "date-fns";
import Image from "next/image";

interface RoomDetailDialogProps {
  room: RoomAvailability | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  endDate: Date;
  selectedBeds: SelectedBed[];
  onBedSelect: (bed: SelectedBed) => void;
  maxSelection: number;
  totalSelectedBeds?: number;
}

export function RoomDetailDialog({
  room,
  open,
  onOpenChange,
  startDate,
  endDate,
  selectedBeds,
  onBedSelect,
  maxSelection,
  totalSelectedBeds = 0,
}: RoomDetailDialogProps) {
  const duration = differenceInDays(endDate, startDate) + 1;

  // Calculate beds available for the ENTIRE date range
  const availableBedsForRange = useMemo(() => {
    if (!room) return [];

    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return room.beds.filter((bed) => {
      return days.every((day) => {
        const dayStart = startOfDay(day);

        if (bed.status === "maintenance") return false;

        if (bed.status === "occupied" && bed.occupantCheckOut) {
          if (isBefore(dayStart, startOfDay(bed.occupantCheckOut))) {
            return false;
          }
        }

        if (bed.status === "reserved" && bed.reservedFrom && bed.reservedTo) {
          const rStart = startOfDay(bed.reservedFrom);
          const rEnd = startOfDay(bed.reservedTo);
          if (
            isWithinInterval(dayStart, { start: rStart, end: rEnd }) &&
            isBefore(dayStart, rEnd)
          ) {
            return false;
          }
        }

        return true;
      });
    });
  }, [room, startDate, endDate]);

  const isBedSelected = (bedId: string) => {
    return selectedBeds.some((b) => b.bedId === bedId);
  };

  const isMaxReached = totalSelectedBeds >= maxSelection;

  const handleBedToggle = (bed: { id: string; code: string }) => {
    if (!room) return;

    const selectedBed: SelectedBed = {
      roomId: room.id,
      roomCode: room.code,
      bedId: bed.id,
      bedCode: bed.code,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      areaId: room.areaId,
      areaName: room.areaName,
      roomType: room.type,
      capacity: room.capacity,
      roomGender: room.gender,
      roomAllocation: room.allocation,
    };

    onBedSelect(selectedBed);
  };

  if (!room) return null;

  const selectedBedsInThisRoom = selectedBeds.filter(
    (b) => b.roomId === room.id
  ).length;

  const remaining = maxSelection - totalSelectedBeds;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                {room.code}
                <Badge
                  variant={
                    room.type === "vvip"
                      ? "default"
                      : room.type === "vip"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-sm"
                >
                  {room.type.toUpperCase()}
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {room.areaName}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {room.buildingName}
                </span>
                <span>Lantai {room.floor}</span>
              </DialogDescription>
            </div>
            {/* Selection Status */}
            <div
              className={cn(
                "text-center px-4 py-2 rounded-lg",
                isMaxReached && selectedBedsInThisRoom === 0
                  ? "bg-gray-100 dark:bg-gray-800"
                  : selectedBedsInThisRoom > 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              )}
            >
              <p
                className={cn(
                  "text-2xl font-bold",
                  isMaxReached && selectedBedsInThisRoom === 0
                    ? "text-gray-500"
                    : selectedBedsInThisRoom > 0
                    ? "text-emerald-600"
                    : "text-amber-600"
                )}
              >
                {selectedBedsInThisRoom}
              </p>
              <p className="text-xs text-muted-foreground">dipilih</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Room Images */}
          {room.images && room.images.length > 0 && (
            <div className="relative rounded-xl overflow-hidden bg-muted/20 border">
              <Carousel className="w-full">
                <CarouselContent>
                  {room.images.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <Image
                        src={img}
                        alt={`Room ${room.code} - Image ${idx + 1}`}
                        className="w-full aspect-video object-cover"
                        width={500}
                        height={500}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          )}

          {/* Room Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
              {room.gender === "male" ? (
                <Mars className="h-5 w-5 text-blue-500" />
              ) : room.gender === "female" ? (
                <Venus className="h-5 w-5 text-pink-500" />
              ) : room.gender === "flexible" ? (
                <Users className="h-5 w-5 text-emerald-500" />
              ) : (
                <Users className="h-5 w-5 text-purple-500" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-semibold text-sm">
                  {room.gender === "male"
                    ? "Pria"
                    : room.gender === "female"
                    ? "Wanita"
                    : room.gender === "flexible"
                    ? "Fleksibel"
                    : "Campur"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
              {room.allocation === "employee" ? (
                <Briefcase className="h-5 w-5 text-blue-600" />
              ) : (
                <User className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Alokasi</p>
                <p className="font-semibold text-sm">
                  {room.allocation === "employee" ? "Karyawan" : "Tamu"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
              <BedDouble className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Kapasitas</p>
                <p className="font-semibold text-sm">{room.capacity} Bed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Durasi</p>
                <p className="font-semibold text-sm">{duration} Malam</p>
              </div>
            </div>
          </div>

          {/* Facilities */}
          {room.facilities && room.facilities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Fasilitas
              </h4>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Bed Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-primary" />
                Pilih Bed
              </h4>
              <Badge variant="outline" className="text-sm">
                {availableBedsForRange.length} / {room.capacity} tersedia
              </Badge>
            </div>

            {/* Date Range Info */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>
                Periode:{" "}
                <strong>
                  {format(startDate, "dd MMM yyyy", { locale: localeId })}
                </strong>
                {" - "}
                <strong>
                  {format(endDate, "dd MMM yyyy", { locale: localeId })}
                </strong>
              </span>
            </div>

            {availableBedsForRange.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Tidak ada bed tersedia</p>
                <p className="text-sm">untuk seluruh periode yang dipilih</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableBedsForRange.map((bed) => {
                  const selected = isBedSelected(bed.id);
                  const canSelect = !selected && !isMaxReached;

                  return (
                    <Button
                      key={bed.id}
                      variant={selected ? "default" : "outline"}
                      className={cn(
                        "h-auto py-4 justify-start gap-3 transition-all",
                        selected &&
                          "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400",
                        !canSelect &&
                          !selected &&
                          "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleBedToggle(bed)}
                      disabled={!canSelect && !selected}
                    >
                      {selected ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <BedDouble className="h-5 w-5" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold">Bed {bed.code}</div>
                        <div className="text-xs opacity-80">
                          {selected ? "Terpilih" : "Tersedia"}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              {totalSelectedBeds > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    totalSelectedBeds >= maxSelection
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}
                >
                  {totalSelectedBeds >= maxSelection ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Total {totalSelectedBeds} bed terpilih</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {totalSelectedBeds}/{maxSelection} bed • Perlu{" "}
                        {remaining} lagi
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button onClick={() => onOpenChange(false)}>Selesai</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

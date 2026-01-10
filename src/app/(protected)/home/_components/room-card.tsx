"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building2,
  Wind,
  Tv,
  Wifi,
  Bath,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { RoomAvailability, RoomTypeInfo } from "./room-search-api";

interface RoomCardProps {
  room: RoomAvailability;
  totalPeople?: number; // Optional now? Used for "Can Fit" logic.
  onSelect?: () => void; // For the button action
}

export function RoomCard({ room, totalPeople = 1, onSelect }: RoomCardProps) {
  const canFitAll = room.availableBeds >= totalPeople;

  const getRoomTypeStyle = (roomType: RoomTypeInfo) => {
    const code = roomType.code.toLowerCase();
    if (code.includes("vvip")) {
      return {
        icon: <Crown className="h-4 w-4" />,
        bg: "bg-gradient-to-r from-amber-500 to-yellow-400",
        text: "text-white",
      };
    }
    if (code.includes("vip")) {
      return {
        icon: <Star className="h-4 w-4" />,
        bg: "bg-gradient-to-r from-violet-500 to-purple-400",
        text: "text-white",
      };
    }
    return {
      icon: null,
      bg: "bg-slate-200 dark:bg-slate-700",
      text: "text-slate-700 dark:text-slate-200",
    };
  };

  const typeStyle = getRoomTypeStyle(room.roomType);

  const getBedStatusStyle = (status: string) => {
    const config = {
      available: {
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        label: "Kosong",
      },
      occupied: {
        icon: <XCircle className="h-3.5 w-3.5" />,
        color: "text-slate-500",
        bg: "bg-slate-50 dark:bg-slate-900/20",
        label: "Terisi",
      },
      reserved: {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        label: "Dipesan",
      },
      maintenance: {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        color: "text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
        label: "Perbaikan",
      },
    };
    return config[status as keyof typeof config];
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg",
        canFitAll && "ring-2 ring-emerald-500/50"
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Room Info */}
          <div className="flex-1 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{room.code}</h3>
                  <Badge className={cn("gap-1", typeStyle.bg, typeStyle.text)}>
                    {typeStyle.icon}
                    {room.roomType.name}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {room.areaName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {room.buildingName}
                  </span>
                  <span>Lantai {room.floor}</span>
                </div>
              </div>
              <div
                className={cn(
                  "text-center px-4 py-2 rounded-lg",
                  canFitAll
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                )}
              >
                <p
                  className={cn(
                    "text-2xl font-bold",
                    canFitAll ? "text-emerald-600" : "text-amber-600"
                  )}
                >
                  {room.availableBeds}
                </p>
                <p className="text-xs text-muted-foreground">
                  dari {room.capacity}
                </p>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                FASILITAS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {room.facilities.map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="text-xs font-normal gap-1"
                  >
                    {f === "AC" && <Wind className="h-3 w-3" />}
                    {f === "TV" && <Tv className="h-3 w-3" />}
                    {f === "WiFi" && <Wifi className="h-3 w-3" />}
                    {f === "Kamar Mandi Dalam" && <Bath className="h-3 w-3" />}
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bed Status */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                STATUS BED
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {room.beds.map((bed) => {
                  const style = getBedStatusStyle(bed.status);
                  return (
                    <div
                      key={bed.id}
                      className={cn("p-2 rounded-lg", style.bg)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{bed.code}</span>
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-xs",
                            style.color
                          )}
                        >
                          {style.icon}
                        </span>
                      </div>
                      {bed.status === "occupied" && bed.occupantName && (
                        <div className="text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1 truncate">
                            <User className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{bed.occupantName}</span>
                          </div>
                          {bed.occupantCheckOut && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              Out:{" "}
                              {format(bed.occupantCheckOut, "dd/MM", {
                                locale: localeId,
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {bed.status === "reserved" && bed.reservedFrom && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5 shrink-0" />
                          {format(bed.reservedFrom, "dd/MM", {
                            locale: localeId,
                          })}
                          {bed.reservedTo && (
                            <>
                              -
                              {format(bed.reservedTo, "dd/MM", {
                                locale: localeId,
                              })}
                            </>
                          )}
                        </div>
                      )}
                      {bed.status === "available" && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          Tersedia
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Action */}
          {onSelect && (
            <div
              className={cn(
                "flex md:flex-col items-center justify-center gap-3 p-4 md:w-[120px] border-t md:border-t-0 md:border-l",
                canFitAll
                  ? "bg-emerald-50/50 dark:bg-emerald-900/10"
                  : "bg-amber-50/50 dark:bg-amber-900/10"
              )}
            >
              <Button
                className={cn(
                  "w-full gap-1",
                  canFitAll
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={onSelect}
              >
                Pilih
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!canFitAll && (
                <p className="text-xs text-muted-foreground text-center">
                  {room.availableBeds} dari {totalPeople} orang
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

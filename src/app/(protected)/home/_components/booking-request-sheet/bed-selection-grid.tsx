"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  BedDouble,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomAvailability, BedAvailability } from "../room-search-api";
import type { SelectedBed } from "../booking-request-types";
import {
  startOfDay,
  eachDayOfInterval,
  isBefore,
  isWithinInterval,
} from "date-fns";

interface BedSelectionGridProps {
  availableRooms: RoomAvailability[];
  searchParams: {
    areaId: string;
    startDate: Date;
    endDate: Date;
    totalPeople: number;
  };
  selectedBeds: SelectedBed[];
  onBedSelect: (bed: SelectedBed) => void;
  maxSelection: number;
}

export function BedSelectionGrid({
  availableRooms,
  searchParams,
  selectedBeds,
  onBedSelect,
  maxSelection,
}: BedSelectionGridProps) {
  // Get beds that are available for the ENTIRE date range
  const availableBedsForRange = useMemo(() => {
    const days = eachDayOfInterval({
      start: searchParams.startDate,
      end: searchParams.endDate,
    });

    return availableRooms
      .map((room) => {
        const availableBeds = room.beds.filter((bed) => {
          // Check if bed is available for ALL days in the range
          return days.every((day) => {
            const dayStart = startOfDay(day);

            if (bed.status === "maintenance") return false;

            if (bed.status === "occupied" && bed.occupantCheckOut) {
              if (isBefore(dayStart, startOfDay(bed.occupantCheckOut))) {
                return false;
              }
            }

            if (
              bed.status === "reserved" &&
              bed.reservedFrom &&
              bed.reservedTo
            ) {
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

        return {
          ...room,
          availableBedsForRange: availableBeds,
        };
      })
      .filter((room) => room.availableBedsForRange.length > 0);
  }, [availableRooms, searchParams.startDate, searchParams.endDate]);

  // Group by building
  const roomsByBuilding = useMemo(() => {
    const grouped = new Map<string, typeof availableBedsForRange>();

    availableBedsForRange.forEach((room) => {
      const existing = grouped.get(room.buildingId) || [];
      grouped.set(room.buildingId, [...existing, room]);
    });

    return Array.from(grouped.entries());
  }, [availableBedsForRange]);

  const isBedSelected = (bedId: string) => {
    return selectedBeds.some((b) => b.bedId === bedId);
  };

  const handleBedClick = (room: RoomAvailability, bed: BedAvailability) => {
    const selectedBed: SelectedBed = {
      roomId: room.id,
      roomCode: room.code,
      bedId: bed.id,
      bedCode: bed.code,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      areaId: room.areaId,
      areaName: room.areaName,
      roomType: room.roomType.code,
      capacity: room.capacity,
    };

    onBedSelect(selectedBed);
  };

  if (availableBedsForRange.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BedDouble className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Available Beds</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No beds are available for the entire selected date range. Try
          adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  {selectedBeds.length} / {maxSelection} Beds Selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Select beds for your {maxSelection} occupant
                  {maxSelection > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {selectedBeds.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {selectedBeds.length} selected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rooms by Building */}
      {roomsByBuilding.map(([buildingId, rooms]) => (
        <div key={buildingId} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {rooms[0].buildingName}
          </div>

          <div className="grid gap-3">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-lg border">
                        <BedDouble className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{room.code}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {room.roomType.name} • Capacity: {room.capacity}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {room.availableBedsForRange.length} / {room.capacity}{" "}
                      available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {room.availableBedsForRange.map((bed) => {
                      const selected = isBedSelected(bed.id);
                      const canSelect =
                        !selected && selectedBeds.length < maxSelection;

                      return (
                        <Button
                          key={bed.id}
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "justify-start gap-2 h-auto py-3",
                            !canSelect &&
                              !selected &&
                              "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handleBedClick(room, bed)}
                          disabled={!canSelect && !selected}
                        >
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          <div className="text-left">
                            <div className="font-semibold">Bed {bed.code}</div>
                            <div className="text-[10px] opacity-80">
                              {room.code}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

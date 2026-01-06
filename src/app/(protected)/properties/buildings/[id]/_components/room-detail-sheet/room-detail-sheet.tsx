"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoorOpen, Bed, Edit, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoomData } from "../../_actions/building-detail.schema";
import { BedsTab } from "./beds-tab";
import { HistoryTab } from "./history-tab";

// ========================================
// TYPES
// ========================================

export interface RoomDetailSheetProps {
  room: RoomData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

// ========================================
// COMPONENT
// ========================================

export function RoomDetailSheet({
  room,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: RoomDetailSheetProps) {
  if (!room) return null;

  const bedsOccupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
  const totalBeds = room.beds.length;
  const hasOccupants = bedsOccupied > 0;

  // Gender label
  const genderLabel =
    room.genderPolicy === "MALE_ONLY"
      ? "Pria"
      : room.genderPolicy === "FEMALE_ONLY"
      ? "Wanita"
      : room.genderPolicy === "FLEXIBLE"
      ? "Flexible"
      : "Campuran";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 text-left flex-shrink-0 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <DoorOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">{room.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {room.code}
                </SheetDescription>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onEdit}
                disabled={hasOccupants}
                title={hasOccupants ? "Ada penghuni aktif" : "Edit ruangan"}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>

          {/* Room Info Row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Occupancy */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                bedsOccupied === 0
                  ? "border-emerald-500 text-emerald-600"
                  : bedsOccupied === totalBeds
                  ? "border-red-500 text-red-600"
                  : "border-blue-500 text-blue-600"
              )}
            >
              <Bed className="h-3 w-3 mr-1" />
              {bedsOccupied}/{totalBeds} terisi
            </Badge>

            {/* Room Type */}
            <Badge variant="secondary" className="text-xs">
              {room.roomType.name}
            </Badge>

            {/* Gender */}
            <Badge variant="outline" className="text-xs">
              {genderLabel}
            </Badge>

            {/* Floor */}
            <Badge variant="outline" className="text-xs">
              Lt. {room.floorNumber}
            </Badge>

            {/* Status */}
            {room.status !== "ACTIVE" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  room.status === "MAINTENANCE"
                    ? "border-amber-500 text-amber-600"
                    : "border-slate-400 text-slate-600"
                )}
              >
                {room.status === "MAINTENANCE" ? "Maintenance" : "Tidak Aktif"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          defaultValue="beds"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-5 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="beds" className="text-xs gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              Beds ({totalBeds})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5">
              <History className="h-3.5 w-3.5" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beds" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-5 py-4">
                <BedsTab room={room} onRefresh={onRefresh} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-5 py-4">
                <HistoryTab room={room} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

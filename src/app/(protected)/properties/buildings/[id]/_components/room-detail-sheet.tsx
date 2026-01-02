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
import {
  DoorOpen,
  Bed,
  User,
  Edit,
  History,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoomData, BedData } from "../_actions/building-detail.schema";

// ========================================
// BED STATUS CONFIG
// ========================================

const bedStatusConfig = {
  AVAILABLE: {
    label: "Tersedia",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  OCCUPIED: {
    label: "Terisi",
    icon: User,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  RESERVED: {
    label: "Dipesan",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-800",
  },
  BLOCKED: {
    label: "Diblokir",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
  },
};

// ========================================
// BED LIST ITEM
// ========================================

interface BedListItemProps {
  bed: BedData;
}

function BedListItem({ bed }: BedListItemProps) {
  const config = bedStatusConfig[bed.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-white dark:bg-slate-800 border",
            config.border
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div>
          <p className="font-medium text-sm">{bed.label}</p>
          <p className="text-xs text-muted-foreground font-mono">{bed.code}</p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant="outline" className={cn("text-[10px]", config.color)}>
          {config.label}
        </Badge>
        {bed.status === "OCCUPIED" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {/* TODO: Show occupant name when available */}
            Lihat penghuni
          </p>
        )}
      </div>
    </div>
  );
}

// ========================================
// BEDS TAB
// ========================================

function BedsTab({ room }: { room: RoomData }) {
  const sortedBeds = [...room.beds].sort((a, b) => {
    // Sort by status priority: OCCUPIED > RESERVED > AVAILABLE > MAINTENANCE > BLOCKED
    const priority = {
      OCCUPIED: 0,
      RESERVED: 1,
      AVAILABLE: 2,
      MAINTENANCE: 3,
      BLOCKED: 4,
    };
    return priority[a.status] - priority[b.status];
  });

  return (
    <div className="space-y-2">
      {sortedBeds.map((bed) => (
        <BedListItem key={bed.id} bed={bed} />
      ))}
    </div>
  );
}

// ========================================
// HISTORY TAB (PLACEHOLDER)
// ========================================

function HistoryTab({ room }: { room: RoomData }) {
  // TODO: Fetch occupancy history from API
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-3">
        <History className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="font-medium mb-1">Riwayat Penghuni</h4>
      <p className="text-sm text-muted-foreground max-w-xs">
        Fitur riwayat penghuni untuk ruangan {room.code} akan segera tersedia.
      </p>
    </div>
  );
}

// ========================================
// ROOM DETAIL SHEET
// ========================================

interface RoomDetailSheetProps {
  room: RoomData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function RoomDetailSheet({
  room,
  open,
  onOpenChange,
  onEdit,
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
                <BedsTab room={room} />
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

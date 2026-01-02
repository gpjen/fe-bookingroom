"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Layers,
  DoorOpen,
  Users,
  Construction,
  Plus,
  Bed,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { RoomDetailSheet } from "./room-detail-sheet";
import { toast } from "sonner";
import { getRoomsGroupedByFloor } from "../_actions/building-detail.actions";
import { FloorWithRooms, RoomData } from "../_actions/building-detail.schema";

// ========================================
// ROOM CARD COMPONENT
// ========================================

interface RoomCardProps {
  room: RoomData;
  onClick: () => void;
}

function RoomCard({ room, onClick }: RoomCardProps) {
  const statusColors = {
    ACTIVE:
      "bg-white dark:bg-gray-800 border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600",
    INACTIVE:
      "bg-slate-50 dark:bg-gray-900 border-slate-300 dark:border-zinc-600 opacity-60",
    MAINTENANCE:
      "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800",
  };

  // Calculate bed stats
  const bedsAvailable = room.beds.filter(
    (b) => b.status === "AVAILABLE"
  ).length;
  const bedsOccupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
  const totalBeds = room.beds.length;

  const occupancyPercent = totalBeds > 0 ? (bedsOccupied / totalBeds) * 100 : 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        statusColors[room.status]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {room.code}
            </p>
            <h4 className="font-semibold text-sm">{room.name}</h4>
          </div>
          {room.status === "MAINTENANCE" && (
            <Construction className="h-4 w-4 text-amber-500" />
          )}
        </div>

        {/* Bed occupancy bar */}
        <div className="mb-3">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                occupancyPercent >= 100
                  ? "bg-red-500"
                  : occupancyPercent >= 75
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {totalBeds}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {bedsOccupied}/{totalBeds}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              bedsAvailable > 0
                ? "border-emerald-500 text-emerald-600"
                : "border-red-500 text-red-600"
            )}
          >
            {bedsAvailable > 0 ? `${bedsAvailable} tersedia` : "Penuh"}
          </Badge>
        </div>

        {/* Room type & Gender */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            {room.roomType.name}
          </Badge>
          {room.genderPolicy !== "MIX" && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                room.genderPolicy === "MALE_ONLY"
                  ? "border-blue-400 text-blue-600"
                  : room.genderPolicy === "FEMALE_ONLY"
                  ? "border-pink-400 text-pink-600"
                  : "border-purple-400 text-purple-600"
              )}
            >
              {room.genderPolicy === "MALE_ONLY"
                ? "Pria"
                : room.genderPolicy === "FEMALE_ONLY"
                ? "Wanita"
                : "Flexible"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// FLOOR LOADING SKELETON
// ========================================

function FloorsLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-28 w-full" />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ========================================
// EMPTY STATE
// ========================================

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="p-4 rounded-full bg-muted mb-4">
          <DoorOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Belum Ada Ruangan</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Gedung ini belum memiliki ruangan. Tambahkan ruangan pertama untuk
          mulai mengelola hunian.
        </p>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Ruangan
        </Button>
      </CardContent>
    </Card>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingFloors({ id }: { id: string }) {
  const [floors, setFloors] = useState<FloorWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const isFetching = useRef(false);

  // Fetch floors data
  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const result = await getRoomsGroupedByFloor(id);
      if (result.success) {
        setFloors(result.data);
        // Auto-expand first floor
        if (result.data.length > 0) {
          setExpandedFloors([`floor-${result.data[0].floorNumber}`]);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data ruangan");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleRoomClick = (room: RoomData) => {
    setSelectedRoom(room);
  };

  const handleAddRoom = (floorNumber?: number) => {
    toast.info(
      `Tambah ruangan${floorNumber ? ` di lantai ${floorNumber}` : ""}`
    );
    // TODO: Open room form
  };

  if (loading) {
    return <FloorsLoading />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (floors.length === 0) {
    return <EmptyState />;
  }

  // Calculate total stats
  const totalStats = floors.reduce(
    (acc, floor) => ({
      rooms: acc.rooms + floor.stats.totalRooms,
      beds: acc.beds + floor.stats.totalBeds,
      available: acc.available + floor.stats.bedsAvailable,
      occupied: acc.occupied + floor.stats.bedsOccupied,
    }),
    { rooms: 0, beds: 0, available: 0, occupied: 0 }
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Lantai & Ruangan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {floors.length} lantai • {totalStats.rooms} ruangan •{" "}
                  {totalStats.beds} bed
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => handleAddRoom()}>
              <Plus className="h-4 w-4" />
              Tambah Ruangan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            value={expandedFloors}
            onValueChange={setExpandedFloors}
            className="space-y-3"
          >
            {floors.map((floor) => (
              <AccordionItem
                key={floor.floorNumber}
                value={`floor-${floor.floorNumber}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                        {floor.floorNumber}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">
                          {floor.floorName || `Lantai ${floor.floorNumber}`}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {floor.stats.totalRooms} ruangan
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {floor.stats.totalBeds}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          floor.stats.bedsAvailable > 0
                            ? "border-emerald-500 text-emerald-600"
                            : "border-red-500 text-red-600"
                        )}
                      >
                        {floor.stats.bedsAvailable} tersedia
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                    {floor.rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => handleRoomClick(room)}
                      />
                    ))}
                    {/* Add room button */}
                    <Card
                      className="cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={() => handleAddRoom(floor.floorNumber)}
                    >
                      <CardContent className="flex flex-col items-center justify-center h-full min-h-[130px] text-muted-foreground">
                        <Plus className="h-6 w-6 mb-2" />
                        <span className="text-sm">Tambah Ruangan</span>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Room Detail Sheet */}
      <RoomDetailSheet
        room={selectedRoom}
        open={!!selectedRoom}
        onOpenChange={(open) => !open && setSelectedRoom(null)}
      />
    </>
  );
}

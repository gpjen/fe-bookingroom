"use client";

import { useState } from "react";
import {
  Layers,
  DoorOpen,
  Plus,
  MoreHorizontal,
  Construction,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RoomDetailSheet } from "./room-detail-sheet";
import { RoomForm } from "./room-form";
import { toast } from "sonner";
import { FloorWithRooms, RoomData } from "../_actions/building-detail.schema";
import { RoomTypeOption, RoomWithBeds } from "../_actions/room.types";
import { deleteRoom, getRoomById } from "../_actions/room.actions";

// ========================================
// COMPACT ROOM CARD - Fixed size grid item
// ========================================

interface RoomCardProps {
  room: RoomData;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function RoomCard({ room, onView, onEdit, onDelete }: RoomCardProps) {
  const bedsOccupied = room.beds.filter((b) =>
    b.occupancies.some((o) => o.status === "CHECKED_IN")
  ).length;
  const bedsReserved = room.beds.filter((b) =>
    b.occupancies.some((o) => ["PENDING", "RESERVED"].includes(o.status))
  ).length;
  // Beds with pending booking requests (no occupancy but has requestItems)
  const bedsPendingRequest = room.beds.filter(
    (b) => b.occupancies.length === 0 && (b.requestItems?.length ?? 0) > 0
  ).length;
  const bedsAvailable = room.beds.filter(
    (b) => b.occupancies.length === 0 && (b.requestItems?.length ?? 0) === 0
  ).length;
  const totalBeds = room.beds.length;
  const hasOccupants = bedsOccupied > 0;
  const isFull = bedsOccupied === totalBeds && totalBeds > 0;
  const hasPendingCheckIns = bedsReserved > 0 || bedsPendingRequest > 0;

  // Status color for occupancy indicator
  const getIndicatorColor = () => {
    if (room.status === "MAINTENANCE") return "bg-amber-500";
    if (room.status === "INACTIVE") return "bg-slate-400";
    if (isFull) return "bg-red-500";
    if (bedsOccupied > 0) return "bg-blue-500";
    return "bg-emerald-500";
  };

  // Gender label (only show if not MIX)
  const getGenderLabel = () => {
    if (room.genderPolicy === "MALE_ONLY") return "L";
    if (room.genderPolicy === "FEMALE_ONLY") return "P";
    if (room.genderPolicy === "FLEXIBLE") return "F";
    return null;
  };

  const genderLabel = getGenderLabel();

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full min-h-[7rem] p-3 rounded-lg border cursor-pointer transition-all",
        "hover:shadow-sm hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/20",
        room.status === "MAINTENANCE" &&
          "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
        room.status === "INACTIVE" && "opacity-50",
        hasPendingCheckIns && "ring-2 ring-blue-200 dark:ring-blue-800"
      )}
      onClick={onView}
    >
      {/* Pending check-in indicator */}
      {hasPendingCheckIns && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="h-5 px-1.5 text-[10px] bg-orange-500 hover:bg-orange-500 text-white shadow-sm animate-pulse">
            {bedsReserved + bedsPendingRequest} pending
          </Badge>
        </div>
      )}

      {/* Top section: Room info */}
      <div className="flex items-start justify-between mb-2">
        {/* Room code */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-semibold truncate">
              {room.code}
            </span>
            {genderLabel && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1 py-0 h-4 flex-shrink-0",
                  room.genderPolicy === "MALE_ONLY"
                    ? "border-blue-400 text-blue-600"
                    : room.genderPolicy === "FEMALE_ONLY"
                    ? "border-pink-400 text-pink-600"
                    : "border-purple-400 text-purple-600"
                )}
              >
                {genderLabel}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {room.roomType.name || "No Type"}
          </p>
        </div>

        {/* 3-dot menu (visible on hover) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              disabled={hasOccupants}
              className={hasOccupants ? "opacity-50" : ""}
            >
              Edit
              {hasOccupants && (
                <span className="text-[10px] ml-auto">Ada penghuni</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={hasOccupants}
              className={cn(
                "text-destructive focus:text-destructive",
                hasOccupants && "opacity-50"
              )}
            >
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom section: Occupancy indicator */}
      <div className="mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Occupancy circle */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                getIndicatorColor()
              )}
            >
              {room.status === "MAINTENANCE" ? (
                <Construction className="h-3.5 w-3.5" />
              ) : (
                `${bedsOccupied}/${totalBeds}`
              )}
            </div>

            {/* Status info */}
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {room.status === "MAINTENANCE"
                  ? "Perbaikan"
                  : room.status === "INACTIVE"
                  ? "Tidak Aktif"
                  : isFull
                  ? "Penuh"
                  : bedsOccupied > 0
                  ? "Terisi"
                  : "Kosong"}
              </span>
              {/* Quick stats */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                {bedsAvailable > 0 && (
                  <span className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {bedsAvailable}
                  </span>
                )}
                {bedsReserved > 0 && (
                  <span className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {bedsReserved}
                  </span>
                )}
                {bedsPendingRequest > 0 && (
                  <span className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    {bedsPendingRequest}
                  </span>
                )}
                {bedsOccupied > 0 && (
                  <span className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {bedsOccupied}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Capacity info */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Kapasitas</div>
            <div className="text-sm font-semibold">{totalBeds} bed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// EMPTY STATE
// ========================================

function EmptyState({ onAddRoom }: { onAddRoom: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="p-4 rounded-full bg-muted mb-4">
          <DoorOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Belum Ada Ruangan</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Tambahkan ruangan pertama untuk mulai mengelola hunian.
        </p>
        <Button className="gap-2" onClick={onAddRoom}>
          <Plus className="h-4 w-4" />
          Tambah Ruangan
        </Button>
      </CardContent>
    </Card>
  );
}

// ========================================
// PROPS
// ========================================

interface BuildingFloorsProps {
  buildingId: string;
  initialData: FloorWithRooms[];
  roomTypes: RoomTypeOption[];
  onRefresh: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingFloors({
  buildingId,
  initialData,
  roomTypes,
  onRefresh,
}: BuildingFloorsProps) {
  const floors = initialData;

  // Room form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithBeds | null>(null);
  const [defaultFloorNumber, setDefaultFloorNumber] = useState<number>(1);

  // Room detail state
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  // Delete state
  const [deletingRoom, setDeletingRoom] = useState<RoomData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Accordion state
  const [expandedFloors, setExpandedFloors] = useState<string[]>(
    initialData.length > 0 ? [`floor-${initialData[0].floorNumber}`] : []
  );

  // Handlers
  const handleViewRoom = (room: RoomData) => {
    setSelectedRoom(room);
  };

  const handleAddRoom = (floorNumber?: number) => {
    setEditingRoom(null);
    setDefaultFloorNumber(floorNumber || 1);
    setIsFormOpen(true);
  };

  const handleEditRoom = async (room: RoomData) => {
    const hasOccupants = room.beds.some((b) =>
      b.occupancies.some((o) => o.status === "CHECKED_IN")
    );
    if (hasOccupants) {
      toast.error("Tidak bisa edit ruangan yang memiliki penghuni");
      return;
    }

    // Fetch full room data
    const result = await getRoomById(room.id);
    if (result.success) {
      setEditingRoom(result.data);
      setIsFormOpen(true);
    } else {
      toast.error("Gagal memuat data ruangan");
    }
  };

  const handleDeleteRoom = (room: RoomData) => {
    const hasOccupants = room.beds.some((b) =>
      b.occupancies.some((o) => o.status === "CHECKED_IN")
    );
    if (hasOccupants) {
      toast.error("Tidak bisa hapus ruangan yang memiliki penghuni");
      return;
    }
    setDeletingRoom(room);
  };

  const confirmDeleteRoom = async () => {
    if (!deletingRoom) return;

    setIsDeleting(true);
    const result = await deleteRoom(deletingRoom.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Ruangan berhasil dihapus");
      setDeletingRoom(null);
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleFormSuccess = () => {
    onRefresh();
  };

  if (floors.length === 0) {
    return (
      <>
        <EmptyState onAddRoom={() => handleAddRoom()} />
        <RoomForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          buildingId={buildingId}
          roomTypes={roomTypes}
          room={editingRoom}
          defaultFloorNumber={defaultFloorNumber}
          onSuccess={handleFormSuccess}
        />
      </>
    );
  }

  // Total stats
  const totalStats = floors.reduce(
    (acc, floor) => ({
      rooms: acc.rooms + floor.stats.totalRooms,
      available: acc.available + floor.stats.bedsAvailable,
    }),
    { rooms: 0, available: 0 }
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Lantai & Ruangan</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {totalStats.rooms} ruangan •{" "}
                  <span className="text-emerald-600">
                    {totalStats.available} bed tersedia
                  </span>
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => handleAddRoom()}
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion
            type="multiple"
            value={expandedFloors}
            onValueChange={setExpandedFloors}
            className="space-y-2 mb-2"
          >
            {floors.map((floor) => (
              <AccordionItem
                key={floor.floorNumber}
                value={`floor-${floor.floorNumber}`}
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                        {floor.floorNumber}
                      </div>
                      <span className="font-medium text-sm">
                        {`Lantai ${floor.floorNumber}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] py-0">
                        {floor.stats.totalRooms} kamar
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] py-0",
                          floor.stats.bedsAvailable > 0
                            ? "border-emerald-500 text-emerald-600"
                            : "border-red-500 text-red-600"
                        )}
                      >
                        {floor.stats.bedsAvailable} kosong
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  {/* Grid untuk ruangan dengan ukuran tetap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1">
                    {floor.rooms.map((room) => (
                      <div key={room.id} className="min-w-0">
                        <RoomCard
                          room={room}
                          onView={() => handleViewRoom(room)}
                          onEdit={() => handleEditRoom(room)}
                          onDelete={() => handleDeleteRoom(room)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add room button */}
                  <button
                    className="w-full flex items-center justify-center gap-2 mt-4 p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-zinc-700 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors text-sm"
                    onClick={() => handleAddRoom(floor.floorNumber)}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Ruangan di Lantai {floor.floorNumber}
                  </button>
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
        onEdit={() => {
          if (selectedRoom) {
            setSelectedRoom(null);
            handleEditRoom(selectedRoom);
          }
        }}
        onRefresh={onRefresh}
      />

      {/* Room Form */}
      <RoomForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        buildingId={buildingId}
        roomTypes={roomTypes}
        room={editingRoom}
        defaultFloorNumber={defaultFloorNumber}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingRoom}
        onOpenChange={(open) => !open && setDeletingRoom(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ruangan</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus ruangan <strong>{deletingRoom?.code}</strong>? Semua data
              bed akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

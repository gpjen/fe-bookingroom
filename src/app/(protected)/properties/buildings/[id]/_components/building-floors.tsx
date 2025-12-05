"use client";

import { useState, useEffect } from "react";
import { Layers, DoorOpen, Users, Construction } from "lucide-react";
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
import { FormRoom, RoomFormData } from "./form-room";
import { toast } from "sonner";

// Types
type RoomStatus = "available" | "occupied" | "maintenance";

interface Room {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  occupied: number;
  status: RoomStatus;
  facilities: string[];
  price: number;
  isMixGender: boolean;
  isBookable: boolean;
  isOnlyForEmployee: boolean;
  description: string;
}

interface Floor {
  id: string;
  name: string;
  level: number;
  rooms: Room[];
}

// Mock Data Fetcher
const fetchFloorsData = async (_id: string): Promise<Floor[]> => {
  void _id; // Will be used when fetching real data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "f1",
          name: "Lantai 1",
          level: 1,
          rooms: Array.from({ length: 8 }).map((_, i) => ({
            id: `r1-${i}`,
            code: `R-10${i + 1}`,
            name: `Kamar 10${i + 1}`,
            type: "Standard",
            capacity: 2,
            occupied: i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0,
            status: i === 5 ? "maintenance" : "available",
            facilities: ["AC", "WiFi"],
            price: 0,
            isMixGender: false,
            isBookable: true,
            isOnlyForEmployee: false,
            description: "Kamar standar dengan fasilitas dasar.",
          })),
        },
        {
          id: "f2",
          name: "Lantai 2",
          level: 2,
          rooms: Array.from({ length: 8 }).map((_, i) => ({
            id: `r2-${i}`,
            code: `R-20${i + 1}`,
            name: `Kamar 20${i + 1}`,
            type: "VIP",
            capacity: 1,
            occupied: i < 5 ? 1 : 0,
            status: "available",
            facilities: ["AC", "WiFi", "TV", "Kulkas"],
            price: 500000,
            isMixGender: false,
            isBookable: true,
            isOnlyForEmployee: false,
            description: "Kamar VIP dengan fasilitas lengkap dan pemandangan.",
          })),
        },
        {
          id: "f3",
          name: "Lantai 3",
          level: 3,
          rooms: Array.from({ length: 6 }).map((_, i) => ({
            id: `r3-${i}`,
            code: `R-30${i + 1}`,
            name: `Kamar 30${i + 1}`,
            type: "Standard",
            capacity: 2,
            occupied: 0,
            status: "available",
            facilities: ["AC", "WiFi"],
            price: 0,
            isMixGender: true,
            isBookable: true,
            isOnlyForEmployee: true,
            description: "Kamar standar mix gender.",
          })),
        },
      ]);
    }, 300); // Simulate delay
  });
};

const RoomCard = ({ room, onClick }: { room: Room; onClick: () => void }) => {
  const statusColors = {
    available:
      "bg-white dark:bg-gray-800 border-slate-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600",
    occupied:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800",
    maintenance:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border shadow-sm transition-all cursor-pointer group relative",
        "hover:shadow-md hover:-translate-y-0.5",
        statusColors[room.status]
      )}
    >
      {/* Header */}
      <div className="flex justify-between mb-3">
        <div>
          <div className="font-semibold text-sm">{room.code}</div>
          <div className="text-xs text-muted-foreground truncate">
            {room.type}
          </div>
        </div>
        {room.status === "maintenance" && (
          <Construction className="h-4 w-4 text-orange-500" />
        )}
      </div>

      {/* Occupancy + Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>
            {room.occupied}/{room.capacity}
          </span>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "h-5 text-[10px] px-1.5",
            room.status === "available" &&
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            room.status === "occupied" &&
              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            room.status === "maintenance" &&
              "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          )}
        >
          {room.status === "available"
            ? "Tersedia"
            : room.status === "occupied"
            ? "Terisi"
            : "Perbaikan"}
        </Badge>
      </div>
    </div>
  );
};

export function BuildingFloors({ id }: { id: string }) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    fetchFloorsData(id).then((res) => {
      setFloors(res);
      setLoading(false);
    });
  }, [id]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsSheetOpen(true);
  };

  const handleAddFloor = () => {
    console.log("Add Floor");
    setFloors((prevFloors) => [
      ...prevFloors,
      {
        id: `f${prevFloors.length + 1}`,
        name: `Lantai ${prevFloors.length + 1}`,
        level: prevFloors.length + 1,
        rooms: [],
      },
    ]);
  };

  const handleAddRoom = (floorId?: string) => {
    setSelectedFloorId(floorId);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: RoomFormData) => {
    console.log("Form Data:", data);
    toast.success("Kamar berhasil ditambahkan", {
      description: `${data.code} telah ditambahkan ke lantai terpilih.`,
    });
    // Here you would typically call an API to save the data
    // and then refresh the floors data
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Denah Lantai</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola struktur lantai dan ruangan dalam gedung ini
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => handleAddFloor()}
            >
              <Layers className="h-4 w-4" />
              Tambah Lantai
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            defaultValue={floors.map((f) => f.id)}
            className="w-full space-y-4"
          >
            {floors.map((floor) => (
              <AccordionItem
                key={floor.id}
                value={floor.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{floor.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-normal ml-auto mr-4">
                      <span>{floor.rooms.length} Kamar</span>
                      <span>
                        {
                          floor.rooms.filter((r) => r.status === "available")
                            .length
                        }{" "}
                        Tersedia
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
                    {floor.rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => handleRoomClick(room)}
                      />
                    ))}
                    <Button
                      variant="outline"
                      className="h-full min-h-[90px] border-dashed flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"
                      onClick={() => handleAddRoom(floor.id)}
                    >
                      <DoorOpen className="h-5 w-5" />
                      <span className="text-xs">Tambah Kamar</span>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <RoomDetailSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        room={selectedRoom}
        floors={floors.map((f) => ({ id: f.id, name: f.name }))}
      />

      <FormRoom
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        floors={floors.map((f) => ({ id: f.id, name: f.name }))}
        initialFloorId={selectedFloorId}
      />
    </>
  );
}

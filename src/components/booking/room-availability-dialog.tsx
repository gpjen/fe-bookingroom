"use client";

import { useState, useEffect } from "react";
import { Layers, Users, Bed, Check, X, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Types
type BedStatus = "available" | "occupied";

interface BedData {
  id: string;
  code: string;
  status: BedStatus;
  occupantName?: string;
  roomId: string;
  roomCode: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  beds: BedData[];
  gender?: "L" | "P" | "CAMPUR";
}

interface Floor {
  id: string;
  name: string;
  level: number;
  rooms: Room[];
}

export interface RoomAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  onBedSelect: (
    bedId: string,
    roomId: string,
    roomCode: string,
    bedCode: string
  ) => void;
  currentSelection?: { bedId: string; roomId: string };
}

// Mock data fetcher
const fetchFloorsData = async (buildingId: string): Promise<Floor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const floors: Floor[] = [
        {
          id: "f1",
          name: "Lantai 1",
          level: 1,
          rooms: [
            {
              id: "r1-1",
              code: "R-101",
              name: "Kamar 101",
              type: "Standard",
              capacity: 2,
              gender: "L",
              beds: [
                {
                  id: "bed-101-a",
                  code: "A",
                  status: "available",
                  roomId: "r1-1",
                  roomCode: "R-101",
                },
                {
                  id: "bed-101-b",
                  code: "B",
                  status: "occupied",
                  occupantName: "Ahmad",
                  roomId: "r1-1",
                  roomCode: "R-101",
                },
              ],
            },
            {
              id: "r1-2",
              code: "R-102",
              name: "Kamar 102",
              type: "Standard",
              capacity: 2,
              gender: "L",
              beds: [
                {
                  id: "bed-102-a",
                  code: "A",
                  status: "available",
                  roomId: "r1-2",
                  roomCode: "R-102",
                },
                {
                  id: "bed-102-b",
                  code: "B",
                  status: "available",
                  roomId: "r1-2",
                  roomCode: "R-102",
                },
              ],
            },
            {
              id: "r1-3",
              code: "R-103",
              name: "Kamar 103",
              type: "Standard",
              capacity: 2,
              gender: "P",
              beds: [
                {
                  id: "bed-103-a",
                  code: "A",
                  status: "occupied",
                  occupantName: "Siti",
                  roomId: "r1-3",
                  roomCode: "R-103",
                },
                {
                  id: "bed-103-b",
                  code: "B",
                  status: "available",
                  roomId: "r1-3",
                  roomCode: "R-103",
                },
              ],
            },
          ],
        },
        {
          id: "f2",
          name: "Lantai 2",
          level: 2,
          rooms: [
            {
              id: "r2-1",
              code: "R-201",
              name: "Kamar 201",
              type: "VIP",
              capacity: 1,
              gender: "L",
              beds: [
                {
                  id: "bed-201-a",
                  code: "A",
                  status: "available",
                  roomId: "r2-1",
                  roomCode: "R-201",
                },
              ],
            },
            {
              id: "r2-2",
              code: "R-202",
              name: "Kamar 202",
              type: "VIP",
              capacity: 1,
              gender: "P",
              beds: [
                {
                  id: "bed-202-a",
                  code: "A",
                  status: "occupied",
                  occupantName: "Maya",
                  roomId: "r2-2",
                  roomCode: "R-202",
                },
              ],
            },
          ],
        },
      ];
      resolve(floors);
    }, 300);
  });
};

const BedCard = ({
  bed,
  selected,
  onClick,
}: {
  bed: BedData;
  selected: boolean;
  onClick: () => void;
}) => {
  const getBedConfig = () => {
    if (selected) {
      return {
        color:
          "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-600 shadow-md",
        textColor: "text-blue-700 dark:text-blue-400",
        label: "Dipilih",
        icon: "bg-blue-500",
      };
    }

    if (bed.status === "occupied") {
      return {
        color:
          "bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700",
        textColor: "text-slate-600 dark:text-slate-400",
        label: "Terisi",
        icon: "bg-slate-400",
      };
    }

    return {
      color:
        "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
      textColor: "text-emerald-700 dark:text-emerald-400",
      label: "Tersedia",
      icon: "bg-emerald-500",
    };
  };

  const config = getBedConfig();
  const isClickable = bed.status === "available" || selected;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-[85px]",
        config.color,
        isClickable && "cursor-pointer hover:scale-105 hover:shadow-lg"
      )}
    >
      {selected && (
        <div className="absolute -top-1 -right-1 p-1 bg-blue-600 rounded-full shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <div
        className={cn(
          "p-2 rounded-lg mb-2",
          selected ? "bg-blue-500" : config.icon
        )}
      >
        <Bed
          className={cn("h-5 w-5", selected ? "text-white" : "text-white/90")}
        />
      </div>
      <p className={cn("font-bold text-sm", config.textColor)}>
        Bed {bed.code}
      </p>
      <p className={cn("text-[10px] mt-1", config.textColor)}>{config.label}</p>
      {bed.occupantName && (
        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-full px-1 bg-white/50 dark:bg-slate-900/50 rounded px-2 py-0.5">
          {bed.occupantName}
        </p>
      )}
    </div>
  );
};

const RoomCard = ({
  room,
  selectedBedId,
  onBedSelect,
}: {
  room: Room;
  selectedBedId?: string;
  onBedSelect: (bed: BedData) => void;
}) => {
  const availableCount = room.beds.filter(
    (b) => b.status === "available"
  ).length;
  const occupiedCount = room.beds.filter((b) => b.status === "occupied").length;

  const getGenderBadge = () => {
    if (!room.gender) return null;

    const config = {
      L: {
        label: "Laki-laki",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      P: {
        label: "Perempuan",
        color:
          "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      },
      CAMPUR: {
        label: "Campur",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
    };

    const genderConfig = config[room.gender];

    return (
      <Badge
        variant="outline"
        className={cn("h-5 text-[10px] px-2 font-medium", genderConfig.color)}
      >
        {genderConfig.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 border-2 rounded-xl bg-card hover:shadow-lg transition-all space-y-3 hover:border-primary/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-base">{room.code}</p>
          <p className="text-xs text-muted-foreground">{room.type}</p>
        </div>
        {getGenderBadge()}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium">{room.capacity} Bed</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {availableCount} Tersedia
          </span>
          <span className="text-slate-500 font-medium">
            {occupiedCount} Terisi
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        {room.beds.map((bed) => (
          <BedCard
            key={bed.id}
            bed={bed}
            selected={selectedBedId === bed.id}
            onClick={() => onBedSelect(bed)}
          />
        ))}
      </div>
    </div>
  );
};

export function RoomAvailabilityDialog({
  isOpen,
  onClose,
  buildingId,
  onBedSelect,
  currentSelection,
}: RoomAvailabilityDialogProps) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<string | undefined>(
    currentSelection?.bedId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available">("all");

  useEffect(() => {
    if (buildingId && isOpen) {
      setLoading(true);
      fetchFloorsData(buildingId).then((data) => {
        setFloors(data);
        setLoading(false);
      });
    }
  }, [buildingId, isOpen]);

  useEffect(() => {
    setSelectedBed(currentSelection?.bedId);
  }, [currentSelection]);

  const handleBedClick = (bed: BedData) => {
    setSelectedBed(bed.id);
  };

  const handleConfirm = () => {
    if (selectedBed) {
      const allBeds = floors.flatMap((f) => f.rooms).flatMap((r) => r.beds);
      const bed = allBeds.find((b) => b.id === selectedBed);
      if (bed) {
        onBedSelect(bed.id, bed.roomId, bed.roomCode, bed.code);
        onClose();
      }
    }
  };

  // Filter floors based on search and status
  const filteredFloors = floors
    .map((floor) => ({
      ...floor,
      rooms: floor.rooms.filter((room) => {
        const matchesSearch =
          searchQuery === "" ||
          room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
          filterStatus === "all" ||
          (filterStatus === "available" &&
            room.beds.some((b) => b.status === "available"));

        return matchesSearch && matchesFilter;
      }),
    }))
    .filter((floor) => floor.rooms.length > 0);

  const totalAvailableBeds = floors.reduce(
    (sum, floor) =>
      sum +
      floor.rooms.reduce(
        (rSum, room) =>
          rSum + room.beds.filter((b) => b.status === "available").length,
        0
      ),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Pilih Kamar & Bed</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {totalAvailableBeds} bed tersedia untuk dipilih
          </p>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={filterStatus}
            onValueChange={(v: any) => setFilterStatus(v)}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kamar</SelectItem>
              <SelectItem value="available">Hanya Tersedia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border rounded-xl p-4 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFloors.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tidak Ada Hasil</h3>
              <p className="text-sm text-muted-foreground">
                Tidak ada kamar yang cocok dengan pencarian Anda
              </p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={filteredFloors.map((f) => f.id)}
              className="w-full space-y-3"
            >
              {filteredFloors.map((floor) => {
                const totalBeds = floor.rooms.reduce(
                  (sum, room) => sum + room.capacity,
                  0
                );
                const availableBeds = floor.rooms.reduce(
                  (sum, room) =>
                    sum +
                    room.beds.filter((b) => b.status === "available").length,
                  0
                );

                return (
                  <AccordionItem
                    key={floor.id}
                    value={floor.id}
                    className="border-2 rounded-xl px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 w-full">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Layers className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-bold text-base">
                            {floor.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {floor.rooms.length} Kamar
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium mr-3">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {availableBeds}/{totalBeds} Bed
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floor.rooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            selectedBedId={selectedBed}
                            onBedSelect={handleBedClick}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedBed ? (
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Check className="h-4 w-4 text-emerald-600" />
                Bed dipilih
              </span>
            ) : (
              <span>Pilih bed untuk melanjutkan</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedBed}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Konfirmasi Pilihan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

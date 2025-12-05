"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Check, Building, Bed, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MOCK_BUILDINGS } from "./constants";

type BedStatus = "available" | "occupied" | "booked" | "maintenance";

interface BedData {
  id: string;
  code: string;
  status: BedStatus;
  occupantName?: string;
  bookingId?: string;
}

interface RoomData {
  id: string;
  code: string;
  type: string;
  gender: "L" | "P" | "mix";
  floor: number;
  beds: BedData[];
}

interface FloorData {
  level: number;
  name: string;
  rooms: RoomData[];
}

export interface RoomAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string;
  buildingId?: string;
  onBedSelect: (
    bedId: string,
    roomId: string,
    roomCode: string,
    bedCode: string,
    buildingId: string,
    buildingName: string
  ) => void;
  currentSelection?: { bedId: string; roomId: string };
}

// Generate mock rooms with floors
const generateMockFloors = (buildingId: string): FloorData[] => {
  const roomTypes = ["Standard", "VIP", "VVIP"];
  const genders: ("L" | "P" | "mix")[] = ["L", "P", "mix"];
  const bedStatuses: BedStatus[] = [
    "available",
    "occupied",
    "booked",
    "available",
    "available",
  ];

  const floors: FloorData[] = [];
  const totalFloors = 3;

  for (let f = 1; f <= totalFloors; f++) {
    const rooms: RoomData[] = [];
    const roomsPerFloor = f === 1 ? 6 : f === 2 ? 4 : 2; // lantai 1 lebih banyak

    for (let i = 1; i <= roomsPerFloor; i++) {
      const roomNumber = f * 100 + i;
      const bedCount = f === 3 ? 2 : 4; // VIP floor (lantai 3) hanya 2 bed
      const beds: BedData[] = [];

      for (let j = 0; j < bedCount; j++) {
        const status =
          bedStatuses[Math.floor(Math.random() * bedStatuses.length)];
        beds.push({
          id: `${buildingId}-f${f}-r${i}-b${j}`,
          code: String.fromCharCode(65 + j),
          status,
          occupantName: status === "occupied" ? "Ahmad Rizki" : undefined,
          bookingId: status === "booked" ? `BK-${roomNumber}${j}` : undefined,
        });
      }

      rooms.push({
        id: `${buildingId}-f${f}-r${i}`,
        code: `${roomNumber}`,
        type:
          f === 3
            ? "VIP"
            : f === 2
            ? roomTypes[i % 2 === 0 ? 1 : 0]
            : "Standard",
        gender: genders[i % 3],
        floor: f,
        beds,
      });
    }

    floors.push({
      level: f,
      name:
        f === 1
          ? "Lantai 1 - Standard"
          : f === 2
          ? "Lantai 2 - Mixed"
          : "Lantai 3 - VIP",
      rooms,
    });
  }

  return floors;
};

export function RoomAvailabilityDialog({
  isOpen,
  onClose,
  areaId,
  buildingId: initialBuildingId,
  onBedSelect,
  currentSelection,
}: RoomAvailabilityDialogProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState(
    initialBuildingId || ""
  );
  const initialSelectedBed = useMemo(() => 
    currentSelection
      ? {
          bedId: currentSelection.bedId,
          roomId: currentSelection.roomId,
          roomCode: "",
          bedCode: "",
        }
      : null
  , [currentSelection]);

  const [selectedBed, setSelectedBed] = useState<{
    bedId: string;
    roomId: string;
    roomCode: string;
    bedCode: string;
  } | null>(initialSelectedBed);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("available");

  const buildings = MOCK_BUILDINGS.filter((b) => b.areaId === areaId);
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const floors = useMemo(() => 
    selectedBuildingId ? generateMockFloors(selectedBuildingId) : []
  , [selectedBuildingId]);

  const handleBuildingChange = useCallback((buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedBed(null);
  }, []);

  // Get all rooms flat for filtering
  const allRooms = useMemo(() => floors.flatMap((f) => f.rooms), [floors]);
  const roomTypes = useMemo(
    () => Array.from(new Set(allRooms.map((r) => r.type))),
    [allRooms]
  );

  // Filter floors and rooms
  const filteredFloors = useMemo(() => {
    return floors
      .filter(
        (floor) =>
          filterFloor === "all" || floor.level.toString() === filterFloor
      )
      .map((floor) => ({
        ...floor,
        rooms: floor.rooms.filter((room) => {
          if (searchQuery && !room.code.includes(searchQuery)) return false;
          if (filterGender !== "all" && room.gender !== filterGender)
            return false;
          if (filterType !== "all" && room.type !== filterType) return false;
          if (filterStatus === "available") {
            return room.beds.some((b) => b.status === "available");
          }
          return true;
        }),
      }))
      .filter((floor) => floor.rooms.length > 0);
  }, [
    floors,
    filterFloor,
    searchQuery,
    filterGender,
    filterType,
    filterStatus,
  ]);

  const handleBedClick = (bed: BedData, room: RoomData) => {
    if (bed.status === "available") {
      setSelectedBed({
        bedId: bed.id,
        roomId: room.id,
        roomCode: room.code,
        bedCode: bed.code,
      });
    }
  };

  const handleConfirm = () => {
    if (selectedBed && selectedBuilding) {
      onBedSelect(
        selectedBed.bedId,
        selectedBed.roomId,
        selectedBed.roomCode,
        selectedBed.bedCode,
        selectedBuildingId,
        selectedBuilding.name
      );
      onClose();
    }
  };

  const getGenderShort = (gender: string) => {
    if (gender === "L") return "L";
    if (gender === "P") return "P";
    return "Mix";
  };

  const _getGenderColor = (gender: string) => {
    if (gender === "L")
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    if (gender === "P")
      return "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400";
    return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400";
  };
  void _getGenderColor;

  const getBedColor = (status: BedStatus, isSelected: boolean) => {
    if (isSelected) return "bg-primary text-primary-foreground";
    switch (status) {
      case "available":
        return "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer";
      case "occupied":
        return "bg-rose-400 text-white cursor-not-allowed";
      case "booked":
        return "bg-amber-400 text-white cursor-not-allowed";
      case "maintenance":
        return "bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-200";
    }
  };

  const getBedTooltip = (bed: BedData, room: RoomData) => {
    const genderLabel =
      room.gender === "L" ? "Pria" : room.gender === "P" ? "Wanita" : "Campur";
    const roomInfo = `Kamar ${room.code} | ${room.type} | ${genderLabel}`;

    switch (bed.status) {
      case "available":
        return { title: `Bed ${bed.code} - Tersedia`, desc: roomInfo };
      case "occupied":
        return {
          title: `Bed ${bed.code} - Terisi`,
          desc: `${roomInfo}\nPenghuni: ${bed.occupantName || "-"}`,
        };
      case "booked":
        return {
          title: `Bed ${bed.code} - Sudah Dibooking`,
          desc: `${roomInfo}\nBooking: ${bed.bookingId}`,
        };
      case "maintenance":
        return { title: `Bed ${bed.code} - Maintenance`, desc: roomInfo };
      default:
        return { title: `Bed ${bed.code}`, desc: roomInfo };
    }
  };

  // Count available beds
  const totalAvailable = useMemo(() => {
    return allRooms.reduce(
      (sum, room) =>
        sum + room.beds.filter((b) => b.status === "available").length,
      0
    );
  }, [allRooms]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bed className="h-4 w-4" />
              Pilih Kamar & Bed
              {selectedBuildingId && (
                <Badge variant="secondary" className="text-xs">
                  {totalAvailable} bed tersedia
                </Badge>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Building Selection - Compact */}
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs font-medium shrink-0">Gedung:</Label>
              {buildings.map((building) => (
                <button
                  key={building.id}
                  type="button"
                  onClick={() => handleBuildingChange(building.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                    selectedBuildingId === building.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {building.name}
                  <span className="ml-1.5 opacity-70">
                    ({building.availableBeds})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedBuildingId && (
            <>
              {/* Filters - Single Row with Floor */}
              <div className="p-3 border-b flex gap-2 flex-wrap items-center">
                <div className="relative w-28">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Kode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <Select value={filterFloor} onValueChange={setFilterFloor}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Lantai</SelectItem>
                    {floors.map((floor) => (
                      <SelectItem
                        key={floor.level}
                        value={floor.level.toString()}
                      >
                        Lt. {floor.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Gender</SelectItem>
                    <SelectItem value="L">Pria</SelectItem>
                    <SelectItem value="P">Wanita</SelectItem>
                    <SelectItem value="mix">Campur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tipe</SelectItem>
                    {roomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="all">Semua</SelectItem>
                  </SelectContent>
                </Select>

                {/* Legend */}
                <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />{" "}
                    Tersedia
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Booked
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-400" /> Terisi
                  </span>
                </div>
              </div>

              {/* Floors & Rooms */}
              <div className="p-3 space-y-4">
                {filteredFloors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Tidak ada kamar ditemukan
                  </div>
                ) : (
                  filteredFloors.map((floor) => {
                    const floorAvailable = floor.rooms.reduce(
                      (sum, room) =>
                        sum +
                        room.beds.filter((b) => b.status === "available")
                          .length,
                      0
                    );

                    return (
                      <div key={floor.level}>
                        {/* Floor Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                            <span>{floor.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {floorAvailable} tersedia
                          </Badge>
                        </div>

                        {/* Rooms - Flex wrap untuk efisiensi space */}
                        <div className="flex flex-wrap gap-2">
                          <TooltipProvider delayDuration={50}>
                            {floor.rooms.map((room) => {
                              const isRoomSelected =
                                selectedBed?.roomId === room.id;

                              return (
                                <div
                                  key={room.id}
                                  className={cn(
                                    "inline-flex items-center gap-2 border rounded-lg px-2.5 py-2 bg-card transition-all",
                                    isRoomSelected &&
                                      "ring-2 ring-primary border-primary bg-primary/5"
                                  )}
                                >
                                  {/* Room Info */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm">
                                      {room.code}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-5 px-1.5"
                                    >
                                      {room.type}
                                    </Badge>
                                    <span
                                      className={cn(
                                        "text-xs font-semibold",
                                        room.gender === "L"
                                          ? "text-blue-600"
                                          : room.gender === "P"
                                          ? "text-pink-600"
                                          : "text-purple-600"
                                      )}
                                    >
                                      {getGenderShort(room.gender)}
                                    </span>
                                  </div>

                                  {/* Divider */}
                                  <div className="w-px h-6 bg-border" />

                                  {/* Beds */}
                                  <div className="flex gap-1">
                                    {room.beds.map((bed) => {
                                      const isSelected =
                                        selectedBed?.bedId === bed.id;
                                      const tooltip = getBedTooltip(bed, room);
                                      return (
                                        <Tooltip key={bed.id}>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleBedClick(bed, room)
                                              }
                                              disabled={
                                                bed.status !== "available"
                                              }
                                              className={cn(
                                                "w-8 h-8 rounded text-xs font-bold transition-all flex items-center justify-center",
                                                getBedColor(
                                                  bed.status,
                                                  isSelected
                                                ),
                                                isSelected &&
                                                  "ring-2 ring-offset-1 ring-primary"
                                              )}
                                            >
                                              {bed.code}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="text-xs"
                                          >
                                            <p className="font-semibold">
                                              {tooltip.title}
                                            </p>
                                            <p className="text-muted-foreground whitespace-pre-line">
                                              {tooltip.desc}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {!selectedBuildingId && (
            <div className="p-8 text-center text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pilih gedung untuk melihat kamar</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 flex items-center justify-between bg-muted/30 shrink-0">
          <div className="text-sm">
            {selectedBed ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">
                  Kamar {selectedBed.roomCode} / Bed {selectedBed.bedCode}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                Klik bed hijau untuk memilih
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedBed}
              className="h-8 gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Pilih
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

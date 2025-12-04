"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Users,
  Bed,
  Check,
  X,
  Search,
  Filter,
  DoorOpen,
  DoorClosed,
  User,
  Building,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
type BedStatus = "available" | "occupied" | "booked" | "maintenance";
type RoomStatus = "available" | "full" | "partially_occupied" | "maintenance";

interface BedData {
  id: string;
  code: string;
  status: BedStatus;
  occupantName?: string;
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomId: string;
  roomCode: string;
  price?: number;
  notes?: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  occupied: number;
  status: RoomStatus;
  price: number;
  isMixGender: boolean;
  isBookable: boolean;
  isOnlyForEmployee: boolean;
  description: string;
  gender?: "male" | "female" | "mix";
  floorId: string;
  floorLevel: number;
  beds: BedData[];
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
  userType?: "employee" | "guest";
}

// Mock data fetcher dengan data yang lebih lengkap
const fetchFloorsData = async (
  buildingId: string,
  userType: "employee" | "guest" = "employee"
): Promise<Floor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const floors: Floor[] = [
        {
          id: "f1",
          name: "Lantai 1 - Standard",
          level: 1,
          rooms: [
            {
              id: "r1-1",
              code: "R-101",
              name: "Kamar Standard Laki-laki",
              type: "Standard",
              capacity: 4,
              occupied: 2,
              status: "partially_occupied",
              price: 150000,
              isMixGender: false,
              isBookable: true,
              isOnlyForEmployee: false,
              description: "Kamar standar dengan AC dan kamar mandi dalam",
              gender: "male",
              floorId: "f1",
              floorLevel: 1,
              beds: [
                {
                  id: "bed-101-a",
                  code: "A",
                  status: "available",
                  roomId: "r1-1",
                  roomCode: "R-101",
                  price: 150000,
                },
                {
                  id: "bed-101-b",
                  code: "B",
                  status: "occupied",
                  occupantName: "Ahmad Rizki",
                  roomId: "r1-1",
                  roomCode: "R-101",
                  price: 150000,
                  checkInDate: "2024-01-10",
                  checkOutDate: "2024-01-20",
                },
                {
                  id: "bed-101-c",
                  code: "C",
                  status: "booked",
                  occupantName: "Budi Santoso",
                  bookingId: "BK-00123",
                  roomId: "r1-1",
                  roomCode: "R-101",
                  price: 150000,
                  checkInDate: "2024-01-25",
                  checkOutDate: "2024-01-30",
                },
                {
                  id: "bed-101-d",
                  code: "D",
                  status: "available",
                  roomId: "r1-1",
                  roomCode: "R-101",
                  price: 150000,
                },
              ],
            },
            {
              id: "r1-2",
              code: "R-102",
              name: "Kamar Standard Perempuan",
              type: "Standard",
              capacity: 3,
              occupied: 0,
              status: "available",
              price: 150000,
              isMixGender: false,
              isBookable: true,
              isOnlyForEmployee: false,
              description: "Kamar khusus perempuan dengan fasilitas lengkap",
              gender: "female",
              floorId: "f1",
              floorLevel: 1,
              beds: [
                {
                  id: "bed-102-a",
                  code: "A",
                  status: "available",
                  roomId: "r1-2",
                  roomCode: "R-102",
                  price: 150000,
                },
                {
                  id: "bed-102-b",
                  code: "B",
                  status: "available",
                  roomId: "r1-2",
                  roomCode: "R-102",
                  price: 150000,
                },
                {
                  id: "bed-102-c",
                  code: "C",
                  status: "available",
                  roomId: "r1-2",
                  roomCode: "R-102",
                  price: 150000,
                },
              ],
            },
            {
              id: "r1-3",
              code: "R-103",
              name: "Kamar Khusus Karyawan",
              type: "Employee Only",
              capacity: 2,
              occupied: 1,
              status: "partially_occupied",
              price: 120000,
              isMixGender: true,
              isBookable: true,
              isOnlyForEmployee: true,
              description: "Kamar khusus untuk karyawan perusahaan",
              gender: "mix",
              floorId: "f1",
              floorLevel: 1,
              beds: [
                {
                  id: "bed-103-a",
                  code: "A",
                  status: "occupied",
                  occupantName: "Rina Melati",
                  roomId: "r1-3",
                  roomCode: "R-103",
                  price: 120000,
                  checkInDate: "2024-01-05",
                  checkOutDate: "2024-02-05",
                },
                {
                  id: "bed-103-b",
                  code: "B",
                  status: "available",
                  roomId: "r1-3",
                  roomCode: "R-103",
                  price: 120000,
                },
              ],
            },
          ],
        },
        {
          id: "f2",
          name: "Lantai 2 - VIP",
          level: 2,
          rooms: [
            {
              id: "r2-1",
              code: "R-201",
              name: "Kamar VIP Single",
              type: "VIP",
              capacity: 1,
              occupied: 0,
              status: "available",
              price: 350000,
              isMixGender: false,
              isBookable: true,
              isOnlyForEmployee: false,
              description: "Kamar VIP dengan kamar mandi pribadi dan TV",
              gender: "male",
              floorId: "f2",
              floorLevel: 2,
              beds: [
                {
                  id: "bed-201-a",
                  code: "A",
                  status: "available",
                  roomId: "r2-1",
                  roomCode: "R-201",
                  price: 350000,
                },
              ],
            },
            {
              id: "r2-2",
              code: "R-202",
              name: "Kamar VIP Couple",
              type: "VIP Suite",
              capacity: 2,
              occupied: 2,
              status: "full",
              price: 500000,
              isMixGender: true,
              isBookable: true,
              isOnlyForEmployee: false,
              description: "Kamar suite untuk pasangan",
              gender: "mix",
              floorId: "f2",
              floorLevel: 2,
              beds: [
                {
                  id: "bed-202-a",
                  code: "A",
                  status: "occupied",
                  occupantName: "Andi & Rina",
                  roomId: "r2-2",
                  roomCode: "R-202",
                  price: 500000,
                },
                {
                  id: "bed-202-b",
                  code: "B",
                  status: "occupied",
                  occupantName: "Andi & Rina",
                  roomId: "r2-2",
                  roomCode: "R-202",
                  price: 500000,
                },
              ],
            },
            {
              id: "r2-3",
              code: "R-203",
              name: "Kamar Under Maintenance",
              type: "Standard",
              capacity: 2,
              occupied: 0,
              status: "maintenance",
              price: 150000,
              isMixGender: false,
              isBookable: false,
              isOnlyForEmployee: false,
              description: "Sedang dalam perbaikan",
              gender: "female",
              floorId: "f2",
              floorLevel: 2,
              beds: [
                {
                  id: "bed-203-a",
                  code: "A",
                  status: "maintenance",
                  roomId: "r2-3",
                  roomCode: "R-203",
                  price: 150000,
                  notes: "Under maintenance until 2024-02-01",
                },
                {
                  id: "bed-203-b",
                  code: "B",
                  status: "maintenance",
                  roomId: "r2-3",
                  roomCode: "R-203",
                  price: 150000,
                },
              ],
            },
          ],
        },
      ];

      // Filter berdasarkan user type
      const filteredFloors = floors
        .map((floor) => ({
          ...floor,
          rooms: floor.rooms.filter((room) => {
            if (userType === "guest" && room.isOnlyForEmployee) {
              return false;
            }
            return true;
          }),
        }))
        .filter((floor) => floor.rooms.length > 0);

      resolve(filteredFloors);
    }, 400);
  });
};

const BedCard = ({
  bed,
  selected,
  onClick,
  disabled = false,
}: {
  bed: BedData;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => {
  const getBedConfig = () => {
    if (selected) {
      return {
        color: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-700",
        textColor: "text-white",
        iconColor: "text-white",
        label: "Dipilih",
        icon: Check,
        border: "border-2 border-blue-700 shadow-lg shadow-blue-500/25",
      };
    }

    if (disabled) {
      return {
        color:
          "bg-slate-100 border-slate-300 dark:bg-slate-800/50 dark:border-slate-700",
        textColor: "text-slate-500 dark:text-slate-400",
        iconColor: "text-slate-400",
        label: "Tidak Tersedia",
        icon: XCircle,
        border: "border border-slate-300",
      };
    }

    switch (bed.status) {
      case "available":
        return {
          color:
            "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
          textColor: "text-emerald-800 dark:text-emerald-300",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          label: "Tersedia",
          icon: CheckCircle,
          border:
            "border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-500",
        };
      case "occupied":
        return {
          color:
            "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20",
          textColor: "text-rose-800 dark:text-rose-300",
          iconColor: "text-rose-600 dark:text-rose-400",
          label: "Terisi",
          icon: User,
          border: "border-2 border-rose-300 dark:border-rose-700",
        };
      case "booked":
        return {
          color:
            "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
          textColor: "text-amber-800 dark:text-amber-300",
          iconColor: "text-amber-600 dark:text-amber-400",
          label: "Booked",
          icon: Calendar,
          border: "border-2 border-amber-300 dark:border-amber-700",
        };
      case "maintenance":
        return {
          color:
            "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20",
          textColor: "text-slate-700 dark:text-slate-400",
          iconColor: "text-slate-500",
          label: "Maintenance",
          icon: AlertCircle,
          border: "border-2 border-slate-300 dark:border-slate-600",
        };
      default:
        return {
          color: "bg-gradient-to-br from-gray-50 to-gray-100",
          textColor: "text-gray-700",
          iconColor: "text-gray-500",
          label: "Unknown",
          icon: Bed,
          border: "border border-gray-300",
        };
    }
  };

  const config = getBedConfig();
  const Icon = config.icon;
  const isClickable = bed.status === "available" && !disabled;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={isClickable ? onClick : undefined}
            className={cn(
              "relative p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center min-h-[95px]",
              config.color,
              config.border,
              isClickable &&
                "cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {selected && (
              <div className="absolute -top-2 -right-2 p-1.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg z-10">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}

            <div
              className={cn(
                "p-2 rounded-full mb-2",
                selected ? "bg-white/20" : "bg-white/80 dark:bg-black/20"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  selected ? "text-white" : config.iconColor
                )}
              />
            </div>

            <p className={cn("font-bold text-sm", config.textColor)}>
              Bed {bed.code}
            </p>

            <p
              className={cn(
                "text-xs font-medium mt-1 px-2 py-0.5 rounded-full",
                selected
                  ? "bg-white/30 text-white"
                  : "bg-white/50 dark:bg-black/20"
              )}
            >
              {config.label}
            </p>

            {bed.price && (
              <p
                className={cn("text-xs font-semibold mt-1.5", config.textColor)}
              >
                Rp {bed.price.toLocaleString()}
              </p>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Bed {bed.code}</p>
            <p className="text-xs">Status: {config.label}</p>
            {bed.occupantName && (
              <p className="text-xs">Penghuni: {bed.occupantName}</p>
            )}
            {bed.bookingId && (
              <p className="text-xs">Booking ID: {bed.bookingId}</p>
            )}
            {bed.checkInDate && (
              <p className="text-xs">Check-in: {bed.checkInDate}</p>
            )}
            {bed.price && (
              <p className="text-xs font-medium">
                Harga: Rp {bed.price.toLocaleString()}/malam
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const RoomCard = ({
  room,
  selectedBedId,
  onBedSelect,
  userType = "employee",
}: {
  room: Room;
  selectedBedId?: string;
  onBedSelect: (bed: BedData) => void;
  userType?: "employee" | "guest";
}) => {
  const availableBeds = room.beds.filter((b) => b.status === "available");
  const bookedBeds = room.beds.filter((b) => b.status === "booked");
  const occupiedBeds = room.beds.filter((b) => b.status === "occupied");

  const isDisabledForUser = userType === "guest" && room.isOnlyForEmployee;
  const isRoomAvailable =
    room.status === "available" || room.status === "partially_occupied";
  const isBookable = room.isBookable && !isDisabledForUser && isRoomAvailable;

  const getStatusConfig = () => {
    switch (room.status) {
      case "available":
        return {
          label: "Tersedia",
          color:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
          icon: DoorOpen,
        };
      case "full":
        return {
          label: "Penuh",
          color:
            "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
          icon: DoorClosed,
        };
      case "partially_occupied":
        return {
          label: "Tersedia",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          icon: DoorOpen,
        };
      case "maintenance":
        return {
          label: "Perbaikan",
          color:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
          icon: AlertCircle,
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800",
          icon: DoorOpen,
        };
    }
  };

  const getGenderConfig = () => {
    if (room.isMixGender) {
      return {
        label: "Campur",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      };
    }
    switch (room.gender) {
      case "male":
        return {
          label: "Laki-laki",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        };
      case "female":
        return {
          label: "Perempuan",
          color:
            "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
        };
      default:
        return { label: "Campur", color: "bg-purple-100 text-purple-800" };
    }
  };

  const statusConfig = getStatusConfig();
  const genderConfig = getGenderConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg",
        !isBookable && "opacity-70",
        selectedBedId &&
          room.beds.some((b) => b.id === selectedBedId) &&
          "ring-2 ring-blue-500"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-bold">{room.code}</CardTitle>
              {room.isOnlyForEmployee && (
                <Badge
                  variant="outline"
                  className="h-5 text-xs bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-300"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Karyawan
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-1">
              {room.name}
            </CardDescription>
          </div>
          <Badge className={cn("h-6 text-xs font-medium", statusConfig.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipe</p>
            <p className="text-sm font-medium">{room.type}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Gender</p>
            <Badge
              variant="outline"
              className={cn("h-5 text-xs", genderConfig.color)}
            >
              {genderConfig.label}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Kapasitas</p>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                {room.capacity - room.occupied}/{room.capacity} Bed
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Harga</p>
            <p className="text-sm font-medium text-primary">
              Rp {room.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bed Status Summary */}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-medium mb-2">Status Bed</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                {availableBeds.length}
              </div>
              <div className="text-xs text-muted-foreground">Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">
                {bookedBeds.length}
              </div>
              <div className="text-xs text-muted-foreground">Booked</div>
            </div>
            <div className="text-center">
              <div className="text-rose-600 dark:text-rose-400 font-bold text-lg">
                {occupiedBeds.length}
              </div>
              <div className="text-xs text-muted-foreground">Terisi</div>
            </div>
          </div>
        </div>

        {/* Beds Grid */}
        {isBookable ? (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Pilih Bed:</p>
              <div
                className={cn(
                  "grid gap-2",
                  room.capacity <= 2 ? "grid-cols-2" : "grid-cols-3"
                )}
              >
                {room.beds.map((bed) => (
                  <BedCard
                    key={bed.id}
                    bed={bed}
                    selected={selectedBedId === bed.id}
                    onClick={() => onBedSelect(bed)}
                    disabled={!isBookable || bed.status !== "available"}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDisabledForUser
                ? "Hanya untuk karyawan"
                : "Tidak tersedia untuk booking"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function RoomAvailabilityDialog({
  isOpen,
  onClose,
  buildingId,
  onBedSelect,
  currentSelection,
  userType = "employee",
}: RoomAvailabilityDialogProps) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<string | undefined>(
    currentSelection?.bedId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("available");

  useEffect(() => {
    if (buildingId && isOpen) {
      setLoading(true);
      fetchFloorsData(buildingId, userType).then((data) => {
        setFloors(data);
        setLoading(false);
      });
    }
  }, [buildingId, isOpen, userType]);

  useEffect(() => {
    setSelectedBed(currentSelection?.bedId);
  }, [currentSelection]);

  const handleBedClick = (bed: BedData) => {
    if (bed.status === "available") {
      setSelectedBed(bed.id);
    }
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

  // Filter rooms
  const filteredFloors = floors
    .map((floor) => ({
      ...floor,
      rooms: floor.rooms.filter((room) => {
        // Search filter
        const matchesSearch =
          searchQuery === "" ||
          room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Gender filter
        const matchesGender =
          filterGender === "all" ||
          (filterGender === "male" && room.gender === "male") ||
          (filterGender === "female" && room.gender === "female") ||
          (filterGender === "mix" &&
            (room.isMixGender || room.gender === "mix"));

        // Status filter
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "available" &&
            (room.status === "available" ||
              room.status === "partially_occupied")) ||
          (filterStatus === "full" && room.status === "full") ||
          (filterStatus === "employee" && room.isOnlyForEmployee);

        return matchesSearch && matchesGender && matchesStatus;
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

  const selectedBedData = selectedBed
    ? floors
        .flatMap((f) => f.rooms)
        .flatMap((r) => r.beds)
        .find((b) => b.id === selectedBed)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[1200px] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6" />
                Ketersediaan Kamar & Bed
              </DialogTitle>
              <DialogDescription className="mt-2">
                Pilih kamar dan bed yang tersedia. Harga sudah termasuk
                fasilitas standar.
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Total Tersedia
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {totalAvailableBeds} Bed
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filters & Search */}
        <div className="px-6 pb-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari kode atau nama kamar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="h-10">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gender</SelectItem>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                    <SelectItem value="mix">Campur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="full">Penuh</SelectItem>
                    <SelectItem value="employee">Khusus Karyawan</SelectItem>
                    <SelectItem value="all">Semua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-[320px] w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFloors.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Tidak Ditemukan</h3>
              <p className="text-muted-foreground mb-4">
                Tidak ada kamar yang sesuai dengan filter Anda
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterGender("all");
                  setFilterStatus("available");
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredFloors.map((floor) => (
                <div key={floor.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{floor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {floor.rooms.length} kamar tersedia di lantai ini
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floor.rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        selectedBedId={selectedBed}
                        onBedSelect={handleBedClick}
                        userType={userType}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Selection Summary */}
        <div className="border-t px-6 py-4 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {selectedBedData ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold">Bed Terpilih:</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      {selectedBedData.roomCode} - Bed {selectedBedData.code}
                    </Badge>
                    {selectedBedData.price && (
                      <span className="font-medium">
                        Rp {selectedBedData.price.toLocaleString()}/malam
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>Pilih bed yang tersedia untuk melanjutkan</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="min-w-[100px]"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedBed}
                className="min-w-[140px] gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                <Check className="h-4 w-4" />
                Pilih Bed
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

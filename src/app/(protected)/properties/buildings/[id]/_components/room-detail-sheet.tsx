"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  User,
  CreditCard,
  Clock,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Occupant {
  id: string;
  name: string;
  nik: string;
  gender: "Male" | "Female";
  checkInDate: string;
  checkOutDate?: string;
  department: string;
  avatar?: string;
}

interface RoomDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    code: string;
    name: string;
    type: string;
    capacity: number;
    occupied: number;
    status: string;
  } | null;
}

// Mock Data Generator
const getMockOccupants = (count: number): Occupant[] => {
  const names = [
    "Budi Santoso",
    "Siti Aminah",
    "Rudi Hermawan",
    "Dewi Sartika",
    "Ahmad Yani",
    "Rina Wati",
    "Eko Prasetyo",
    "Maya Indah",
  ];
  const departments = [
    "Mining Operation",
    "Plant Maintenance",
    "Human Resources",
    "Safety & Environment",
    "General Affairs",
  ];

  return Array.from({ length: count }).map((_, i) => ({
    id: `occ-${i}`,
    name: names[Math.floor(Math.random() * names.length)],
    nik: `D${2024000 + i}`,
    gender: Math.random() > 0.5 ? "Male" : "Female",
    checkInDate: "2024-01-15",
    checkOutDate: Math.random() > 0.7 ? "2024-12-31" : undefined,
    department: departments[Math.floor(Math.random() * departments.length)],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
  }));
};

export function RoomDetailSheet({
  isOpen,
  onClose,
  room,
}: RoomDetailSheetProps) {
  if (!room) return null;

  const occupants = getMockOccupants(room.occupied);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{room.name}</SheetTitle>
              <SheetDescription>
                Kode: {room.code} • Tipe: {room.type}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Room Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Kapasitas</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{room.capacity}</span>
                <span className="text-sm text-muted-foreground">Orang</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Terisi</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{room.occupied}</span>
                <span className="text-sm text-muted-foreground">Orang</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Occupants List */}
          <div className="p-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Daftar Penghuni
            </h3>
            <ScrollArea className="h-[400px] pr-4">
              {occupants.length > 0 ? (
                <div className="space-y-4">
                  {occupants.map((occupant) => (
                    <div
                      key={occupant.id}
                      className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={occupant.avatar} />
                        <AvatarFallback>
                          {occupant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {occupant.name}
                          </p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Lihat Profil</DropdownMenuItem>
                              <DropdownMenuItem>Pindahkan</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Check Out
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          <span>{occupant.nik}</span>
                          <span>•</span>
                          <span>{occupant.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {occupant.gender === "Male" ? "Laki-laki" : "Perempuan"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Masuk
                            </span>
                            <span className="text-xs font-medium">
                              {occupant.checkInDate}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <LogOut className="h-3 w-3" /> Keluar
                            </span>
                            <span className="text-xs font-medium">
                              {occupant.checkOutDate || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada penghuni di kamar ini.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

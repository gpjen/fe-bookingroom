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
import { Separator } from "@/components/ui/separator";
import {
  DoorOpen,
  Bed,
  Users,
  Edit,
  Plus,
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
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  OCCUPIED: {
    label: "Terisi",
    icon: Users,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  RESERVED: {
    label: "Reserved",
    icon: Clock,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  BLOCKED: {
    label: "Diblokir",
    icon: Ban,
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

// ========================================
// BED CARD
// ========================================

interface BedCardProps {
  bed: BedData;
  onClick?: () => void;
}

function BedCard({ bed, onClick }: BedCardProps) {
  const config = bedStatusConfig[bed.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow",
        bed.status === "AVAILABLE" && "hover:border-emerald-400"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-muted-foreground">
          {bed.code}
        </span>
        <Badge
          variant="outline"
          className={cn("text-[10px]", config.className)}
        >
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>
      <p className="font-medium text-sm">{bed.label}</p>
      {bed.bedType && (
        <p className="text-xs text-muted-foreground">{bed.bedType}</p>
      )}
      {bed.notes && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {bed.notes}
        </p>
      )}
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
}

export function RoomDetailSheet({
  room,
  open,
  onOpenChange,
}: RoomDetailSheetProps) {
  if (!room) return null;

  const bedsAvailable = room.beds.filter(
    (b) => b.status === "AVAILABLE"
  ).length;
  const bedsOccupied = room.beds.filter((b) => b.status === "OCCUPIED").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{room.name}</SheetTitle>
              <SheetDescription className="font-mono">
                {room.code}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border rounded-lg p-3 text-center">
            <Bed className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{room.beds.length}</p>
            <p className="text-xs text-muted-foreground">Total Bed</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-blue-600">{bedsOccupied}</p>
            <p className="text-xs text-muted-foreground">Terisi</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-600">
              {bedsAvailable}
            </p>
            <p className="text-xs text-muted-foreground">Tersedia</p>
          </div>
        </div>

        {/* Room Info */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold text-sm">Informasi Ruangan</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Tipe Ruangan</span>
              <p className="font-medium">{room.roomType.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Lantai</span>
              <p className="font-medium">
                {room.floorName || `Lantai ${room.floorNumber}`}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Gender Policy</span>
              <p className="font-medium">
                {room.genderPolicy === "MALE_ONLY"
                  ? "Pria Saja"
                  : room.genderPolicy === "FEMALE_ONLY"
                  ? "Wanita Saja"
                  : room.genderPolicy === "MIX"
                  ? "Campuran"
                  : "Flexible"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium">
                <Badge
                  variant="outline"
                  className={cn(
                    room.status === "ACTIVE"
                      ? "border-emerald-500 text-emerald-600"
                      : room.status === "MAINTENANCE"
                      ? "border-amber-500 text-amber-600"
                      : "border-slate-400 text-slate-600"
                  )}
                >
                  {room.status === "ACTIVE"
                    ? "Aktif"
                    : room.status === "MAINTENANCE"
                    ? "Maintenance"
                    : "Tidak Aktif"}
                </Badge>
              </p>
            </div>
          </div>
          {room.description && (
            <div>
              <span className="text-muted-foreground text-sm">Deskripsi</span>
              <p className="text-sm">{room.description}</p>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Beds Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Daftar Bed</h4>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-3 w-3" />
              Tambah Bed
            </Button>
          </div>

          {room.beds.length === 0 ? (
            <div className="border rounded-lg p-6 text-center">
              <Bed className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada bed di ruangan ini
              </p>
              <Button variant="link" size="sm" className="mt-2">
                Tambah Bed Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {room.beds.map((bed) => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  onClick={() => {
                    // TODO: Handle bed click - show occupant or add occupant form
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1 gap-2">
            <Edit className="h-4 w-4" />
            Edit Ruangan
          </Button>
          <Button className="flex-1 gap-2">
            <Plus className="h-4 w-4" />
            Tambah Penghuni
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { Occupant } from "./occupants/types";
import { AddOccupantDialog } from "./occupants/add-occupant-dialog";
import { MoveOccupantDialog } from "./occupants/move-occupant-dialog";
import { OccupantItem } from "./occupants/occupant-item";

interface RoomOccupantsTabProps {
  roomId: string;
  capacity: number;
  occupied: number;
  bedCodes: string[];
}

// Mock Data Generator
const getMockOccupants = (count: number, bedCodes: string[]): Occupant[] => {
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
  ];
  const companies = ["PT Harita Nickel", "PT Lygend", "Vendor A", "Vendor B"];

  return Array.from({ length: count }).map((_, i) => {
    const type = i % 3 === 0 ? "employee" : i % 3 === 1 ? "guest" : "other";
    const isEmployee = type === "employee";

    return {
      id: `occ-${i}`,
      name: names[i % names.length],
      identifier: isEmployee ? `D${2024000 + i}` : `ID-${1000 + i}`,
      type: type as "employee" | "guest" | "other",
      gender: i % 2 === 0 ? "Male" : "Female",
      checkInDate: "2024-01-15",
      checkOutDate: i % 4 === 0 ? "2024-12-31" : undefined,
      department: isEmployee ? departments[i % departments.length] : undefined,
      company: isEmployee
        ? "PT Harita Nickel"
        : companies[i % companies.length],
      companionName: !isEmployee && i % 2 === 0 ? "Pendamping A" : undefined,
      companionId: !isEmployee && i % 2 === 0 ? "ID-999" : undefined,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      status: "Active",
      bedCode: bedCodes[i % bedCodes.length],
    };
  });
};

export function RoomOccupantsTab({
  roomId,
  capacity,
  occupied,
  bedCodes,
}: RoomOccupantsTabProps) {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOccupant, setSelectedOccupant] = useState<Occupant | null>(
    null
  );

  // Dialog States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    const fetchOccupants = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setOccupants(getMockOccupants(occupied, bedCodes));
      setIsLoading(false);
    };
    fetchOccupants();
  }, [roomId, occupied, bedCodes]);

  const handleCheckout = () => {
    toast.success("Check-out Berhasil", {
      description: `${selectedOccupant?.name} telah berhasil di-checkout.`,
    });
    setIsCheckoutOpen(false);
    setSelectedOccupant(null);
  };

  const handleAddOccupant = (data: { name: string }) => {
    toast.success("Penghuni Berhasil Ditambahkan", {
      description: `${data.name} telah ditambahkan ke kamar ini.`,
    });
    setIsAddOpen(false);
  };

  const handleMove = (data: { room?: string }) => {
    toast.success("Pindah Kamar Berhasil", {
      description: `${selectedOccupant?.name} dipindahkan ke ${
        data.room || "kamar baru"
      }.`,
    });
    setIsMoveOpen(false);
    setSelectedOccupant(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Daftar Penghuni ({occupants.length}/{capacity})
        </h3>
        {occupants.length < capacity && (
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-8 gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Penghuni
          </Button>
        )}
      </div>

      <ScrollArea className="pr-4">
        {occupants.length > 0 ? (
          <div className="space-y-3">
            {occupants.map((occupant) => (
              <OccupantItem
                key={occupant.id}
                occupant={occupant}
                onViewProfile={(occ) => setSelectedOccupant(occ)}
                onMove={(occ) => {
                  setSelectedOccupant(occ);
                  setIsMoveOpen(true);
                }}
                onCheckout={(occ) => {
                  setSelectedOccupant(occ);
                  setIsCheckoutOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Belum ada penghuni di kamar ini.</p>
            <Button
              variant="link"
              onClick={() => setIsAddOpen(true)}
              className="mt-2 text-primary"
            >
              + Tambah Penghuni
            </Button>
          </div>
        )}
      </ScrollArea>

      <AddOccupantDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={handleAddOccupant}
        bedCodes={bedCodes}
      />

      <MoveOccupantDialog
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        onMove={handleMove}
        occupant={selectedOccupant}
      />

      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan check-out untuk{" "}
              <b>{selectedOccupant?.name}</b>? Tindakan ini akan menghapus
              penghuni dari kamar ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCheckout}
              className="bg-destructive hover:bg-destructive/90"
            >
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

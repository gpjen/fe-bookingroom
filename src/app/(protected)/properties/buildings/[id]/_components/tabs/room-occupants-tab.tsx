"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  CreditCard,
  Clock,
  LogOut,
  MoreVertical,
  Users,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Occupant {
  id: string;
  name: string;
  nik: string;
  gender: "Male" | "Female";
  checkInDate: string;
  checkOutDate?: string;
  department: string;
  avatar?: string;
  status?: "Active" | "Checked Out";
}

interface RoomOccupantsTabProps {
  roomId: string;
  capacity: number;
  occupied: number;
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
    status: "Active",
  }));
};

export function RoomOccupantsTab({ roomId, capacity, occupied }: RoomOccupantsTabProps) {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOccupant, setSelectedOccupant] = useState<Occupant | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  useEffect(() => {
    const fetchOccupants = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOccupants(getMockOccupants(occupied));
      setIsLoading(false);
    };

    fetchOccupants();
  }, [roomId, occupied]);

  const handleCheckout = () => {
    toast.success("Check-out Berhasil", {
      description: `${selectedOccupant?.name} telah berhasil di-checkout dari kamar ini.`,
    });
    setIsCheckoutOpen(false);
    setSelectedOccupant(null);
    // In a real app, we would refresh the data here
  };

  const handleMove = () => {
    toast.success("Pindah Kamar Berhasil", {
      description: `${selectedOccupant?.name} telah dipindahkan ke kamar baru.`,
    });
    setIsMoveOpen(false);
    setSelectedOccupant(null);
    // In a real app, we would refresh the data here
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
          <Button size="sm" variant="outline" className="h-8">
            + Tambah Penghuni
          </Button>
        )}
      </div>

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
                        <DropdownMenuItem
                          onClick={() => {
                            toast.info(`Profil: ${occupant.name}`, {
                              description: `NIK: ${occupant.nik} | Dept: ${occupant.department}`,
                            });
                          }}
                        >
                          Lihat Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOccupant(occupant);
                            setIsMoveOpen(true);
                          }}
                        >
                          Pindahkan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedOccupant(occupant);
                            setIsCheckoutOpen(true);
                          }}
                        >
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
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Belum ada penghuni di kamar ini.</p>
            <Button variant="link" className="mt-2 text-primary">
              + Tambah Penghuni
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan check-out untuk <b>{selectedOccupant?.name}</b>? 
              Tindakan ini akan menghapus penghuni dari kamar ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Occupant Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindahkan Penghuni</DialogTitle>
            <DialogDescription>
              Pilih kamar tujuan untuk memindahkan <b>{selectedOccupant?.name}</b>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kamar Tujuan</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kamar tersedia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="r-102">Kamar 102 (Lantai 1)</SelectItem>
                  <SelectItem value="r-103">Kamar 103 (Lantai 1)</SelectItem>
                  <SelectItem value="r-201">Kamar 201 (Lantai 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Alasan Pemindahan</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Permintaan Sendiri</SelectItem>
                  <SelectItem value="maintenance">Perbaikan Kamar</SelectItem>
                  <SelectItem value="upgrade">Upgrade Kamar</SelectItem>
                  <SelectItem value="conflict">Konflik Penghuni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>Batal</Button>
            <Button onClick={handleMove}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

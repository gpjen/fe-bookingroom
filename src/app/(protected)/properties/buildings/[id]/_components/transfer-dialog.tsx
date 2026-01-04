"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  Building2,
  DoorOpen,
  Bed,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BedWithOccupancy } from "../_actions/occupancy.types";
import { transferOccupant } from "../_actions/occupancy.actions";
import {
  getBuildingsInArea,
  getRoomsWithAvailability,
  getBedsWithReservations,
  BuildingOption,
  RoomOption,
  BedOption,
} from "../_actions/transfer.actions";

// ========================================
// TYPES
// ========================================

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  onSuccess: () => void;
}

// ========================================
// TRANSFER DIALOG COMPONENT
// ========================================

export function TransferDialog({
  open,
  onOpenChange,
  bed,
  onSuccess,
}: TransferDialogProps) {
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading selection states
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [beds, setBeds] = useState<BedOption[]>([]);

  // Loading states
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // Selected values
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");

  // Date inputs
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [checkOutDate, setCheckOutDate] = useState("");

  // Reason
  const [reason, setReason] = useState("");

  // Today's date for min validation
  const today = new Date().toISOString().split("T")[0];

  // ========================================
  // LOAD BUILDINGS ON OPEN
  // ========================================

  useEffect(() => {
    if (open && bed) {
      const initialize = async () => {
        // Reset all states
        setBuildings([]);
        setRooms([]);
        setBeds([]);
        setSelectedBuildingId("");
        setSelectedRoomId("");
        setSelectedBedId("");
        setTransferDate(new Date().toISOString().split("T")[0]);
        setCheckOutDate("");
        setReason("");

        // Load buildings
        setLoadingBuildings(true);
        const result = await getBuildingsInArea(bed.id);
        if (result.success) {
          setBuildings(result.data);
        } else {
          toast.error(result.error);
        }
        setLoadingBuildings(false);
      };

      initialize();
    }
  }, [open, bed]);

  // ========================================
  // CHANGE HANDLERS (Avoid setState in useEffect)
  // ========================================

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setRooms([]);
    setBeds([]);
    setSelectedRoomId("");
    setSelectedBedId("");
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    setBeds([]);
    setSelectedBedId("");
  };

  // ========================================
  // LOAD ROOMS WHEN BUILDING SELECTED
  // ========================================

  useEffect(() => {
    if (selectedBuildingId && bed?.activeOccupancy) {
      const loadRooms = async () => {
        setLoadingRooms(true);
        const result = await getRoomsWithAvailability(
          selectedBuildingId,
          bed.activeOccupancy!.occupantGender
        );
        if (result.success) {
          setRooms(result.data);
        } else {
          toast.error(result.error);
        }
        setLoadingRooms(false);
      };

      loadRooms();
    }
  }, [selectedBuildingId, bed]);

  // ========================================
  // LOAD BEDS WHEN ROOM SELECTED
  // ========================================

  useEffect(() => {
    if (selectedRoomId) {
      const loadBeds = async () => {
        setLoadingBeds(true);
        const result = await getBedsWithReservations(selectedRoomId, bed?.id);
        if (result.success) {
          setBeds(result.data);
        } else {
          toast.error(result.error);
        }
        setLoadingBeds(false);
      };

      loadBeds();
    }
  }, [selectedRoomId, bed?.id]);

  // ========================================
  // GET SELECTED BED INFO
  // ========================================

  const selectedBedInfo = beds.find((b) => b.id === selectedBedId);

  // ========================================
  // HANDLE SUBMIT
  // ========================================

  const handleSubmit = async () => {
    if (!bed?.activeOccupancy || !selectedBedId) return;

    if (!reason.trim() || reason.trim().length < 3) {
      toast.error("Alasan transfer minimal 3 karakter");
      return;
    }

    // Validate dates
    if (checkOutDate && selectedBedInfo?.hasUpcomingReservation) {
      const endDate = new Date(checkOutDate);
      const nextRes = new Date(selectedBedInfo.nextReservationStart!);
      if (endDate >= nextRes) {
        toast.error(
          `Tanggal berakhir harus sebelum ${nextRes.toLocaleDateString(
            "id-ID"
          )}`
        );
        return;
      }
    }

    // If no end date but bed has upcoming reservation
    if (!checkOutDate && selectedBedInfo?.hasUpcomingReservation) {
      toast.error(
        "Tanggal berakhir wajib karena bed memiliki reservasi mendatang"
      );
      return;
    }

    setIsSubmitting(true);

    const result = await transferOccupant({
      occupancyId: bed.activeOccupancy.id,
      targetBedId: selectedBedId,
      transferDate: new Date(transferDate),
      newCheckOutDate: checkOutDate ? new Date(checkOutDate) : null,
      reason: reason.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Transfer berhasil");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  // ========================================
  // FORMAT HELPERS
  // ========================================

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (d.getFullYear() >= 2099) return "Tidak Terbatas";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getGenderLabel = (policy: string, current: string | null) => {
    if (policy === "MALE_ONLY") return "Pria";
    if (policy === "FEMALE_ONLY") return "Wanita";
    if (policy === "MIX") return "Campuran";
    if (policy === "FLEXIBLE") {
      return current === "MALE"
        ? "Pria"
        : current === "FEMALE"
        ? "Wanita"
        : "Flexible";
    }
    return policy;
  };

  // ========================================
  // RENDER
  // ========================================

  if (!bed?.activeOccupancy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Penghuni
          </DialogTitle>
          <DialogDescription>
            Pindahkan <strong>{bed.activeOccupancy.occupantName}</strong> dari{" "}
            <span className="font-mono">{bed.code}</span> ke bed lain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* STEP 1: SELECT BUILDING */}
          <div>
            <Label className="flex items-center gap-2 mb-1.5">
              <Building2 className="h-4 w-4" />
              1. Pilih Gedung
            </Label>
            {loadingBuildings ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat gedung...
              </div>
            ) : (
              <Select
                value={selectedBuildingId}
                onValueChange={handleBuildingChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gedung tujuan..." />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {b.name} ({b.code})
                        </span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {b.availableBeds} tersedia
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* STEP 2: SELECT ROOM */}
          {selectedBuildingId && (
            <div>
              <Label className="flex items-center gap-2 mb-1.5">
                <DoorOpen className="h-4 w-4" />
                2. Pilih Ruangan
              </Label>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat ruangan...
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada ruangan tersedia untuk gender{" "}
                  {bed.activeOccupancy.occupantGender === "MALE"
                    ? "Pria"
                    : "Wanita"}
                </p>
              ) : (
                <Select value={selectedRoomId} onValueChange={handleRoomChange}>
                  <SelectTrigger className="h-auto py-2">
                    <SelectValue placeholder="Pilih ruangan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(
                      rooms.reduce((acc, room) => {
                        const floor = room.floorNumber;
                        if (!acc[floor]) acc[floor] = [];
                        acc[floor].push(room);
                        return acc;
                      }, {} as Record<number, typeof rooms>)
                    ).map(([floor, floorRooms]) => (
                      <SelectGroup key={floor}>
                        <SelectLabel className="sticky top-0 bg-popover z-10 px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          Lantai {floor}
                        </SelectLabel>
                        {floorRooms.map((r) => (
                          <SelectItem
                            key={r.id}
                            value={r.id}
                            className="py-2 cursor-pointer focus:bg-accent"
                          >
                            <div className="flex items-center justify-between w-full gap-4">
                              <div className="flex flex-col items-start gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {r.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-[10px] h-4 px-1 leading-none"
                                  >
                                    {r.code}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {r.roomTypeName} ·{" "}
                                  {getGenderLabel(
                                    r.genderPolicy,
                                    r.currentGender
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[10px] h-5",
                                    r.availableBeds === 0 &&
                                      "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {r.availableBeds} / {r.totalBeds} Bed
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* STEP 3: SELECT BED */}
          {selectedRoomId && (
            <div>
              <Label className="flex items-center gap-2 mb-1.5">
                <Bed className="h-4 w-4" />
                3. Pilih Bed
              </Label>
              {loadingBeds ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat bed...
                </div>
              ) : (
                <RadioGroup
                  value={selectedBedId}
                  onValueChange={setSelectedBedId}
                >
                  <div className="space-y-2">
                    {beds.map((b) => {
                      const isAvailable = b.status === "AVAILABLE";
                      const hasReservation = b.hasUpcomingReservation;

                      return (
                        <div
                          key={b.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border",
                            isAvailable
                              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40 opacity-60"
                          )}
                        >
                          <RadioGroupItem
                            value={b.id}
                            id={b.id}
                            disabled={!isAvailable}
                          />
                          <Label
                            htmlFor={b.id}
                            className={cn(
                              "flex-1 cursor-pointer",
                              !isAvailable && "cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono text-xs">
                                  {b.code}
                                </span>
                                <span className="mx-1.5">-</span>
                                <span>{b.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAvailable ? (
                                  hasReservation ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-amber-500 text-amber-600"
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      s.d {formatDate(b.availableUntil)}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-green-500 text-green-600"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Tersedia
                                    </Badge>
                                  )
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-gray-400 text-gray-500"
                                  >
                                    Terisi
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {hasReservation && (
                              <p className="text-[10px] text-amber-600 mt-1">
                                ⚠ Reservasi {b.nextReservationOccupant} mulai{" "}
                                {formatDate(b.nextReservationStart)}
                              </p>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}
            </div>
          )}

          {/* STEP 4: DATES */}
          {selectedBedId && (
            <div>
              <Label className="flex items-center gap-2 mb-1.5">
                4. Tanggal Transfer
              </Label>

              {/* Warning if bed has upcoming reservation */}
              {selectedBedInfo?.hasUpcomingReservation && (
                <div className="mb-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Bed tersedia hingga{" "}
                    {formatDate(selectedBedInfo.availableUntil)}. Tanggal
                    berakhir wajib diisi.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Mulai Transfer *
                  </Label>
                  <Input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    min={today}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Berakhir{" "}
                    {selectedBedInfo?.hasUpcomingReservation
                      ? "*"
                      : "(opsional)"}
                  </Label>
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={transferDate}
                    max={
                      selectedBedInfo?.availableUntil
                        ? new Date(selectedBedInfo.availableUntil)
                            .toISOString()
                            .split("T")[0]
                        : undefined
                    }
                    className="mt-1"
                  />
                  {!selectedBedInfo?.hasUpcomingReservation && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Kosongkan jika belum ditentukan
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REASON */}
          {selectedBedId && (
            <div>
              <Label>5. Alasan Transfer *</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mengapa penghuni dipindahkan?"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedBedId ||
              !reason.trim() ||
              (selectedBedInfo?.hasUpcomingReservation && !checkOutDate)
            }
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

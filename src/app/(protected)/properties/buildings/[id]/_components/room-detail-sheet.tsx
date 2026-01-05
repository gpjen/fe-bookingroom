"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DoorOpen,
  Bed,
  User,
  Edit,
  History,
  CheckCircle2,
  Clock,
  Ban,
  Wrench,
  UserPlus,
  LogIn,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RoomData } from "../_actions/building-detail.schema";
import {
  BedWithOccupancy,
  AssignOccupantInput,
  OccupancyLogData,
  OccupancyLogAction,
} from "../_actions/occupancy.types";
import {
  getBedsWithOccupancy,
  assignOccupant,
  checkInOccupant,
  checkOutOccupant,
  cancelOccupancy,
  getRoomHistory,
} from "../_actions/occupancy.actions";
import { TransferDialog } from "./transfer-dialog";

// ========================================
// BED STATUS CONFIG
// ========================================

const bedStatusConfig = {
  AVAILABLE: {
    label: "Tersedia",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  OCCUPIED: {
    label: "Terisi",
    icon: User,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  RESERVED: {
    label: "Dipesan",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-800",
  },
  BLOCKED: {
    label: "Diblokir",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
  },
};

// ========================================
// ASSIGN OCCUPANT DIALOG
// ========================================

interface AssignOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  roomGenderPolicy: string;
  onSuccess: () => void;
}

function AssignOccupantDialog({
  open,
  onOpenChange,
  bed,
  roomGenderPolicy,
  onSuccess,
}: AssignOccupantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute initial state based on props (no useEffect needed)
  const initialFormData = useMemo(() => {
    const defaultGender =
      roomGenderPolicy === "MALE_ONLY"
        ? "MALE"
        : roomGenderPolicy === "FEMALE_ONLY"
        ? "FEMALE"
        : "MALE";

    return {
      occupantType: "EMPLOYEE" as "EMPLOYEE" | "GUEST",
      occupantName: "",
      occupantNik: "",
      occupantGender: defaultGender as "MALE" | "FEMALE",
      occupantPhone: "",
      occupantEmail: "",
      occupantCompany: "",
      occupantDepartment: "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkOutDate: "",
      autoCheckIn: true,
      notes: "",
    };
  }, [roomGenderPolicy]);

  const [formData, setFormData] = useState(initialFormData);

  // Reset form when dialog closes and opens again
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setFormData(initialFormData);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!bed) return;

    if (!formData.occupantName.trim()) {
      toast.error("Nama penghuni wajib diisi");
      return;
    }

    setIsSubmitting(true);

    const input: AssignOccupantInput = {
      bedId: bed.id,
      occupantType: formData.occupantType,
      occupantName: formData.occupantName.trim(),
      occupantNik: formData.occupantNik.trim() || null,
      occupantGender: formData.occupantGender,
      occupantPhone: formData.occupantPhone.trim() || null,
      occupantEmail: formData.occupantEmail.trim() || null,
      occupantCompany: formData.occupantCompany.trim() || null,
      occupantDepartment: formData.occupantDepartment.trim() || null,
      checkInDate: new Date(formData.checkInDate),
      checkOutDate: formData.checkOutDate
        ? new Date(formData.checkOutDate)
        : null,
      autoCheckIn: formData.autoCheckIn,
      notes: formData.notes.trim() || null,
    };

    const result = await assignOccupant(input);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        formData.autoCheckIn
          ? "Penghuni berhasil check-in"
          : "Reservasi berhasil dibuat"
      );
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  const canChangeGender =
    roomGenderPolicy === "MIX" || roomGenderPolicy === "FLEXIBLE";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tambah Penghuni
          </DialogTitle>
          <DialogDescription>
            Bed: <span className="font-mono font-medium">{bed?.code}</span> -{" "}
            {bed?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Occupant Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipe Penghuni *</Label>
              <Select
                value={formData.occupantType}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    occupantType: v as "EMPLOYEE" | "GUEST",
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                  <SelectItem value="GUEST">Tamu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jenis Kelamin *</Label>
              <Select
                value={formData.occupantGender}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    occupantGender: v as "MALE" | "FEMALE",
                  })
                }
                disabled={!canChangeGender}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Laki-laki</SelectItem>
                  <SelectItem value="FEMALE">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name & NIK */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                className="mt-1"
                value={formData.occupantName}
                onChange={(e) =>
                  setFormData({ ...formData, occupantName: e.target.value })
                }
                placeholder="Nama penghuni"
              />
            </div>
            <div>
              <Label>NIK / No.KTP</Label>
              <Input
                className="mt-1"
                value={formData.occupantNik}
                onChange={(e) =>
                  setFormData({ ...formData, occupantNik: e.target.value })
                }
                placeholder="NIK"
              />
            </div>
          </div>

          {/* Company & Department */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Perusahaan</Label>
              <Input
                className="mt-1"
                value={formData.occupantCompany}
                onChange={(e) =>
                  setFormData({ ...formData, occupantCompany: e.target.value })
                }
                placeholder="Nama perusahaan"
              />
            </div>
            <div>
              <Label>Departemen</Label>
              <Input
                className="mt-1"
                value={formData.occupantDepartment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occupantDepartment: e.target.value,
                  })
                }
                placeholder="Unit kerja"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>No. Telepon</Label>
              <Input
                className="mt-1"
                value={formData.occupantPhone}
                onChange={(e) =>
                  setFormData({ ...formData, occupantPhone: e.target.value })
                }
                placeholder="08xxx"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1"
                type="email"
                value={formData.occupantEmail}
                onChange={(e) =>
                  setFormData({ ...formData, occupantEmail: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tanggal Masuk *</Label>
              <Input
                className="mt-1"
                type="date"
                value={formData.checkInDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkInDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label>Tanggal Keluar</Label>
              <Input
                className="mt-1"
                type="date"
                value={formData.checkOutDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkOutDate: e.target.value })
                }
                min={formData.checkInDate}
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Kosongkan jika belum ditentukan
              </p>
            </div>
          </div>

          {/* Auto Check-in */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoCheckIn"
              checked={formData.autoCheckIn}
              onChange={(e) =>
                setFormData({ ...formData, autoCheckIn: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="autoCheckIn" className="text-sm cursor-pointer">
              Langsung check-in sekarang
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label>Catatan</Label>
            <Textarea
              className="mt-1 resize-none"
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Catatan tambahan..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {formData.autoCheckIn ? "Check-in" : "Reservasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// CHECKOUT CONFIRM DIALOG
// ========================================

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  onSuccess: () => void;
}

function CheckoutDialog({
  open,
  onOpenChange,
  bed,
  onSuccess,
}: CheckoutDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  const handleCheckout = async () => {
    if (!bed?.activeOccupancy) return;

    setIsSubmitting(true);
    const result = await checkOutOccupant({
      occupancyId: bed.activeOccupancy.id,
      reason: reason.trim() || null,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Checkout berhasil");
      onOpenChange(false);
      setReason("");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Checkout Penghuni
          </DialogTitle>
          <DialogDescription>
            Checkout <strong>{bed?.activeOccupancy?.occupant.name}</strong> dari{" "}
            <span className="font-mono">{bed?.code}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label>Alasan (opsional)</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan checkout..."
          />
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
            variant="destructive"
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// CANCEL RESERVATION DIALOG
// ========================================

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  onSuccess: () => void;
}

function CancelDialog({
  open,
  onOpenChange,
  bed,
  onSuccess,
}: CancelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!bed?.activeOccupancy) return;

    setIsSubmitting(true);
    const result = await cancelOccupancy(
      bed.activeOccupancy.id,
      reason.trim() || undefined
    );
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Reservasi dibatalkan");
      onOpenChange(false);
      setReason("");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <X className="h-5 w-5" />
            Batalkan Reservasi
          </DialogTitle>
          <DialogDescription>
            Batalkan reservasi{" "}
            <strong>{bed?.activeOccupancy?.occupant.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label>Alasan (opsional)</Label>
          <Textarea
            className="mt-1 resize-none"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan pembatalan..."
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Kembali
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================================
// TRANSFER DIALOG
// ========================================

// Reset form state

// ========================================
// BED LIST ITEM WITH ACTIONS
// ========================================

interface BedListItemProps {
  bed: BedWithOccupancy;
  onAssign: () => void;
  onCheckIn: () => void;
  onCheckout: () => void;
  onCancel: () => void;
  onTransfer: () => void;
  isLoading: boolean;
}

function BedListItem({
  bed,
  onAssign,
  onCheckIn,
  onCheckout,
  onCancel,
  onTransfer,
  isLoading,
}: BedListItemProps) {
  const config = bedStatusConfig[bed.status];
  const Icon = config.icon;
  const occupancy = bed.activeOccupancy;

  // Format date - handle null for indefinite stays
  const formatDate = (date: Date | null) => {
    if (!date) return "~";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        config.bg,
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              "bg-white dark:bg-slate-800 border",
              config.border
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
          <div>
            <p className="font-medium text-sm">{bed.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {bed.code}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", config.color)}>
          {config.label}
        </Badge>
      </div>

      {/* Occupant Info */}
      {occupancy && (
        <div className="mb-2 p-2 rounded bg-white/50 dark:bg-slate-800/50 border border-dashed">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {occupancy.occupant.name}
            </span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {occupancy.occupant.type === "EMPLOYEE" ? "Karyawan" : "Tamu"}
            </Badge>
          </div>
          {occupancy.occupant.company && (
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
              {occupancy.occupant.company}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 ml-5">
            {formatDate(occupancy.checkInDate)} -{" "}
            {occupancy.checkOutDate ? (
              formatDate(occupancy.checkOutDate)
            ) : (
              <span className="italic">Belum ditentukan</span>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        {bed.status === "AVAILABLE" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={onAssign}
            disabled={isLoading}
          >
            <UserPlus className="h-3 w-3" />
            Assign
          </Button>
        )}

        {bed.status === "RESERVED" && occupancy && (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              onClick={onCheckIn}
              disabled={isLoading}
            >
              <LogIn className="h-3 w-3" />
              Check-in
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
              Batal
            </Button>
          </>
        )}

        {bed.status === "OCCUPIED" && occupancy && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onCheckout}
              disabled={isLoading}
            >
              <LogOut className="h-3 w-3" />
              Checkout
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={onTransfer}
              disabled={isLoading}
            >
              <LogIn className="h-3 w-3" />
              Transfer
            </Button>
          </>
        )}

        {(bed.status === "MAINTENANCE" || bed.status === "BLOCKED") && (
          <p className="text-xs text-muted-foreground italic">
            Tidak dapat digunakan
          </p>
        )}
      </div>
    </div>
  );
}

// ========================================
// BEDS TAB WITH OCCUPANCY DATA
// ========================================

interface BedsTabProps {
  room: RoomData;
  onRefresh?: () => void;
}

function BedsTab({ room, onRefresh }: BedsTabProps) {
  const [beds, setBeds] = useState<BedWithOccupancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<BedWithOccupancy | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Fetch beds with occupancy
  const fetchBeds = useCallback(async () => {
    setIsLoading(true);
    const result = await getBedsWithOccupancy(room.id);
    if (result.success) {
      setBeds(result.data);
    }
    setIsLoading(false);
  }, [room.id]);

  // Initial fetch - using IIFE pattern with cleanup
  useEffect(() => {
    let ignore = false;

    const loadBeds = async () => {
      setIsLoading(true);
      const result = await getBedsWithOccupancy(room.id);
      if (!ignore && result.success) {
        setBeds(result.data);
      }
      if (!ignore) {
        setIsLoading(false);
      }
    };

    loadBeds();

    return () => {
      ignore = true;
    };
  }, [room.id]);

  // Handlers
  const handleAssign = (bed: BedWithOccupancy) => {
    setSelectedBed(bed);
    setAssignDialogOpen(true);
  };

  const handleCheckIn = async (bed: BedWithOccupancy) => {
    if (!bed.activeOccupancy) return;
    setActionLoading(true);
    const result = await checkInOccupant(bed.activeOccupancy.id);
    setActionLoading(false);
    if (result.success) {
      toast.success("Check-in berhasil");
      fetchBeds();
      onRefresh?.();
    } else {
      toast.error(result.error);
    }
  };

  const handleCheckout = (bed: BedWithOccupancy) => {
    setSelectedBed(bed);
    setCheckoutDialogOpen(true);
  };

  const handleCancel = (bed: BedWithOccupancy) => {
    setSelectedBed(bed);
    setCancelDialogOpen(true);
  };

  const handleTransfer = (bed: BedWithOccupancy) => {
    setSelectedBed(bed);
    setTransferDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchBeds();
    onRefresh?.();
  };

  // Sort beds
  const sortedBeds = [...beds].sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sortedBeds.map((bed) => (
          <BedListItem
            key={bed.id}
            bed={bed}
            onAssign={() => handleAssign(bed)}
            onCheckIn={() => handleCheckIn(bed)}
            onCheckout={() => handleCheckout(bed)}
            onCancel={() => handleCancel(bed)}
            onTransfer={() => handleTransfer(bed)}
            isLoading={actionLoading}
          />
        ))}

        {beds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada bed</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AssignOccupantDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        bed={selectedBed}
        roomGenderPolicy={room.genderPolicy}
        onSuccess={handleSuccess}
      />

      <CheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        bed={selectedBed}
        onSuccess={handleSuccess}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        bed={selectedBed}
        onSuccess={handleSuccess}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        bed={selectedBed}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// ========================================
// HISTORY TAB
// ========================================

const actionConfig: Record<
  OccupancyLogAction,
  { label: string; icon: string; color: string; bg: string }
> = {
  CREATED: {
    label: "Penempatan",
    icon: "📝",
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  CHECKED_IN: {
    label: "Check-In",
    icon: "✅",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  DATE_CHANGED: {
    label: "Perubahan Tanggal",
    icon: "📅",
    color: "text-yellow-600",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  TRANSFERRED: {
    label: "Transfer",
    icon: "🔄",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  EARLY_CHECKOUT: {
    label: "Checkout Awal",
    icon: "⚡",
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    icon: "🚪",
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
  CANCELLED: {
    label: "Dibatalkan",
    icon: "❌",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  STATUS_CHANGED: {
    label: "Status Berubah",
    icon: "🔧",
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
};

function HistoryTab({ room }: { room: RoomData }) {
  const [logs, setLogs] = useState<OccupancyLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 15;

  // Load history
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      const result = await getRoomHistory(room.id, { limit, offset });
      if (result.success) {
        if (offset === 0) {
          setLogs(result.data.logs);
        } else {
          setLogs((prev) => [...prev, ...result.data.logs]);
        }
        setTotal(result.data.total);
      } else {
        toast.error(result.error);
      }
      setIsLoading(false);
    }
    loadHistory();
  }, [room.id, offset]);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get action description
  const getActionDescription = (log: OccupancyLogData): string => {
    const name = log.occupancy.occupant.name;
    const currentBed = log.occupancy.bed;
    const currentLocation = `${currentBed.label} (${currentBed.room.name}, ${currentBed.room.building.name})`;

    switch (log.action) {
      case "CREATED":
        return `${name} ditempatkan di ${currentLocation}`;
      case "CHECKED_IN":
        return `${name} check-in di ${currentLocation}`;
      case "CHECKED_OUT":
      case "EARLY_CHECKOUT":
        return `${name} check-out dari ${currentLocation}`;
      case "TRANSFERRED": {
        const from = log.fromBedInfo
          ? `${log.fromBedInfo.label} (${log.fromBedInfo.roomName}, ${log.fromBedInfo.buildingName})`
          : "?";
        const to = log.toBedInfo
          ? `${log.toBedInfo.label} (${log.toBedInfo.roomName}, ${log.toBedInfo.buildingName})`
          : "?";
        return `${name} dipindahkan dari ${from} ke ${to}`;
      }
      case "CANCELLED":
        return `Reservasi ${name} dibatalkan`;
      case "DATE_CHANGED":
        return `Tanggal ${name} diubah`;
      default:
        return `Aktivitas pada ${currentLocation}`;
    }
  };

  // Empty state
  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-3">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-medium mb-1">Belum Ada Riwayat</h4>
        <p className="text-sm text-muted-foreground max-w-xs">
          Riwayat aktivitas akan muncul ketika ada penghuni yang check-in,
          check-out, atau transfer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Riwayat Aktivitas</h4>
          <p className="text-xs text-muted-foreground">
            {total} aktivitas tercatat
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {/* Log Items */}
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = actionConfig[log.action];
            return (
              <div key={log.id} className="relative pl-10">
                {/* Dot */}
                <div
                  className={cn(
                    "absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    config.bg
                  )}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "p-3 rounded-lg border bg-card",
                    index === 0 && "ring-2 ring-primary/20"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5", config.color)}
                      >
                        {config.label}
                      </Badge>
                      {log.occupancy.bookingId && log.occupancy.booking && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 font-mono"
                        >
                          #{log.occupancy.booking.code}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.performedAt)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm font-medium">
                    {getActionDescription(log)}
                  </p>

                  {/* Details */}
                  <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                    <p>Oleh: {log.performedByName}</p>
                    {log.reason && <p>Alasan: {log.reason}</p>}
                    {log.notes && <p>Catatan: {log.notes}</p>}

                    {/* Date changes */}
                    {log.action === "DATE_CHANGED" && (
                      <>
                        {log.previousCheckInDate && log.newCheckInDate && (
                          <p>
                            Check-in: {formatDate(log.previousCheckInDate)} →{" "}
                            {formatDate(log.newCheckInDate)}
                          </p>
                        )}
                        {log.previousCheckOutDate && log.newCheckOutDate && (
                          <p>
                            Check-out: {formatDate(log.previousCheckOutDate)} →{" "}
                            {formatDate(log.newCheckOutDate)}
                          </p>
                        )}
                      </>
                    )}

                    {/* Occupant type badge */}
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {log.occupancy.occupant.type === "EMPLOYEE"
                          ? "Karyawan"
                          : "Tamu"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {logs.length < total && (
          <div className="pt-4 pl-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Muat lebih banyak ({logs.length}/{total})
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && logs.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
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
  onEdit?: () => void;
  onRefresh?: () => void;
}

export function RoomDetailSheet({
  room,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: RoomDetailSheetProps) {
  if (!room) return null;

  const bedsOccupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
  const totalBeds = room.beds.length;
  const hasOccupants = bedsOccupied > 0;

  // Gender label
  const genderLabel =
    room.genderPolicy === "MALE_ONLY"
      ? "Pria"
      : room.genderPolicy === "FEMALE_ONLY"
      ? "Wanita"
      : room.genderPolicy === "FLEXIBLE"
      ? "Flexible"
      : "Campuran";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 text-left flex-shrink-0 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <DoorOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">{room.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {room.code}
                </SheetDescription>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onEdit}
                disabled={hasOccupants}
                title={hasOccupants ? "Ada penghuni aktif" : "Edit ruangan"}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>

          {/* Room Info Row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Occupancy */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                bedsOccupied === 0
                  ? "border-emerald-500 text-emerald-600"
                  : bedsOccupied === totalBeds
                  ? "border-red-500 text-red-600"
                  : "border-blue-500 text-blue-600"
              )}
            >
              <Bed className="h-3 w-3 mr-1" />
              {bedsOccupied}/{totalBeds} terisi
            </Badge>

            {/* Room Type */}
            <Badge variant="secondary" className="text-xs">
              {room.roomType.name}
            </Badge>

            {/* Gender */}
            <Badge variant="outline" className="text-xs">
              {genderLabel}
            </Badge>

            {/* Floor */}
            <Badge variant="outline" className="text-xs">
              Lt. {room.floorNumber}
            </Badge>

            {/* Status */}
            {room.status !== "ACTIVE" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  room.status === "MAINTENANCE"
                    ? "border-amber-500 text-amber-600"
                    : "border-slate-400 text-slate-600"
                )}
              >
                {room.status === "MAINTENANCE" ? "Maintenance" : "Tidak Aktif"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          defaultValue="beds"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-5 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="beds" className="text-xs gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              Beds ({totalBeds})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5">
              <History className="h-3.5 w-3.5" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beds" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-5 py-4">
                <BedsTab room={room} onRefresh={onRefresh} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="px-5 py-4">
                <HistoryTab room={room} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

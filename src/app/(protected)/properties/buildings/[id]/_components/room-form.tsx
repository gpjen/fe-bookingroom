/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  DoorOpen,
  Bed,
  Settings2,
  Images,
  User,
  Lock,
  MoreHorizontal,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoomTypeOption, RoomWithBeds } from "../_actions/room.types";
import { RoomGallery } from "./room-gallery";
import {
  createRoom,
  updateRoom,
  updateBed,
  deleteBed,
  addBedToRoom,
  getRoomById,
  swapBedPositions,
} from "../_actions/room.actions";

// ========================================
// LOCAL FORM SCHEMA
// ========================================

const formSchema = z.object({
  code: z
    .string()
    .min(2, "Kode minimal 2 karakter")
    .max(20, "Kode maksimal 20 karakter"),
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  buildingId: z.string().min(1, "Building ID wajib"),
  roomTypeId: z.string().min(1, "Tipe ruangan wajib dipilih"),
  floorNumber: z.coerce.number().min(1).max(99, "Lantai 1-99"),
  floorName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  allowedOccupantType: z.enum(["EMPLOYEE_ONLY", "ALL"]),
  isBookable: z.boolean(),
  genderPolicy: z.enum(["MALE_ONLY", "FEMALE_ONLY", "MIX", "FLEXIBLE"]),
  pricePerBed: z.coerce.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
});

type FormValues = z.infer<typeof formSchema>;

// ========================================
// PROPS
// ========================================

interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  roomTypes: RoomTypeOption[];
  room?: RoomWithBeds | null;
  defaultFloorNumber?: number;
  onSuccess?: () => void;
}

// ========================================
// CONSTANTS
// ========================================

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Tidak Aktif" },
  { value: "MAINTENANCE", label: "Maintenance" },
] as const;

const GENDER_OPTIONS = [
  { value: "MIX", label: "Campuran" },
  { value: "MALE_ONLY", label: "Pria Saja" },
  { value: "FEMALE_ONLY", label: "Wanita Saja" },
  { value: "FLEXIBLE", label: "Flexible" },
] as const;

const OCCUPANT_OPTIONS = [
  { value: "ALL", label: "Semua" },
  { value: "EMPLOYEE_ONLY", label: "Karyawan Saja" },
] as const;

const BED_STATUS_COLORS = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-300",
  OCCUPIED: "bg-blue-100 text-blue-700 border-blue-300",
  RESERVED: "bg-amber-100 text-amber-700 border-amber-300",
  MAINTENANCE: "bg-slate-100 text-slate-700 border-slate-300",
  BLOCKED: "bg-red-100 text-red-700 border-red-300",
};

const BED_STATUS_LABELS = {
  AVAILABLE: "Tersedia",
  OCCUPIED: "Terisi",
  RESERVED: "Dipesan",
  MAINTENANCE: "Maintenance",
  BLOCKED: "Diblokir",
};

// ========================================
// BEDS TAB COMPONENT (WITH EDITING)
// ========================================

interface BedsTabContentProps {
  room: RoomWithBeds;
  onBedUpdated?: () => void;
}

interface BedEditState {
  label: string;
  bedType: string;
  notes: string;
}

function BedsTabContent({ room, onBedUpdated }: BedsTabContentProps) {
  // State for editing
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<BedEditState>({
    label: "",
    bedType: "",
    notes: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // State for deleting
  const [deletingBedId, setDeletingBedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for adding new bed
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBedLabel, setNewBedLabel] = useState("");
  const [newBedType, setNewBedType] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // State for reordering
  const [isReordering, setIsReordering] = useState(false);

  // Sorted beds by position
  const sortedBeds = [...room.beds].sort((a, b) => a.position - b.position);

  // Move bed up (swap with previous)
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const currentBed = sortedBeds[index];
    const previousBed = sortedBeds[index - 1];

    setIsReordering(true);
    const result = await swapBedPositions(currentBed.id, previousBed.id);
    setIsReordering(false);

    if (result.success) {
      onBedUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  // Move bed down (swap with next)
  const handleMoveDown = async (index: number) => {
    if (index === sortedBeds.length - 1) return;
    const currentBed = sortedBeds[index];
    const nextBed = sortedBeds[index + 1];

    setIsReordering(true);
    const result = await swapBedPositions(currentBed.id, nextBed.id);
    setIsReordering(false);

    if (result.success) {
      onBedUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  // Start editing a bed
  const startEditing = (bed: RoomWithBeds["beds"][0]) => {
    setEditingBedId(bed.id);
    setEditValues({
      label: bed.label,
      bedType: bed.bedType || "",
      notes: bed.notes || "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingBedId(null);
    setEditValues({ label: "", bedType: "", notes: "" });
  };

  // Save bed changes
  const handleSaveBed = async () => {
    if (!editingBedId) return;

    if (!editValues.label.trim()) {
      toast.error("Label wajib diisi");
      return;
    }

    setIsUpdating(true);
    const result = await updateBed(editingBedId, {
      label: editValues.label.trim(),
      bedType: editValues.bedType.trim() || null,
      notes: editValues.notes.trim() || null,
    });
    setIsUpdating(false);

    if (result.success) {
      toast.success("Bed berhasil diperbarui");
      cancelEditing();
      onBedUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  // Delete bed
  const handleDeleteBed = async () => {
    if (!deletingBedId) return;

    setIsDeleting(true);
    const result = await deleteBed(deletingBedId);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Bed berhasil dihapus");
      setDeletingBedId(null);
      onBedUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  // Add new bed
  const handleAddBed = async () => {
    if (!newBedLabel.trim()) {
      toast.error("Label wajib diisi");
      return;
    }

    // Generate code automatically: {ROOM_CODE}-{NEXT_AVAILABLE_LETTER}
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existingCodes = new Set(room.beds.map((b) => b.code));

    // Find first available letter
    let generatedCode = "";
    for (let i = 0; i < 26; i++) {
      const letter = letters[i];
      const candidateCode = `${room.code}-${letter}`;
      if (!existingCodes.has(candidateCode)) {
        generatedCode = candidateCode;
        break;
      }
    }

    // If all letters used, try with numbers
    if (!generatedCode) {
      for (let i = 1; i <= 99; i++) {
        const candidateCode = `${room.code}-${i.toString().padStart(2, "0")}`;
        if (!existingCodes.has(candidateCode)) {
          generatedCode = candidateCode;
          break;
        }
      }
    }

    if (!generatedCode) {
      toast.error("Tidak dapat membuat kode bed baru");
      return;
    }

    setIsAdding(true);
    const result = await addBedToRoom({
      roomId: room.id,
      code: generatedCode,
      label: newBedLabel.trim(),
      bedType: newBedType.trim() || null,
    });
    setIsAdding(false);

    if (result.success) {
      toast.success("Bed berhasil ditambahkan");
      setShowAddForm(false);
      setNewBedLabel("");
      setNewBedType("");
      onBedUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  const deletingBed = room.beds.find((b) => b.id === deletingBedId);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {room.beds.length} bed • {room.roomType.name}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </Button>
      </div>

      {/* Add Bed Form */}
      {showAddForm && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Tambah Bed Baru (Kode akan otomatis)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Label (contoh: Bed A)"
              value={newBedLabel}
              onChange={(e) => setNewBedLabel(e.target.value)}
              disabled={isAdding}
            />
            <Input
              placeholder="Tipe (opsional)"
              value={newBedType}
              onChange={(e) => setNewBedType(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setNewBedLabel("");
                setNewBedType("");
              }}
              disabled={isAdding}
            >
              Batal
            </Button>
            <Button size="sm" onClick={handleAddBed} disabled={isAdding}>
              {isAdding && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Tambah
            </Button>
          </div>
        </div>
      )}

      {/* Bed List */}
      <div className="space-y-2">
        {sortedBeds.map((bed, index) => {
          const isOccupied =
            bed.status === "OCCUPIED" || bed.status === "RESERVED";
          const canEdit = !isOccupied;
          const isEditing = editingBedId === bed.id;
          const isFirst = index === 0;
          const isLast = index === sortedBeds.length - 1;

          return (
            <div
              key={bed.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isOccupied &&
                  "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                isEditing && "ring-2 ring-primary"
              )}
            >
              {isEditing ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{bed.code}</span>
                    <span>•</span>
                    <span>Posisi: {bed.position}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] ml-auto",
                        BED_STATUS_COLORS[bed.status]
                      )}
                    >
                      {BED_STATUS_LABELS[bed.status]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Label *
                      </label>
                      <Input
                        value={editValues.label}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            label: e.target.value,
                          })
                        }
                        placeholder="Label bed"
                        className="mt-1"
                        disabled={isUpdating}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Tipe Bed
                      </label>
                      <Input
                        value={editValues.bedType}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            bedType: e.target.value,
                          })
                        }
                        placeholder="Single, Double, dll"
                        className="mt-1"
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Catatan
                    </label>
                    <Textarea
                      value={editValues.notes}
                      onChange={(e) =>
                        setEditValues({ ...editValues, notes: e.target.value })
                      }
                      placeholder="Catatan tambahan..."
                      className="mt-1 resize-none"
                      rows={2}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBed}
                      disabled={isUpdating}
                    >
                      {isUpdating && (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      )}
                      Simpan
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isOccupied
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isOccupied ? <User className="h-4 w-4" /> : bed.position}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{bed.label}</p>
                        {bed.bedType && (
                          <Badge variant="secondary" className="text-[10px]">
                            {bed.bedType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {bed.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reorder Buttons */}
                    {sortedBeds.length > 1 && (
                      <div className="flex flex-col gap-0.5 mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveUp(index)}
                          disabled={isFirst || isReordering}
                          title="Geser ke atas"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveDown(index)}
                          disabled={isLast || isReordering}
                          title="Geser ke bawah"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Status Badge (Read-only) */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        BED_STATUS_COLORS[bed.status]
                      )}
                    >
                      {BED_STATUS_LABELS[bed.status]}
                    </Badge>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => startEditing(bed)}
                          disabled={!canEdit}
                          className={!canEdit ? "opacity-50" : ""}
                        >
                          Edit
                          {!canEdit && (
                            <span className="text-[9px] ml-auto">Terisi</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingBedId(bed.id)}
                          disabled={!canEdit}
                          className={cn(
                            "text-destructive focus:text-destructive",
                            !canEdit && "opacity-50"
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {room.beds.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada bed</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBedId}
        onOpenChange={(open) => !open && setDeletingBedId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bed</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus bed <strong>{deletingBed?.label}</strong> (
              {deletingBed?.code})?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBed}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ========================================
// GALLERY TAB COMPONENT
// ========================================

function GalleryTabContent({ room }: { room: RoomWithBeds }) {
  return <RoomGallery roomId={room.id} />;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function RoomForm({
  open,
  onOpenChange,
  buildingId,
  roomTypes,
  room,
  defaultFloorNumber,
  onSuccess,
}: RoomFormProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("detail");
  const isEditing = !!room;

  // Local room data state for refreshing beds without closing sheet
  const [roomData, setRoomData] = useState<RoomWithBeds | null>(room || null);

  // Check if room has active occupancy (OCCUPIED or RESERVED beds)
  const hasActiveOccupancy =
    roomData?.beds.some(
      (bed) => bed.status === "OCCUPIED" || bed.status === "RESERVED"
    ) ?? false;

  // Sync roomData with prop when it changes
  useEffect(() => {
    setRoomData(room || null);
  }, [room]);

  // Refresh room data (for bed updates without closing sheet)
  const refreshRoomData = async () => {
    if (!room?.id) return;
    const result = await getRoomById(room.id);
    if (result.success) {
      setRoomData(result.data);
    }
  };

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      buildingId: buildingId,
      roomTypeId: "",
      floorNumber: defaultFloorNumber || 1,
      floorName: "",
      description: "",
      allowedOccupantType: "ALL",
      isBookable: true,
      genderPolicy: "MIX",
      pricePerBed: null,
      status: "ACTIVE",
    },
    mode: "onChange",
  });

  // Watch roomTypeId for bed preview
  const selectedRoomTypeId = form.watch("roomTypeId");
  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);

  // Reset form when modal opens/closes or room changes
  useEffect(() => {
    if (!open) {
      setActiveTab("detail");
      form.reset({
        code: "",
        name: "",
        buildingId: buildingId,
        roomTypeId: "",
        floorNumber: defaultFloorNumber || 1,
        floorName: "",
        description: "",
        allowedOccupantType: "ALL",
        isBookable: true,
        genderPolicy: "MIX",
        pricePerBed: null,
        status: "ACTIVE",
      });
      return;
    }

    if (room) {
      form.reset({
        code: room.code,
        name: room.name,
        buildingId: room.buildingId,
        roomTypeId: room.roomTypeId,
        floorNumber: room.floorNumber,
        floorName: room.floorName || "",
        description: room.description || "",
        allowedOccupantType: room.allowedOccupantType,
        isBookable: room.isBookable,
        genderPolicy: room.genderPolicy,
        pricePerBed: room.pricePerBed,
        status: room.status,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        buildingId: buildingId,
        roomTypeId: "",
        floorNumber: defaultFloorNumber || 1,
        floorName: "",
        description: "",
        allowedOccupantType: "ALL",
        isBookable: true,
        genderPolicy: "MIX",
        pricePerBed: null,
        status: "ACTIVE",
      });
    }
  }, [open, room, buildingId, defaultFloorNumber, form]);

  // Handle submit
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateRoom(room.id, data)
        : await createRoom(data);

      if (result.success) {
        toast.success(
          isEditing ? "Ruangan berhasil diperbarui" : "Ruangan berhasil dibuat"
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-0 text-left flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>
                {isEditing ? `Edit: ${room.name}` : "Tambah Ruangan"}
              </SheetTitle>
              <SheetDescription>
                {isEditing
                  ? room.code
                  : "Isi formulir untuk menambahkan ruangan baru"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isEditing ? (
          // EDIT MODE - With Tabs
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-5 mt-4 grid w-auto grid-cols-3">
              <TabsTrigger value="detail" className="text-xs">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Detail
              </TabsTrigger>
              <TabsTrigger value="beds" className="text-xs">
                <Bed className="h-3.5 w-3.5 mr-1.5" />
                Beds ({room.beds.length})
              </TabsTrigger>
              <TabsTrigger value="gallery" className="text-xs">
                <Images className="h-3.5 w-3.5 mr-1.5" />
                Galeri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detail" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4">
                  {/* Info banner when has active occupancy */}
                  {hasActiveOccupancy && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium">
                            Ruangan memiliki penghuni aktif
                          </p>
                          <p className="text-xs mt-0.5 text-blue-600 dark:text-blue-400">
                            Tipe ruangan tidak dapat diubah saat ada penghuni.
                            Checkout semua penghuni terlebih dahulu.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Form {...form}>
                    <form
                      id="room-form"
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      {/* Code & Name - Code disabled for edit */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Kode</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    disabled={true}
                                    className="pr-8"
                                  />
                                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Nama *</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isPending} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Floor & Room Type */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="floorNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Lantai</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    {...field}
                                    disabled={true}
                                    className="pr-8"
                                  />
                                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="roomTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Tipe Ruangan
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={hasActiveOccupancy || isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roomTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name} ({type.bedsPerRoom} bed)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {hasActiveOccupancy ? (
                                <FormDescription className="text-[10px]">
                                  Tidak dapat diubah saat ada penghuni
                                </FormDescription>
                              ) : (
                                <FormDescription className="text-[10px]">
                                  Mengubah tipe tidak menghapus beds. Kelola di
                                  tab Beds.
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Status & Gender */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="genderPolicy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GENDER_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Occupant & Bookable */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="allowedOccupantType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Penghuni
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isPending}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {OCCUPANT_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isBookable"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs">
                                Dapat Dipesan
                              </FormLabel>
                              <div className="flex items-center h-9 px-3 border rounded-md">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <span className="ml-2 text-sm">
                                  {field.value ? "Ya" : "Tidak"}
                                </span>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Deskripsi</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Catatan tambahan..."
                                className="resize-none"
                                rows={2}
                                {...field}
                                value={field.value || ""}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <input type="hidden" {...form.register("buildingId")} />
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="beds" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4">
                  {roomData && (
                    <BedsTabContent
                      room={roomData}
                      onBedUpdated={refreshRoomData}
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gallery" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4">
                  {roomData && <GalleryTabContent room={roomData} />}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Footer for edit mode */}
            <div className="flex-shrink-0 border-t px-5 py-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Tutup
              </Button>
              {activeTab === "detail" && (
                <Button
                  type="submit"
                  size="sm"
                  form="room-form"
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Perubahan
                </Button>
              )}
            </div>
          </Tabs>
        ) : (
          // CREATE MODE - Simple form
          <ScrollArea className="flex-1">
            <div className="px-5 py-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Code & Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Kode *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="R-101"
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nama *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Kamar 101"
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Floor & Room Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="floorNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Lantai *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={99}
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roomTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Tipe *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roomTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} ({type.bedsPerRoom} bed)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bed Preview */}
                  {selectedRoomType && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          Beds otomatis:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({
                          length: selectedRoomType.bedsPerRoom,
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="px-2 py-1 text-[10px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"
                          >
                            {["A", "B", "C", "D", "E", "F", "G", "H"][i] ||
                              i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="genderPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GENDER_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Floor Name */}
                  <FormField
                    control={form.control}
                    name="floorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nama Lantai</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ground Floor (opsional)"
                            {...field}
                            value={field.value || ""}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Kosongkan untuk &quot;Lantai + nomor&quot;
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <input type="hidden" {...form.register("buildingId")} />

                  {/* Footer */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      disabled={isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Tambah Ruangan
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

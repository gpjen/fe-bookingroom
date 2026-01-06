"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, UserPlus, Loader2, CheckCircle2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BedWithOccupancy,
  AssignOccupantInput,
} from "../../_actions/occupancy.types";
import { assignOccupant } from "../../_actions/occupancy.actions";

// ========================================
// TYPES
// ========================================

export interface AssignOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  roomGenderPolicy: string;
  onSuccess: () => void;
}

// ========================================
// COMPONENT
// ========================================

export function AssignOccupantDialog({
  open,
  onOpenChange,
  bed,
  roomGenderPolicy,
  onSuccess,
}: AssignOccupantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NIK Search states
  const [nikSearch, setNikSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    source: "iam" | "local" | null;
    data: {
      nik: string;
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      department: string | null;
      gender: "MALE" | "FEMALE" | null;
      type: "EMPLOYEE" | "GUEST" | null;
    } | null;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Track data source - if "iam", fields are read-only (except phone/email)
  const [dataSource, setDataSource] = useState<"iam" | "local" | null>(null);
  const isFromIAM = dataSource === "iam";

  // Import the search action dynamically to avoid SSR issues
  const searchEmployeeByNIK = useCallback(
    async (nik: string, occupantType: "EMPLOYEE" | "GUEST") => {
      const { searchEmployeeByNIK: searchFn } = await import("@/lib/iam");
      return searchFn(nik, occupantType);
    },
    []
  );

  // Compute initial state based on props
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

  // Debounced search handler
  const handleNikChange = useCallback(
    (value: string) => {
      setNikSearch(value);
      setSearchError(null);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Reset search result and data source if input is cleared
      if (!value.trim()) {
        setSearchResult(null);
        setDataSource(null);
        // Reset form to allow manual input
        setFormData(initialFormData);
        return;
      }

      // Minimum 5 characters to search
      if (value.trim().length < 5) {
        setSearchResult(null);
        return;
      }

      // Debounce search - 500ms
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        setSearchError(null);

        try {
          // Pass occupantType to search function
          const result = await searchEmployeeByNIK(
            value.trim(),
            formData.occupantType
          );
          if (result.success) {
            setSearchResult(result.data);

            // Auto-apply if found
            if (result.data.found && result.data.data) {
              const data = result.data.data;
              const defaultGender =
                roomGenderPolicy === "MALE_ONLY"
                  ? "MALE"
                  : roomGenderPolicy === "FEMALE_ONLY"
                  ? "FEMALE"
                  : data.gender || "MALE";

              setFormData((prev) => ({
                ...prev,
                occupantType: data.type || prev.occupantType,
                occupantNik: data.nik,
                occupantName: data.name,
                occupantEmail: data.email || "",
                occupantPhone: data.phone || "",
                occupantCompany: data.company || "",
                occupantDepartment: data.department || "",
                occupantGender: defaultGender,
              }));

              // Note: Don't change nikSearch input - let user type freely
              // The correct NIK from search is stored in formData.occupantNik

              // Set data source to lock fields if from IAM
              setDataSource(result.data.source);
            }
          } else {
            setSearchError(result.error);
            setSearchResult(null);
          }
        } catch (error) {
          console.error("Search error:", error);
          setSearchError("Gagal mencari data. Silakan coba lagi.");
          setSearchResult(null);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    },
    [
      searchEmployeeByNIK,
      initialFormData,
      formData.occupantType,
      roomGenderPolicy,
    ]
  );

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData(initialFormData);
      setNikSearch("");
      setSearchResult(null);
      setSearchError(null);
      setDataSource(null);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
    onOpenChange(isOpen);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
      occupantNik: formData.occupantNik.trim() || nikSearch.trim() || null,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          {/* Step 1: Occupant Type */}
          <div>
            <Label>Tipe Penghuni *</Label>
            <Select
              value={formData.occupantType}
              onValueChange={(v) => {
                setFormData({
                  ...formData,
                  occupantType: v as "EMPLOYEE" | "GUEST",
                });
                // Reset search when type changes
                setNikSearch("");
                setSearchResult(null);
                setSearchError(null);
                setDataSource(null);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                <SelectItem value="GUEST">Tamu</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formData.occupantType === "EMPLOYEE"
                ? "Data karyawan akan dicari dari sistem IAM"
                : "Data tamu akan dicari dari riwayat penghuni sebelumnya"}
            </p>
          </div>

          {/* Step 2: NIK Search */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              Cari NIK{" "}
              {formData.occupantType === "EMPLOYEE"
                ? "(dari IAM)"
                : "(dari Database)"}
            </Label>
            <div className="relative">
              <Input
                value={nikSearch}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="Ketik NIK (min. 5 karakter)"
                className="pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Error */}
            {searchError && (
              <p className="text-xs text-destructive mt-2">{searchError}</p>
            )}

            {/* Search Result */}
            {searchResult && !isSearching && (
              <div className="mt-3">
                {searchResult.found && searchResult.data ? (
                  <div
                    className={cn(
                      "p-3 rounded-lg border-2",
                      searchResult.source === "iam"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                        : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              searchResult.source === "iam"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {searchResult.source === "iam"
                              ? "IAM"
                              : "Database Lokal"}
                          </Badge>
                        </div>
                        <p className="font-semibold truncate">
                          {searchResult.data.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {searchResult.data.nik}
                        </p>
                        {searchResult.data.company && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {searchResult.data.company}
                          </p>
                        )}
                        {searchResult.data.department && (
                          <p className="text-xs text-muted-foreground">
                            {searchResult.data.department}
                          </p>
                        )}
                        {searchResult.data.phone && (
                          <p className="text-xs text-muted-foreground">
                            {searchResult.data.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Terisi</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Tidak ditemukan. Silakan isi data manual di bawah.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IAM Lock Notice */}
          {isFromIAM && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Ban className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Data dari IAM tidak dapat diubah (kecuali telepon, email dan
                jenis kelamin)
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <Label>Nama Lengkap *</Label>
            <Input
              className={cn("mt-1", isFromIAM && "bg-muted")}
              value={formData.occupantName}
              onChange={(e) =>
                setFormData({ ...formData, occupantName: e.target.value })
              }
              placeholder="Nama penghuni"
              readOnly={isFromIAM}
            />
          </div>

          {/* Company & Department */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Perusahaan</Label>
              <Input
                className={cn("mt-1", isFromIAM && "bg-muted")}
                value={formData.occupantCompany}
                onChange={(e) =>
                  setFormData({ ...formData, occupantCompany: e.target.value })
                }
                placeholder="Nama perusahaan"
                readOnly={isFromIAM}
              />
            </div>
            <div>
              <Label>Departemen</Label>
              <Input
                className={cn("mt-1", isFromIAM && "bg-muted")}
                value={formData.occupantDepartment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occupantDepartment: e.target.value,
                  })
                }
                placeholder="Unit kerja"
                readOnly={isFromIAM}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-2 gap-2">
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
                <SelectTrigger
                  className={cn("mt-1 w-full", !canChangeGender && "bg-muted")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Laki-laki</SelectItem>
                  <SelectItem value="FEMALE">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              {!canChangeGender && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dibatasi oleh kebijakan kamar (
                  {roomGenderPolicy === "MALE_ONLY"
                    ? "Khusus Laki-laki"
                    : "Khusus Perempuan"}
                  )
                </p>
              )}
            </div>
          </div>

          {/* Phone & Email - Always Editable */}
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

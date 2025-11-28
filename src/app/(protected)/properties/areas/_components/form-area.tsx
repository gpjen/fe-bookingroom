"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { MapInput } from "@/components/maps/map-input";

// Definisikan tipe data Areal yang digunakan di form
export interface Areal {
  id: string;
  kodeAreal: string;
  namaAreal: string;
  lokasi: string;
  status: "active" | "inactive" | "development";
  catatan?: string | null;
  parentId?: string;
  polygon?: string | null; // GeoJSON string
}

// Skema validasi menggunakan Zod dengan sintaks yang benar
const arealSchema = z.object({
  namaAreal: z
    .string()
    .min(3, { message: "Nama areal minimal 3 karakter." })
    .max(100, { message: "Nama areal tidak boleh lebih dari 100 karakter." }),
  lokasi: z
    .string()
    .min(3, { message: "Lokasi wajib diisi." })
    .max(100, { message: "Lokasi tidak boleh lebih dari 100 karakter." }),
  status: z.enum(["active", "inactive", "development"]),
  parentId: z.string().optional(),
  catatan: z
    .string()
    .max(300, { message: "Catatan tidak boleh lebih dari 300 karakter." })
    .optional()
    .nullable(),
  polygon: z.string().optional().nullable(),
});

export type ArealFormData = z.infer<typeof arealSchema>;

interface FormAreaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ArealFormData, id?: string) => void;
  initialData?: Areal | null;
  allAreas?: Areal[]; // Untuk pilihan parent
}

export function FormArea({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  allAreas = [],
}: FormAreaProps) {
  const [formData, setFormData] = useState<Partial<ArealFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form saat initialData berubah
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          namaAreal: "",
          lokasi: "",
          status: "active",
          parentId: undefined,
          catatan: "",
          polygon: "",
        });
      }
      setErrors({}); // Selalu reset error saat modal dibuka
    }
  }, [isOpen, initialData]);

  const handleFormSubmit = () => {
    // Reset errors
    setErrors({});

    // Validate form
    const result = arealSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Validasi gagal. Periksa kembali isian form Anda.");
      return;
    }

    // LOG DATA SUBMISSION
    console.log("=== FORM SUBMISSION DATA ===");
    console.log(result.data);
    console.log("============================");

    try {
      onSubmit(result.data, initialData?.id);
      toast.success(
        initialData ? "Areal berhasil diperbarui" : "Areal berhasil ditambahkan"
      );
      onClose(); // Tutup modal setelah submit berhasil
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan data.");
      console.error(error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === "none" ? "" : value,
    }));
  };

  const handleMapChange = (value: string) => {
    setFormData((prev) => ({ ...prev, polygon: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full md:max-w-[650px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {initialData ? "Edit Areal" : "Tambah Areal Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi areal di bawah ini. Field dengan tanda (*) wajib
            diisi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-0 md:py-4">
          {/* NAMA AREAL */}
          <div className="space-y-1">
            <Label htmlFor="namaAreal">
              Nama Areal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="namaAreal"
              name="namaAreal"
              placeholder="Contoh: Mess LQ"
              value={formData.namaAreal || ""}
              onChange={handleChange}
            />
            {errors.namaAreal && (
              <p className="text-sm text-destructive">{errors.namaAreal}</p>
            )}
          </div>

          {/* LOKASI */}
          <div className="space-y-1">
            <Label htmlFor="lokasi">
              Lokasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lokasi"
              name="lokasi"
              placeholder="Desa, Kecamatan, Kabupaten"
              value={formData.lokasi || ""}
              onChange={handleChange}
            />
            {errors.lokasi && (
              <p className="text-sm text-destructive">{errors.lokasi}</p>
            )}
          </div>

          {/* STATUS */}
          <div className="space-y-1">
            <Label>
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status areal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="development">Pengembangan</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          {/* ===================================================== */}
          {/* KOORDINAT */}
          {/* ===================================================== */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
              Koordinat & Pemetaan
            </h3>

            <div className="rounded-lg border border-muted-foreground/30 bg-muted/20 p-1">
               <MapInput 
                  value={formData.polygon || ""} 
                  onChange={handleMapChange} 
               />
            </div>
            <p className="text-xs text-muted-foreground">
              Gunakan tools di pojok kanan atas peta untuk menggambar area (polygon).
            </p>
          </section>

          {/* PARENT AREAL */}
          <div className="space-y-1">
            <Label>Parent Areal (Opsional)</Label>
            <Select
              name="parentId"
              value={formData.parentId || "none"}
              onValueChange={(value) => handleSelectChange("parentId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih parent areal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada parent</SelectItem>
                {allAreas
                  .filter((area) => area.id !== initialData?.id)
                  .map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.kodeAreal} - {area.namaAreal}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* CATATAN */}
          <div className="space-y-1">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              name="catatan"
              placeholder="Informasi tambahan tentang areal..."
              rows={3}
              value={formData.catatan || ""}
              onChange={handleChange}
            />
            {errors.catatan && (
              <p className="text-sm text-destructive">{errors.catatan}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleFormSubmit}>
            {initialData ? "Simpan Perubahan" : "Tambah Areal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

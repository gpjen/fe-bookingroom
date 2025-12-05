"use client";

import { useState } from "react";
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
  code: string;
  name: string;
  location: string;
  status: "active" | "inactive" | "development";
  descriptions?: string | null;
  parent_id?: string;
  polygon?: string | null; // GeoJSON string
  created_at?: string;
  updated_at?: string;
}

// Skema validasi menggunakan Zod dengan sintaks yang benar
const arealSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nama areal minimal 3 karakter." })
    .max(100, { message: "Nama areal tidak boleh lebih dari 100 karakter." }),
  location: z
    .string()
    .min(3, { message: "location wajib diisi." })
    .max(100, { message: "location tidak boleh lebih dari 100 karakter." }),
  status: z.enum(["active", "inactive", "development"]),
  parent_id: z.string().optional(),
  descriptions: z
    .string()
    .max(300, { message: "deskripsi tidak boleh lebih dari 300 karakter." })
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
  const [formData, setFormData] = useState<Partial<ArealFormData>>(
    initialData || {
      name: "",
      location: "",
      status: "active",
      parent_id: undefined,
      descriptions: "",
      polygon: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

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
            <Label htmlFor="name">
              Nama Areal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Mess LQ"
              value={formData.name || ""}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* location */}
          <div className="space-y-1">
            <Label htmlFor="location">
              Lokasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="Desa, Kecamatan, Kabupaten"
              value={formData.location || ""}
              onChange={handleChange}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
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
              name="parent_id"
              value={formData.parent_id || "none"}
              onValueChange={(value) => handleSelectChange("parent_id", value)}
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
                      {area.code} - {area.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* descriptions */}
          <div className="space-y-1">
            <Label htmlFor="descriptions">Deskripsi</Label>
            <Textarea
              id="descriptions"
              name="descriptions"
              placeholder="Deskripsi tambahan tentang areal..."
              rows={3}
              value={formData.descriptions || ""}
              onChange={handleChange}
            />
            {errors.descriptions && (
              <p className="text-sm text-destructive">{errors.descriptions}</p>
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

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
import { Label } from "@/components/ui/label";

// Definisikan tipe data Companies yang digunakan di form
export interface Companies {
  id: string;
  code: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Skema validasi menggunakan Zod dengan sintaks yang benar
const companiesSchema = z.object({
  code: z
    .string()
    .min(3, { message: "Kode companies minimal 3 karakter." })
    .max(10, {
      message: "Kode companies tidak boleh lebih dari 10 karakter.",
    }),
  name: z
    .string()
    .min(3, { message: "Nama companies minimal 3 karakter." })
    .max(100, {
      message: "Nama companies tidak boleh lebih dari 100 karakter.",
    }),
  status: z.boolean().default(true),
});

export type CompaniesFormData = z.infer<typeof companiesSchema>;

interface FormAreaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompaniesFormData, id?: string) => void;
  initialData?: Companies | null;
  allAreas?: Companies[]; // Untuk pilihan parent
}

export function FormArea({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: FormAreaProps) {
  const [formData, setFormData] = useState<Partial<CompaniesFormData>>(
    initialData || {
      code: "",
      name: "",
      status: true,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = () => {
    // Reset errors
    setErrors({});

    // Validate form
    const result = companiesSchema.safeParse(formData);
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

    try {
      onSubmit(result.data, initialData?.id);
      toast.success(
        initialData
          ? "Companies berhasil diperbarui"
          : "Companies berhasil ditambahkan"
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
    // Konversi nilai boolean dari string
    const booleanValue = value === "true";
    setFormData((prev) => ({
      ...prev,
      [name]: booleanValue,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {initialData ? "Edit Companies" : "Tambah Companies Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi companies di bawah ini. Field dengan tanda (*)
            wajib diisi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* CODE */}
          <div className="space-y-1">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              name="code"
              placeholder="Contoh: DCM"
              value={formData.code || ""}
              onChange={handleChange}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
          </div>

          {/* NAMA companies */}
          <div className="space-y-1">
            <Label htmlFor="name">
              Nama Companies <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: PT. Dharma Cipta Mulia"
              value={formData.name || ""}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* STATUS */}
          <div className="space-y-1">
            <Label>
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              name="status"
              value={formData.status?.toString() || "0"}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleFormSubmit}>
            {initialData ? "Simpan Perubahan" : "Tambah Companies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

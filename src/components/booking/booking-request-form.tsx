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
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";

import { LocationSection } from "./form-parts/location-section";
import { OccupantList } from "./form-parts/occupant-list";
import { OccupantForm } from "./form-parts/occupant-form";
import { BookingInfoSection } from "./form-parts/booking-info-section";
import type { OccupantFormData } from "@/app/(protected)/booking/request/_components/types";

const formSchema = z.object({
  areaId: z.string().min(1, "Area wajib dipilih"),
  purpose: z.string().min(10, "Tujuan minimal 10 karakter"),
  notes: z.string().optional(),
  occupants: z.array(z.any()).min(1, "Minimal 1 penghuni"),
});

type BookingRequestFormData = z.infer<typeof formSchema>;

interface BookingRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function BookingRequestForm({
  isOpen,
  onClose,
  onSubmit,
}: BookingRequestFormProps) {
  const [formData, setFormData] = useState<Partial<BookingRequestFormData>>({
    areaId: "",
    purpose: "",
    notes: "",
  });
  const [occupants, setOccupants] = useState<OccupantFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOccupantForm, setShowOccupantForm] = useState(false);
  const [editingOccupant, setEditingOccupant] =
    useState<OccupantFormData | null>(null);

  const handleAddOccupant = (newOccupant: OccupantFormData) => {
    if (editingOccupant) {
      setOccupants(
        occupants.map((o) => (o.id === editingOccupant.id ? newOccupant : o))
      );
      toast.success("Penghuni berhasil diupdate");
    } else {
      setOccupants([...occupants, newOccupant]);
      toast.success("Penghuni berhasil ditambahkan");
    }
    handleCancelOccupantForm();
  };

  const handleEditOccupant = (occupant: OccupantFormData) => {
    setEditingOccupant(occupant);
    setShowOccupantForm(true);
  };

  const handleDeleteOccupant = (id: string) => {
    setOccupants(occupants.filter((o) => o.id !== id));
    toast.success("Penghuni berhasil dihapus");
  };

  const handleCancelOccupantForm = () => {
    setEditingOccupant(null);
    setShowOccupantForm(false);
  };

  const handleSubmit = () => {
    setErrors({});

    // Check guest-companion rule - each guest must have a companion
    const guests = occupants.filter((o) => o.type === "guest");
    const guestsWithoutCompanion = guests.filter((o) => !o.companion);

    if (guestsWithoutCompanion.length > 0) {
      toast.error("Setiap tamu harus memiliki pendamping karyawan");
      return;
    }

    const validationData = {
      ...formData,
      occupants,
    };

    const result = formSchema.safeParse(validationData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Validasi gagal. Periksa kembali isian form.");
      return;
    }

    try {
      onSubmit(result.data);
      toast.success("Permintaan booking berhasil dibuat");
      onClose();

      // Reset form
      setFormData({
        areaId: "",
        purpose: "",
        notes: "",
      });
      setOccupants([]);
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan data");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full md:max-w-[900px] max-h-[95vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Buat Permintaan Booking Baru
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Lengkapi informasi booking di bawah ini. Field dengan tanda (*)
                wajib diisi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          <LocationSection
            areaId={formData.areaId || ""}
            onAreaChange={(value) =>
              setFormData({ ...formData, areaId: value })
            }
            errors={errors}
          />

          {showOccupantForm ? (
            <OccupantForm
              initialData={editingOccupant}
              onSubmit={handleAddOccupant}
              onCancel={handleCancelOccupantForm}
              areaId={formData.areaId || ""}
            />
          ) : (
            <OccupantList
              occupants={occupants}
              onEdit={handleEditOccupant}
              onDelete={handleDeleteOccupant}
              onAdd={() => setShowOccupantForm(true)}
              errors={errors}
            />
          )}

          <BookingInfoSection
            purpose={formData.purpose || ""}
            notes={formData.notes || ""}
            onPurposeChange={(value) =>
              setFormData({ ...formData, purpose: value })
            }
            onNotesChange={(value) =>
              setFormData({ ...formData, notes: value })
            }
            errors={errors}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {occupants.length} penghuni •{" "}
              {formData.areaId ? "Area terpilih" : "Pilih area"}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="min-w-[100px]"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="min-w-[150px] gap-2"
                disabled={occupants.length === 0}
              >
                <UserCheck className="h-4 w-4" />
                Ajukan Permintaan
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

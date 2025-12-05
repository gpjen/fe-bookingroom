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
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";

import { LocationSection } from "./form-parts/location-section";
import { OccupantList } from "./form-parts/occupant-list";
import { OccupantForm } from "./form-parts/occupant-form";
import { BookingInfoSection } from "./form-parts/booking-info-section";
import { CompanionSection } from "./form-parts/companion-section";
import type { BookingOccupant, CompanionInfo } from "@/app/(protected)/booking/request/_components/types";

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
  onSubmit: (data: BookingRequestFormData & { companion?: CompanionInfo }) => void;
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
  const [occupants, setOccupants] = useState<BookingOccupant[]>([]);
  const [companion, setCompanion] = useState<CompanionInfo | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOccupantForm, setShowOccupantForm] = useState(false);
  const [editingOccupant, setEditingOccupant] =
    useState<BookingOccupant | null>(null);

  const hasGuestOccupant = occupants.some((o) => o.type === "guest");

  const handleAddOccupant = (newOccupant: BookingOccupant) => {
    if (editingOccupant) {
      setOccupants(
        occupants.map((o) => (o.id === editingOccupant.id ? newOccupant : o))
      );
      toast.success("Penghuni diupdate");
    } else {
      setOccupants([...occupants, newOccupant]);
      toast.success("Penghuni ditambahkan");
    }
    handleCancelOccupantForm();
  };

  const handleEditOccupant = (occupant: BookingOccupant) => {
    setEditingOccupant(occupant);
    setShowOccupantForm(true);
  };

  const handleDeleteOccupant = (id: string) => {
    setOccupants(occupants.filter((o) => o.id !== id));
    toast.success("Penghuni dihapus");
  };

  const handleCancelOccupantForm = () => {
    setEditingOccupant(null);
    setShowOccupantForm(false);
  };

  const handleSubmit = () => {
    setErrors({});

    if (hasGuestOccupant && (!companion || !companion.nik || !companion.name)) {
      setErrors({ companion: "Pendamping wajib diisi jika ada tamu" });
      toast.error("Pendamping wajib diisi jika ada tamu");
      return;
    }

    const result = formSchema.safeParse({ ...formData, occupants });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Periksa kembali isian form");
      return;
    }

    try {
      onSubmit({ ...result.data, companion: hasGuestOccupant ? companion : undefined });
      toast.success("Permintaan booking berhasil dibuat");
      onClose();
      setFormData({ areaId: "", purpose: "", notes: "" });
      setOccupants([]);
      setCompanion(undefined);
    } catch (error) {
      toast.error("Terjadi kesalahan");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full md:max-w-[600px] max-h-[95vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-3">
          <DialogTitle>Permintaan Booking Baru</DialogTitle>
          <DialogDescription>
            Lengkapi informasi booking di bawah ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <LocationSection
            areaId={formData.areaId || ""}
            onAreaChange={(value) =>
              setFormData({ ...formData, areaId: value })
            }
            errors={errors}
          />

          <Separator />

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

          <CompanionSection
            companion={companion}
            onCompanionChange={setCompanion}
            hasGuestOccupant={hasGuestOccupant}
            errors={errors}
          />

          <Separator />

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

        <DialogFooter className="pt-4 gap-2 sm:gap-0">
          <div className="flex items-center text-xs text-muted-foreground mr-auto">
            {occupants.length} penghuni
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={occupants.length === 0}
            className="gap-1.5"
          >
            <Send className="h-4 w-4" />
            Ajukan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

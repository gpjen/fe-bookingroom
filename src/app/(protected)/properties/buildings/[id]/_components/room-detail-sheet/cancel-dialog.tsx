"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BedWithOccupancy } from "../../_actions/occupancy.types";
import { cancelOccupancy } from "../../_actions/occupancy.actions";

// ========================================
// TYPES
// ========================================

export interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  onSuccess: () => void;
}

// ========================================
// COMPONENT
// ========================================

export function CancelDialog({
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

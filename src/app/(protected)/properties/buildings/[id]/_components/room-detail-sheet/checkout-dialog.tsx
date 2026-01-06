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
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BedWithOccupancy } from "../../_actions/occupancy.types";
import { checkOutOccupant } from "../../_actions/occupancy.actions";

// ========================================
// TYPES
// ========================================

export interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: BedWithOccupancy | null;
  onSuccess: () => void;
}

// ========================================
// COMPONENT
// ========================================

export function CheckoutDialog({
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

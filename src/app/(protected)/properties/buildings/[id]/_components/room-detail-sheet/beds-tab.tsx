"use client";

import { useState, useCallback, useEffect } from "react";
import { Bed } from "lucide-react";
import { toast } from "sonner";
import { RoomData } from "../../_actions/building-detail.schema";
import { BedWithOccupancy } from "../../_actions/occupancy.types";
import {
  getBedsWithOccupancy,
  checkInOccupant,
} from "../../_actions/occupancy.actions";
import { TransferDialog } from "../transfer-dialog";
import { BedListItem } from "./bed-list-item";
import { AssignOccupantDialog } from "./assign-occupant-dialog";
import { CheckoutDialog } from "./checkout-dialog";
import { CancelDialog } from "./cancel-dialog";

// ========================================
// TYPES
// ========================================

export interface BedsTabProps {
  room: RoomData;
  onRefresh?: () => void;
}

// ========================================
// COMPONENT
// ========================================

export function BedsTab({ room, onRefresh }: BedsTabProps) {
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

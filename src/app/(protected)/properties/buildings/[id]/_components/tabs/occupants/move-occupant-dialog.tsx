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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft } from "lucide-react";
import { Occupant } from "./types";

interface MoveOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (data: any) => void;
  occupant: Occupant | null;
}

export function MoveOccupantDialog({
  open,
  onOpenChange,
  onMove,
  occupant,
}: MoveOccupantDialogProps) {
  const [moveForm, setMoveForm] = useState({
    area: "",
    building: "",
    floor: "",
    room: "",
    reason: "",
    notes: ""
  });

  const handleSubmit = () => {
    onMove(moveForm);
    // Reset form
    setMoveForm({ area: "", building: "", floor: "", room: "", reason: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pindahkan Penghuni</DialogTitle>
          <DialogDescription>
            Pilih lokasi baru untuk <b>{occupant?.name}</b>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Area</Label>
              <Select 
                value={moveForm.area} 
                onValueChange={(val) => setMoveForm({...moveForm, area: val, building: "", floor: "", room: ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area-a">Living Quarter A</SelectItem>
                  <SelectItem value="area-b">Living Quarter B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gedung</Label>
              <Select 
                value={moveForm.building} 
                disabled={!moveForm.area}
                onValueChange={(val) => setMoveForm({...moveForm, building: val, floor: "", room: ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Gedung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b-1">Gedung Meranti</SelectItem>
                  <SelectItem value="b-2">Gedung Ulin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lantai</Label>
              <Select 
                value={moveForm.floor} 
                disabled={!moveForm.building}
                onValueChange={(val) => setMoveForm({...moveForm, floor: val, room: ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Lantai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f-1">Lantai 1</SelectItem>
                  <SelectItem value="f-2">Lantai 2</SelectItem>
                  <SelectItem value="f-3">Lantai 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kamar</Label>
              <Select 
                value={moveForm.room} 
                disabled={!moveForm.floor}
                onValueChange={(val) => setMoveForm({...moveForm, room: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kamar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="r-101">101 (Kosong)</SelectItem>
                  <SelectItem value="r-102">102 (Sisa 1)</SelectItem>
                  <SelectItem value="r-103">103 (Kosong)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Alasan Pemindahan</Label>
            <Select 
              value={moveForm.reason}
              onValueChange={(val) => setMoveForm({...moveForm, reason: val})}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih alasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="request">Permintaan Sendiri</SelectItem>
                <SelectItem value="maintenance">Perbaikan Kamar</SelectItem>
                <SelectItem value="upgrade">Upgrade Kamar</SelectItem>
                <SelectItem value="conflict">Konflik Penghuni</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              value={moveForm.notes}
              onChange={(e) => setMoveForm({...moveForm, notes: e.target.value})}
              placeholder="Tambahkan catatan jika diperlukan"
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!moveForm.room || !moveForm.reason}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Pindahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

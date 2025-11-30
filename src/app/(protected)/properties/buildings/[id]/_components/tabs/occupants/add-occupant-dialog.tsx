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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface AddOccupantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: any) => void;
  bedCodes: string[];
}

// Mock Employee Lookup
const lookupEmployee = async (nik: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (nik === "2024001") {
    return {
      name: "Agus Setiawan",
      gender: "Male",
      company: "PT Harita Nickel",
      department: "Mining Operation",
    };
  }
  return null;
};

export function AddOccupantDialog({
  open,
  onOpenChange,
  onAdd,
  bedCodes,
}: AddOccupantDialogProps) {
  const [addForm, setAddForm] = useState({
    type: "employee",
    name: "",
    identifier: "",
    gender: "Male",
    company: "",
    department: "",
    companionName: "",
    companionId: "",
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: "",
    bedCode: "",
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleEmployeeSearch = async () => {
    if (!addForm.identifier) return;
    setIsSearching(true);
    try {
      const result = await lookupEmployee(addForm.identifier);
      if (result) {
        setAddForm(prev => ({
          ...prev,
          name: result.name,
          gender: result.gender,
          company: result.company,
          department: result.department,
        }));
        toast.success("Data Karyawan Ditemukan", {
          description: `Nama: ${result.name}`,
        });
      } else {
        toast.error("Data Karyawan Tidak Ditemukan", {
          description: "Silakan periksa kembali NIK yang dimasukkan.",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = () => {
    onAdd(addForm);
    // Reset form after submit (optional, or let parent close handle it)
    setAddForm({
      type: "employee",
      name: "",
      identifier: "",
      gender: "Male",
      company: "",
      department: "",
      companionName: "",
      companionId: "",
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: "",
      bedCode: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Penghuni Baru</DialogTitle>
          <DialogDescription>Masukkan data penghuni baru untuk kamar ini.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Tipe Penghuni</Label>
            <Select 
              value={addForm.type} 
              onValueChange={(val) => setAddForm({...addForm, type: val})}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Karyawan</SelectItem>
                <SelectItem value="guest">Tamu</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {addForm.type === 'employee' ? (
            // Employee Form
            <>
              <div className="space-y-2">
                <Label>NIK Karyawan</Label>
                <div className="flex gap-2">
                  <Input 
                    value={addForm.identifier}
                    onChange={(e) => setAddForm({...addForm, identifier: e.target.value})}
                    placeholder="Masukkan NIK (Cth: 2024001)"
                  />
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={handleEmployeeSearch}
                    disabled={isSearching || !addForm.identifier}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Klik tombol cari untuk mengisi data otomatis.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input 
                  value={addForm.name}
                  onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                  placeholder="Nama Karyawan"
                  readOnly // Auto-filled usually
                />
              </div>

              <div className="space-y-2">
                <Label>Perusahaan</Label>
                <Input 
                  value={addForm.company}
                  onChange={(e) => setAddForm({...addForm, company: e.target.value})}
                  placeholder="Perusahaan"
                  readOnly
                />
              </div>
              
              <div className="space-y-2">
                <Label>Departemen</Label>
                <Input 
                  value={addForm.department}
                  onChange={(e) => setAddForm({...addForm, department: e.target.value})}
                  placeholder="Departemen"
                  readOnly
                />
              </div>
            </>
          ) : (
            // Guest/Other Form
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    placeholder="Nama"
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Identitas</Label>
                  <Input 
                    value={addForm.identifier}
                    onChange={(e) => setAddForm({...addForm, identifier: e.target.value})}
                    placeholder="KTP/SIM/Paspor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asal Instansi / Perusahaan</Label>
                <Input 
                  value={addForm.company}
                  onChange={(e) => setAddForm({...addForm, company: e.target.value})}
                  placeholder="Nama instansi asal"
                />
              </div>

              <div className="space-y-2 border-t pt-2">
                <Label className="text-xs text-muted-foreground uppercase">Informasi Pendamping</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Pendamping</Label>
                    <Input 
                      value={addForm.companionName}
                      onChange={(e) => setAddForm({...addForm, companionName: e.target.value})}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">ID Pendamping</Label>
                    <Input 
                      value={addForm.companionId}
                      onChange={(e) => setAddForm({...addForm, companionId: e.target.value})}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>
            <RadioGroup 
              value={addForm.gender} 
              onValueChange={(val) => setAddForm({...addForm, gender: val})}
              className="flex gap-4"
              disabled={addForm.type === 'employee'} // Usually fixed for employee
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male">Laki-laki</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female">Perempuan</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Pilih Bed</Label>
            <Select 
            value={addForm.bedCode} 
                onValueChange={(val) => setAddForm({...addForm, bedCode: val})}
                >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Bed" />
                </SelectTrigger>
                <SelectContent>
                    {bedCodes.map((code) => (
                    <SelectItem key={code} value={code}>Bed {code}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Masuk</Label>
              <Input 
                type="date"
                value={addForm.checkInDate}
                onChange={(e) => setAddForm({...addForm, checkInDate: e.target.value})}
              />
            </div>
          <div className="space-y-2">
            <Label>Rencana Keluar (Opsional)</Label>
            <Input 
              type="date"
              value={addForm.checkOutDate}
              onChange={(e) => setAddForm({...addForm, checkOutDate: e.target.value})}
            />
          </div>
          </div>


        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!addForm.name || !addForm.identifier || !addForm.bedCode}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

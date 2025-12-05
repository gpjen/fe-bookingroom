"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { MOCK_EMPLOYEES } from "../constants";
import type { CompanionInfo } from "@/app/(protected)/booking/request/_components/types";

interface CompanionSectionProps {
  companion?: CompanionInfo;
  onCompanionChange: (companion: CompanionInfo | undefined) => void;
  hasGuestOccupant: boolean;
  errors?: Record<string, string>;
}

export function CompanionSection({
  companion,
  onCompanionChange,
  hasGuestOccupant,
  errors,
}: CompanionSectionProps) {
  const initialCompanion = useMemo(() => companion || {
    nik: "",
    name: "",
    company: "",
    department: "",
    email: "",
    phone: "",
  }, [companion]);

  const [isLocked, setIsLocked] = useState(!!companion?.nik);
  const [localCompanion, setLocalCompanion] = useState<Partial<CompanionInfo>>(initialCompanion);

  const handleNikLookup = () => {
    if (!localCompanion.nik) return;

    const employee = MOCK_EMPLOYEES.find(
      (emp) => emp.nik === localCompanion.nik
    );

    if (employee) {
      const newCompanion: CompanionInfo = {
        nik: employee.nik,
        name: employee.name,
        company: employee.company,
        department: employee.department,
        email: employee.email,
        phone: employee.phone,
      };
      setLocalCompanion(newCompanion);
      onCompanionChange(newCompanion);
      setIsLocked(true);
      toast.success("Data pendamping ditemukan");
    } else {
      toast.error("NIK pendamping tidak ditemukan");
      setIsLocked(false);
    }
  };

  const handleChange = (field: keyof CompanionInfo, value: string) => {
    const updated = {
      ...localCompanion,
      [field]: value,
    };
    setLocalCompanion(updated);
    
    if (updated.nik && updated.name) {
      onCompanionChange(updated as CompanionInfo);
    }
  };

  const handleClear = () => {
    setLocalCompanion({
      nik: "",
      name: "",
      company: "",
      department: "",
      email: "",
      phone: "",
    });
    onCompanionChange(undefined);
    setIsLocked(false);
  };

  if (!hasGuestOccupant) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-700 dark:text-blue-400">
            Informasi Pendamping
          </span>
        </div>
        {localCompanion.nik && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Pendamping wajib diisi jika ada tamu dalam daftar penghuni
      </p>

      {errors?.companion && (
        <p className="text-sm text-destructive">{errors.companion}</p>
      )}

      {/* NIK with Lookup */}
      <div className="space-y-1.5">
        <Label className="text-xs">NIK Pendamping *</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={localCompanion.nik || ""}
              onChange={(e) => handleChange("nik", e.target.value)}
              placeholder="NIK Karyawan Pendamping"
              disabled={isLocked}
              className="h-9 pr-16"
            />
            {!isLocked && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleNikLookup}
                disabled={!localCompanion.nik}
                className="absolute right-1 top-1 h-7 px-2"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {isLocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLocked(false);
                setLocalCompanion({
                  nik: "",
                  name: "",
                  company: "",
                  department: "",
                  email: "",
                  phone: "",
                });
                onCompanionChange(undefined);
              }}
              className="h-9 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nama Pendamping *</Label>
          <Input
            value={localCompanion.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nama lengkap"
            disabled={isLocked}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Perusahaan</Label>
          <Input
            value={localCompanion.company || ""}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="Perusahaan"
            disabled={isLocked}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Departemen</Label>
          <Input
            value={localCompanion.department || ""}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="Departemen"
            disabled={isLocked}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input
            value={localCompanion.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
            disabled={isLocked}
            className="h-9"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Nomor HP</Label>
          <Input
            value={localCompanion.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="08xxx"
            disabled={isLocked}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}

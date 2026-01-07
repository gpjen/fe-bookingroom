"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { User, Search, CalendarIcon, Bed, X, Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RoomAvailabilityDialog } from "../room-availability-dialog";
import { MOCK_EMPLOYEES } from "../constants";
import type { BookingOccupant } from "@/app/(protected)/booking/request/_components/types";

interface OccupantFormProps {
  initialData?: BookingOccupant | null;
  onSubmit: (data: BookingOccupant) => void;
  onCancel: () => void;
  areaId: string;
}

export function OccupantForm({
  initialData,
  onSubmit,
  onCancel,
  areaId,
}: OccupantFormProps) {
  const initialOccupant = useMemo(
    () =>
      initialData || {
        type: "employee" as const,
        identifier: "",
        name: "",
        gender: "L" as const,
        phone: "",
        company: "",
        department: "",
        buildingId: "",
        buildingName: "",
        roomId: "",
        roomCode: "",
        bedId: "",
        bedCode: "",
      },
    [initialData]
  );

  const [occupantData, setOccupantData] =
    useState<Partial<BookingOccupant>>(initialOccupant);
  const [isEmployeeLocked, setIsEmployeeLocked] = useState(
    initialData?.type === "employee"
  );
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  const handleNikLookup = () => {
    if (occupantData.type !== "employee" || !occupantData.identifier) return;

    const employee = MOCK_EMPLOYEES.find(
      (emp) => emp.nik === occupantData.identifier
    );

    if (employee) {
      setOccupantData({
        ...occupantData,
        name: employee.name,
        company: employee.company,
        department: employee.department,
        phone: employee.phone,
        gender: employee.gender === "MALE" ? "L" : "P",
      });
      setIsEmployeeLocked(true);
      toast.success("Data karyawan ditemukan");
    } else {
      toast.error("NIK tidak ditemukan");
      setIsEmployeeLocked(false);
    }
  };

  const handleTypeChange = (type: "employee" | "guest") => {
    setOccupantData({
      ...occupantData,
      type,
      identifier: "",
      name: "",
      company: "",
      department: "",
      phone: "",
    });
    setIsEmployeeLocked(false);
  };

  const handleBedSelect = (
    bedId: string,
    roomId: string,
    roomCode: string,
    bedCode: string,
    buildingId: string,
    buildingName: string
  ) => {
    setOccupantData({
      ...occupantData,
      bedId,
      roomId,
      roomCode,
      bedCode,
      buildingId,
      buildingName,
    });
    setIsAvailabilityOpen(false);
  };

  const handleSubmit = () => {
    if (!occupantData.name || !occupantData.identifier) {
      toast.error("Nama dan NIK/ID wajib diisi");
      return;
    }
    if (!occupantData.inDate || !occupantData.outDate) {
      toast.error("Tanggal masuk dan keluar wajib diisi");
      return;
    }
    if (occupantData.outDate <= occupantData.inDate) {
      toast.error("Tanggal keluar harus setelah tanggal masuk");
      return;
    }

    const duration = differenceInDays(
      occupantData.outDate,
      occupantData.inDate
    );

    const newOccupant: BookingOccupant = {
      id: initialData?.id || `occ-${Date.now()}`,
      name: occupantData.name!,
      identifier: occupantData.identifier!,
      type: occupantData.type!,
      gender: occupantData.gender!,
      phone: occupantData.phone,
      company: occupantData.company,
      department: occupantData.department,
      inDate: occupantData.inDate!,
      outDate: occupantData.outDate!,
      duration,
      buildingId: occupantData.buildingId,
      buildingName: occupantData.buildingName,
      roomId: occupantData.roomId,
      roomCode: occupantData.roomCode,
      bedId: occupantData.bedId,
      bedCode: occupantData.bedCode,
    };

    onSubmit(newOccupant);
  };

  return (
    <>
      <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {initialData ? "Edit Penghuni" : "Tambah Penghuni"}
            </span>
          </div>
          <Badge
            variant={initialData ? "secondary" : "default"}
            className="text-xs"
          >
            {initialData ? "Edit" : "Baru"}
          </Badge>
        </div>

        {/* Type Selection */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={occupantData.type === "employee" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleTypeChange("employee")}
          >
            Karyawan
          </Button>
          <Button
            type="button"
            variant={occupantData.type === "guest" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleTypeChange("guest")}
          >
            Tamu
          </Button>
        </div>

        {/* NIK/ID with Lookup */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            {occupantData.type === "employee" ? "NIK" : "ID/Passport"} *
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={occupantData.identifier}
                onChange={(e) =>
                  setOccupantData({
                    ...occupantData,
                    identifier: e.target.value,
                  })
                }
                placeholder={
                  occupantData.type === "employee" ? "D0525000109" : "Nomor ID"
                }
                disabled={isEmployeeLocked}
                className="h-9 pr-16"
              />
              {occupantData.type === "employee" && !isEmployeeLocked && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleNikLookup}
                  disabled={!occupantData.identifier}
                  className="absolute right-1 top-1 h-7 px-2"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {isEmployeeLocked && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEmployeeLocked(false);
                  setOccupantData({
                    ...occupantData,
                    identifier: "",
                    name: "",
                    company: "",
                    department: "",
                    phone: "",
                  });
                }}
                className="h-9 px-2"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Personal Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nama *</Label>
            <Input
              value={occupantData.name}
              onChange={(e) =>
                setOccupantData({ ...occupantData, name: e.target.value })
              }
              placeholder="Nama lengkap"
              disabled={isEmployeeLocked}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Gender *</Label>
            <Select
              value={occupantData.gender}
              onValueChange={(value: "L" | "P") =>
                setOccupantData({ ...occupantData, gender: value })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telepon</Label>
            <Input
              value={occupantData.phone || ""}
              onChange={(e) =>
                setOccupantData({ ...occupantData, phone: e.target.value })
              }
              placeholder="08xxx"
              disabled={isEmployeeLocked}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Perusahaan</Label>
            <Input
              value={occupantData.company || ""}
              onChange={(e) =>
                setOccupantData({ ...occupantData, company: e.target.value })
              }
              placeholder="Perusahaan"
              disabled={isEmployeeLocked}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Departemen</Label>
            <Input
              value={occupantData.department || ""}
              onChange={(e) =>
                setOccupantData({ ...occupantData, department: e.target.value })
              }
              placeholder="Departemen"
              disabled={isEmployeeLocked}
              className="h-9"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Masuk *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal text-sm",
                    !occupantData.inDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {occupantData.inDate
                    ? format(occupantData.inDate, "dd/MM/yy", {
                        locale: localeId,
                      })
                    : "Pilih"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={occupantData.inDate}
                  onSelect={(date) =>
                    setOccupantData({ ...occupantData, inDate: date })
                  }
                  initialFocus
                  disabled={{
                    before: new Date(
                      new Date().setDate(new Date().getDate() + 1)
                    ),
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Keluar *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal text-sm",
                    !occupantData.outDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {occupantData.outDate
                    ? format(occupantData.outDate, "dd/MM/yy", {
                        locale: localeId,
                      })
                    : "Pilih"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={occupantData.outDate}
                  onSelect={(date) =>
                    setOccupantData({ ...occupantData, outDate: date })
                  }
                  disabled={(date) =>
                    occupantData.inDate ? date <= occupantData.inDate : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Durasi</Label>
            <div className="h-9 flex items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm">
              {occupantData.inDate && occupantData.outDate
                ? `${differenceInDays(
                    occupantData.outDate,
                    occupantData.inDate
                  )} hari`
                : "-"}
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="flex items-center justify-between p-2.5 border rounded-md bg-background">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            {occupantData.roomCode ? (
              <span>
                {occupantData.buildingName && `${occupantData.buildingName} / `}
                <span className="font-medium">
                  Kamar {occupantData.roomCode}
                </span>
                {occupantData.bedCode && ` / Bed ${occupantData.bedCode}`}
              </span>
            ) : (
              <span className="text-muted-foreground">Belum pilih kamar</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!areaId) {
                toast.error("Pilih area dulu");
                return;
              }
              setIsAvailabilityOpen(true);
            }}
            className="h-7 text-xs"
            disabled={!areaId}
          >
            {occupantData.roomCode ? "Ganti" : "Pilih"}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="h-8 gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {initialData ? "Update" : "Tambah"}
          </Button>
        </div>
      </div>

      <RoomAvailabilityDialog
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        areaId={areaId}
        buildingId={occupantData.buildingId}
        onBedSelect={handleBedSelect}
        currentSelection={
          occupantData.bedId && occupantData.roomId
            ? { bedId: occupantData.bedId, roomId: occupantData.roomId }
            : undefined
        }
      />
    </>
  );
}

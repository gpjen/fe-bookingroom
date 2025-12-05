"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Search,
  CalendarIcon,
  Clock,
  Bed,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RoomAvailabilityDialog } from "../room-availability-dialog";
import { MOCK_EMPLOYEES } from "../constants";
import type { OccupantFormData } from "@/app/(protected)/booking/request/_components/types";
import type {
  BookingType,
  Gender,
} from "@/app/(protected)/booking/request/_components/types";

interface OccupantFormProps {
  initialData?: OccupantFormData | null;
  onSubmit: (data: OccupantFormData) => void;
  onCancel: () => void;
  areaId: string;
}

export function OccupantForm({
  initialData,
  onSubmit,
  onCancel,
  areaId,
}: OccupantFormProps) {
  const [occupantData, setOccupantData] = useState<Partial<OccupantFormData>>({
    type: "employee",
    identifier: "",
    name: "",
    gender: "L",
    phone: "",
    company: "",
    department: "",
    companion: undefined,
    buildingId: "",
    buildingName: "",
    roomId: "",
    roomCode: "",
    bedId: "",
    bedCode: "",
  });

  const [isEmployeeLocked, setIsEmployeeLocked] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setOccupantData(initialData);
      if (initialData.type === "employee") {
        setIsEmployeeLocked(true);
      }
    } else {
      // Reset if no initial data (add mode)
      setOccupantData({
        type: "employee",
        identifier: "",
        name: "",
        gender: "L",
        phone: "",
        company: "",
        department: "",
        companion: undefined,
        buildingId: "",
        buildingName: "",
        roomId: "",
        roomCode: "",
        bedId: "",
        bedCode: "",
      });
      setIsEmployeeLocked(false);
    }
  }, [initialData]);

  const handleNikLookup = () => {
    if (occupantData.type !== "employee" || !occupantData.identifier) {
      return;
    }

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
        gender: employee.gender as Gender,
      });
      setIsEmployeeLocked(true);
      toast.success("Data karyawan ditemukan");
    } else {
      toast.error("NIK tidak ditemukan");
      setIsEmployeeLocked(false);
      setOccupantData({
        ...occupantData,
        name: "",
        company: "",
        department: "",
        phone: "",
      });
    }
  };

  const handleTypeChange = (type: BookingType) => {
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
    // Validation
    if (!occupantData.name || !occupantData.identifier) {
      toast.error("Nama dan NIK/ID wajib diisi");
      return;
    }

    if (!occupantData.inDate || !occupantData.outDate) {
      toast.error("Tanggal mulai dan selesai wajib diisi");
      return;
    }

    if (occupantData.outDate <= occupantData.inDate) {
      toast.error("Tanggal selesai harus setelah tanggal mulai");
      return;
    }

    const duration = differenceInDays(
      occupantData.outDate,
      occupantData.inDate
    );

    const newOccupant: OccupantFormData = {
      id: initialData?.id || `occ-${Date.now()}`,
      name: occupantData.name!,
      identifier: occupantData.identifier!,
      type: occupantData.type!,
      gender: occupantData.gender!,
      phone: occupantData.phone,
      company: occupantData.company,
      department: occupantData.department,
      companion: occupantData.companion,
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
      <Card className="mb-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-lg">
              {initialData ? "Edit Data Penghuni" : "Tambah Penghuni Baru"}
            </h4>
            <Badge variant={initialData ? "secondary" : "default"}>
              {initialData ? "Edit Mode" : "Tambah Baru"}
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label className="font-medium">Tipe Penghuni *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    occupantData.type === "employee" ? "default" : "outline"
                  }
                  className="flex-1"
                  onClick={() => handleTypeChange("employee")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Karyawan
                </Button>
                <Button
                  type="button"
                  variant={
                    occupantData.type === "guest" ? "default" : "outline"
                  }
                  className="flex-1"
                  onClick={() => handleTypeChange("guest")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Tamu
                </Button>
              </div>
            </div>

            {/* NIK/ID Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">
                  {occupantData.type === "employee" ? "NIK" : "ID/Passport"} *
                </Label>
                {isEmployeeLocked && (
                  <Badge variant="outline" className="text-xs">
                    Data terkunci
                  </Badge>
                )}
              </div>
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
                      occupantData.type === "employee"
                        ? "Masukkan NIK (contoh: D0525000109)"
                        : "Masukkan ID/Passport"
                    }
                    disabled={isEmployeeLocked}
                    className="h-11 pr-24"
                  />
                  {occupantData.type === "employee" && !isEmployeeLocked && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleNikLookup}
                      disabled={!occupantData.identifier}
                      className="absolute right-2 top-2 h-7 gap-1"
                    >
                      <Search className="h-3 w-3" />
                      Cari
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
                    className="h-11"
                  >
                    Reset
                  </Button>
                )}
              </div>
              {occupantData.type === "employee" && !isEmployeeLocked && (
                <p className="text-xs text-muted-foreground">
                  Masukkan NIK lalu klik "Cari" untuk mengambil data karyawan
                </p>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={occupantData.name}
                  onChange={(e) =>
                    setOccupantData({ ...occupantData, name: e.target.value })
                  }
                  placeholder="Nama lengkap"
                  disabled={isEmployeeLocked}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label>Jenis Kelamin *</Label>
                <Select
                  value={occupantData.gender}
                  onValueChange={(value: Gender) =>
                    setOccupantData({ ...occupantData, gender: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Telepon</Label>
                <Input
                  value={occupantData.phone}
                  onChange={(e) =>
                    setOccupantData({ ...occupantData, phone: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                  disabled={isEmployeeLocked}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label>Perusahaan</Label>
                <Input
                  value={occupantData.company}
                  onChange={(e) =>
                    setOccupantData({
                      ...occupantData,
                      company: e.target.value,
                    })
                  }
                  placeholder="Nama perusahaan"
                  disabled={isEmployeeLocked}
                  className="h-11"
                />
              </div>

              {occupantData.type === "employee" && (
                <div className="space-y-3">
                  <Label>Departemen</Label>
                  <Input
                    value={occupantData.department}
                    onChange={(e) =>
                      setOccupantData({
                        ...occupantData,
                        department: e.target.value,
                      })
                    }
                    placeholder="Departemen"
                    disabled={isEmployeeLocked}
                    className="h-11"
                  />
                </div>
              )}
            </div>

            {/* Duration Section */}
            <Card className="border border-blue-100 dark:border-blue-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium">Durasi Tinggal *</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tanggal Masuk</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !occupantData.inDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {occupantData.inDate ? (
                            format(occupantData.inDate, "dd MMM yyyy", {
                              locale: localeId,
                            })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
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
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Tanggal Keluar
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !occupantData.outDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {occupantData.outDate ? (
                            format(occupantData.outDate, "dd MMM yyyy", {
                              locale: localeId,
                            })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
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
                            occupantData.inDate
                              ? date <= occupantData.inDate
                              : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Total Durasi</Label>
                    <div className="h-11 flex items-center justify-center px-3 border rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <span className="font-bold text-primary text-lg">
                        {occupantData.inDate && occupantData.outDate
                          ? `${differenceInDays(
                              occupantData.outDate,
                              occupantData.inDate
                            )} Hari`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room & Bed Selection - gedung dipilih di dalam dialog */}
            <div className="space-y-3">
              <Label className="font-medium">
                Pilih Kamar & Bed (Opsional)
              </Label>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30">
                <div className="flex items-center gap-3">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <div>
                    {occupantData.roomCode && occupantData.bedCode ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {occupantData.buildingName && (
                            <>
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-0">
                                {occupantData.buildingName}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </>
                          )}
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0">
                            Kamar {occupantData.roomCode}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">
                            Bed {occupantData.bedCode}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setOccupantData({
                              ...occupantData,
                              buildingId: "",
                              buildingName: "",
                              roomId: "",
                              roomCode: "",
                              bedId: "",
                              bedCode: "",
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Belum ada kamar dipilih (pilih gedung lalu bed)
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!areaId) {
                      toast.error("Area belum dipilih");
                      return;
                    }
                    setIsAvailabilityOpen(true);
                  }}
                  className="gap-2"
                  disabled={!areaId}
                >
                  <Bed className="h-4 w-4" />
                  {occupantData.roomCode ? "Ganti Bed" : "Pilih Bed"}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Batal
            </Button>
            <Button type="button" onClick={handleSubmit} className="gap-2">
              {initialData ? "Update Data" : "Tambahkan Penghuni"}
            </Button>
          </div>
        </CardContent>
      </Card>

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

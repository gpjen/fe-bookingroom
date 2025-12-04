"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Trash2,
  User,
  Users,
  MapPin,
  Search,
  Bed,
  Building,
  FileText,
  ChevronRight,
  Clock,
  UserCheck,
} from "lucide-react";
import { RoomAvailabilityDialog } from "./room-availability-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type {
  BookingType,
  Gender,
} from "@/app/(protected)/booking/request/_components/types";

// Mock data
const MOCK_AREAS = [
  { id: "area-1", name: "Area Utara", code: "AU" },
  { id: "area-2", name: "Area Selatan", code: "AS" },
  { id: "area-3", name: "Area Timur", code: "AT" },
];

const MOCK_BUILDINGS = [
  { id: "bld-1", name: "Mess LQ 1", areaId: "area-1", code: "LQ1" },
  { id: "bld-2", name: "Mess LQ 2", areaId: "area-1", code: "LQ2" },
  { id: "bld-3", name: "Mess Selatan A", areaId: "area-2", code: "SA" },
  { id: "bld-4", name: "Mess Selatan B", areaId: "area-2", code: "SB" },
  { id: "bld-5", name: "Mess Timur", areaId: "area-3", code: "MT" },
];

// Mock employee database for NIK lookup
const MOCK_EMPLOYEES = [
  {
    nik: "D0525000109",
    name: "Gandi Purna Jen",
    company: "PT. Dharma Cipta Mulia",
    department: "Information and Technology",
    phone: "081234567890",
    email: "gandipurnajen@gmail.com",
    gender: "L",
  },
  {
    nik: "d12345",
    name: "Test Account",
    company: "PT. Halmahera Persada Lygend",
    department: "HR & GA",
    phone: "081234567891",
    email: "testaccount@gmail.com",
    gender: "P",
  },
];

interface OccupantFormData {
  id: string;
  name: string;
  identifier: string;
  type: BookingType;
  gender: Gender;
  phone?: string;
  company?: string;
  department?: string;
  isPendamping?: boolean;
  inDate?: Date;
  outDate?: Date;
  duration?: number;
  roomId?: string;
  roomCode?: string;
  bedId?: string;
  bedCode?: string;
}

const formSchema = z.object({
  areaId: z.string().min(1),
  buildingId: z.string().min(1),
  purpose: z.string().min(10),
  notes: z.string().optional(),
  occupants: z.array(z.any()).min(1),
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
    buildingId: "",
    purpose: "",
    notes: "",
  });
  const [occupants, setOccupants] = useState<OccupantFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOccupantForm, setShowOccupantForm] = useState(false);
  const [editingOccupant, setEditingOccupant] =
    useState<OccupantFormData | null>(null);

  // Room Availability Dialog State
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [selectedOccupantForBed, setSelectedOccupantForBed] = useState<
    string | null
  >(null);

  // Occupant form state
  const [occupantData, setOccupantData] = useState<Partial<OccupantFormData>>({
    type: "employee",
    identifier: "",
    name: "",
    gender: "L",
    phone: "",
    company: "",
    department: "",
    isPendamping: false,
    roomId: "",
    roomCode: "",
    bedId: "",
    bedCode: "",
  });

  const [isEmployeeLocked, setIsEmployeeLocked] = useState(false);

  const filteredBuildings = MOCK_BUILDINGS.filter(
    (b) => b.areaId === formData.areaId
  );

  // NIK Lookup for employees
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

  const handleAddOccupant = () => {
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
      id: editingOccupant?.id || `occ-${Date.now()}`,
      name: occupantData.name!,
      identifier: occupantData.identifier!,
      type: occupantData.type!,
      gender: occupantData.gender!,
      phone: occupantData.phone,
      company: occupantData.company,
      department: occupantData.department,
      isPendamping: occupantData.isPendamping,
      inDate: occupantData.inDate!,
      outDate: occupantData.outDate!,
      duration,
      roomId: occupantData.roomId,
      roomCode: occupantData.roomCode,
      bedId: occupantData.bedId,
      bedCode: occupantData.bedCode,
    };

    if (editingOccupant) {
      setOccupants(
        occupants.map((o) => (o.id === editingOccupant!.id ? newOccupant : o))
      );
      toast.success("Penghuni berhasil diupdate");
    } else {
      setOccupants([...occupants, newOccupant]);
      toast.success("Penghuni berhasil ditambahkan");
    }

    // Reset form
    resetOccupantForm();
  };

  const resetOccupantForm = () => {
    setOccupantData({
      type: "employee",
      identifier: "",
      name: "",
      gender: "L",
      phone: "",
      company: "",
      department: "",
      isPendamping: false,
      roomId: "",
      roomCode: "",
      bedId: "",
      bedCode: "",
    });
    setEditingOccupant(null);
    setShowOccupantForm(false);
    setIsEmployeeLocked(false);
  };

  const handleBedSelect = (
    bedId: string,
    roomId: string,
    roomCode: string,
    bedCode: string
  ) => {
    setOccupantData({
      ...occupantData,
      bedId,
      roomId,
      roomCode,
      bedCode,
    });
    setIsAvailabilityOpen(false);
  };

  const handleEditOccupant = (occupant: OccupantFormData) => {
    setOccupantData(occupant);
    setEditingOccupant(occupant);
    setShowOccupantForm(true);
    if (occupant.type === "employee") {
      setIsEmployeeLocked(true);
    }
  };

  const handleDeleteOccupant = (id: string) => {
    setOccupants(occupants.filter((o) => o.id !== id));
    toast.success("Penghuni berhasil dihapus");
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

  const handleSubmit = () => {
    setErrors({});

    // Check guest-companion rule
    const hasGuest = occupants.some((o) => o.type === "guest");
    const hasCompanion = occupants.some(
      (o) => o.type === "employee" && o.isPendamping
    );

    if (hasGuest && !hasCompanion) {
      toast.error("Tamu harus memiliki minimal 1 karyawan pendamping");
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
        buildingId: "",
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
          {/* Location Selection */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Lokasi Mess</h3>
                  <p className="text-sm text-muted-foreground">
                    Pilih area dan gedung mess
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Area <span className="text-destructive">*</span>
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      Pilih satu
                    </Badge>
                  </div>
                  <Select
                    value={formData.areaId}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        areaId: value,
                        buildingId: "",
                      });
                    }}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Pilih Area Mess" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_AREAS.map((area) => (
                        <SelectItem
                          key={area.id}
                          value={area.id}
                          className="py-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary font-medium text-xs">
                              {area.code}
                            </div>
                            <span>{area.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.areaId && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.areaId}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Gedung <span className="text-destructive">*</span>
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {filteredBuildings.length} tersedia
                    </Badge>
                  </div>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, buildingId: value })
                    }
                    disabled={!formData.areaId}
                  >
                    <SelectTrigger className="w-full h-11">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Pilih Gedung Mess" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBuildings.map((building) => (
                        <SelectItem
                          key={building.id}
                          value={building.id}
                          className="py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">
                                {building.name} - {building.code}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.buildingId && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.buildingId}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupants */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Daftar Penghuni</h3>
                    <p className="text-sm text-muted-foreground">
                      Tambah dan kelola penghuni mess
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {occupants.length} Penghuni
                  </Badge>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowOccupantForm(!showOccupantForm)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Penghuni
                  </Button>
                </div>
              </div>

              {errors.occupants && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive">
                  <p className="text-sm text-destructive">{errors.occupants}</p>
                </div>
              )}

              {/* Occupant Form */}
              {showOccupantForm && (
                <Card className="mb-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">
                        {editingOccupant
                          ? "Edit Data Penghuni"
                          : "Tambah Penghuni Baru"}
                      </h4>
                      <Badge
                        variant={editingOccupant ? "secondary" : "default"}
                      >
                        {editingOccupant ? "Edit Mode" : "Tambah Baru"}
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
                              occupantData.type === "employee"
                                ? "default"
                                : "outline"
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
                              occupantData.type === "guest"
                                ? "default"
                                : "outline"
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
                            {occupantData.type === "employee"
                              ? "NIK"
                              : "ID/Passport"}{" "}
                            *
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
                            {occupantData.type === "employee" &&
                              !isEmployeeLocked && (
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
                        {occupantData.type === "employee" &&
                          !isEmployeeLocked && (
                            <p className="text-xs text-muted-foreground">
                              Masukkan NIK lalu klik "Cari" untuk mengambil data
                              karyawan
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
                              setOccupantData({
                                ...occupantData,
                                name: e.target.value,
                              })
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
                              setOccupantData({
                                ...occupantData,
                                gender: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-11">
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
                              setOccupantData({
                                ...occupantData,
                                phone: e.target.value,
                              })
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
                            <Label className="font-medium">
                              Durasi Tinggal *
                            </Label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">
                                Tanggal Masuk
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-11 justify-start text-left font-normal",
                                      !occupantData.inDate &&
                                        "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {occupantData.inDate ? (
                                      format(
                                        occupantData.inDate,
                                        "dd MMM yyyy",
                                        {
                                          locale: localeId,
                                        }
                                      )
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
                                      setOccupantData({
                                        ...occupantData,
                                        inDate: date,
                                      })
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
                                      !occupantData.outDate &&
                                        "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {occupantData.outDate ? (
                                      format(
                                        occupantData.outDate,
                                        "dd MMM yyyy",
                                        {
                                          locale: localeId,
                                        }
                                      )
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
                                      setOccupantData({
                                        ...occupantData,
                                        outDate: date,
                                      })
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
                              <Label className="text-xs font-medium">
                                Total Durasi
                              </Label>
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

                      {/* Room & Bed Selection */}
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
                                  Belum ada kamar dipilih
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!formData.buildingId) {
                                toast.error(
                                  "Silakan pilih gedung terlebih dahulu"
                                );
                                return;
                              }
                              setIsAvailabilityOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Bed className="h-4 w-4" />
                            {occupantData.roomCode ? "Ganti Bed" : "Pilih Bed"}
                          </Button>
                        </div>
                      </div>

                      {/* Companion Toggle */}
                      {occupantData.type === "employee" && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <Label className="font-medium cursor-pointer">
                                Pendamping Tamu
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Tandai sebagai pendamping untuk tamu
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={occupantData.isPendamping}
                            onCheckedChange={(checked) =>
                              setOccupantData({
                                ...occupantData,
                                isPendamping: checked,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetOccupantForm}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddOccupant}
                        className="gap-2"
                      >
                        {editingOccupant ? "Update Data" : "Tambahkan Penghuni"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Occupants List */}
              {occupants.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Daftar Penghuni Aktif
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      Total: {occupants.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {occupants.map((occupant) => (
                      <Card
                        key={occupant.id}
                        className="border hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">
                                    {occupant.name}
                                  </h4>
                                  <Badge
                                    variant={
                                      occupant.type === "employee"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {occupant.type === "employee"
                                      ? "Karyawan"
                                      : "Tamu"}
                                  </Badge>
                                  {occupant.isPendamping && (
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    >
                                      Pendamping
                                    </Badge>
                                  )}
                                  {occupant.roomCode && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Kamar {occupant.roomCode}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {occupant.identifier} •{" "}
                                  {occupant.gender === "L"
                                    ? "Laki-laki"
                                    : "Perempuan"}
                                  {occupant.company && ` • ${occupant.company}`}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-primary">
                                    {occupant.inDate && occupant.outDate && (
                                      <>
                                        {format(
                                          occupant.inDate,
                                          "dd MMM yyyy",
                                          { locale: localeId }
                                        )}{" "}
                                        -{" "}
                                        {format(
                                          occupant.outDate,
                                          "dd MMM yyyy",
                                          { locale: localeId }
                                        )}
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                          {occupant.duration} hari
                                        </span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditOccupant(occupant)}
                                className="h-8 w-8"
                              >
                                <User className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleDeleteOccupant(occupant.id)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Belum ada penghuni ditambahkan
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Klik "Tambah Penghuni" untuk mulai menambahkan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purpose & Notes */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Informasi Booking</h3>
                  <p className="text-sm text-muted-foreground">
                    Detail tujuan dan catatan booking
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">
                      Tujuan Booking <span className="text-destructive">*</span>
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      Minimal 10 karakter
                    </Badge>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData({ ...formData, purpose: e.target.value })
                      }
                      placeholder="Contoh: Kunjungan kerja tim IT untuk maintenance sistem selama 3 hari..."
                      rows={4}
                      className="min-h-[120px] resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      {formData.purpose?.length || 0}/10
                    </div>
                  </div>
                  {errors.purpose && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.purpose}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="font-medium">
                    Catatan Tambahan (Opsional)
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Tambahkan catatan atau instruksi khusus jika diperlukan..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {occupants.length} penghuni •{" "}
              {formData.areaId && formData.buildingId
                ? "Lokasi terpilih"
                : "Pilih lokasi"}
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
      <RoomAvailabilityDialog
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        buildingId={formData.buildingId || ""}
        onBedSelect={handleBedSelect}
        currentSelection={
          occupantData.bedId && occupantData.roomId
            ? { bedId: occupantData.bedId, roomId: occupantData.roomId }
            : undefined
        }
      />
    </Dialog>
  );
}

"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  BedDouble,
  Building2,
  Briefcase,
  UserPlus,
  Mail,
  Phone,
  FileText,
  Upload,
  X,
  File,
  Image as ImageIcon,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type {
  BookingOccupant,
  CompanionInfo,
} from "@/app/(protected)/booking/request/_components/types";
import type { SelectedBed, BookingAttachment } from "../booking-request-types";
import Image from "next/image";

// Fallback for crypto.randomUUID (not available in all browsers)
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface OccupantDetailsFormProps {
  occupants: BookingOccupant[];
  selectedBeds: SelectedBed[];
  onOccupantUpdate: (index: number, data: Partial<BookingOccupant>) => void;
  companion?: CompanionInfo;
  onCompanionUpdate: (companion: CompanionInfo | undefined) => void;
  hasGuestOccupant: boolean;
  purpose: string;
  onPurposeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  attachments: BookingAttachment[];
  onAttachmentsChange: (attachments: BookingAttachment[]) => void;
  // Date range from search filter
  filterStartDate: Date;
  filterEndDate: Date;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function OccupantDetailsForm({
  occupants,
  selectedBeds,
  onOccupantUpdate,
  companion,
  onCompanionUpdate,
  hasGuestOccupant,
  purpose,
  onPurposeChange,
  notes,
  onNotesChange,
  attachments,
  onAttachmentsChange,
  filterStartDate,
  filterEndDate,
}: OccupantDetailsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: BookingAttachment[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} terlalu besar. Maksimal 5MB.`);
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(
          `File ${file.name} tidak didukung. Gunakan JPG, PNG, GIF, PDF, atau DOC.`
        );
        return;
      }

      const attachment: BookingAttachment = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        attachment.preview = URL.createObjectURL(file);
      }

      newAttachments.push(attachment);
    });

    onAttachmentsChange([...attachments, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  const isOccupantComplete = (occ: BookingOccupant) => {
    return occ.name && occ.identifier && occ.type && occ.gender;
  };

  return (
    <div className="space-y-6">
      {/* Purpose & Notes Section - FIRST */}
      <Card className="border-primary/20 pt-0">
        <CardHeader className="p-4 bg-primary/5">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Tujuan & Catatan
            <Badge variant="outline" className="ml-auto text-xs">
              Wajib
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">
              Tujuan Booking <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => onPurposeChange(e.target.value)}
              placeholder="Jelaskan tujuan booking ini (contoh: Perjalanan dinas ke site LQ untuk meeting proyek...)"
              rows={3}
              className={cn(
                purpose.length > 0 &&
                  purpose.length < 10 &&
                  "border-destructive"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "text-muted-foreground",
                  purpose.length > 0 &&
                    purpose.length < 10 &&
                    "text-destructive"
                )}
              >
                {purpose.length} / 10 karakter minimum
              </span>
              {purpose.length >= 10 && (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Informasi tambahan atau permintaan khusus..."
              rows={2}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Dokumen Pendukung (Opsional)
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed h-auto py-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm">
                  Klik untuk upload atau drag & drop
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, PDF, DOC (Max 5MB)
                </span>
              </div>
            </Button>

            {/* Uploaded Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att) => {
                  const FileIcon = getFileIcon(att.type);
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    >
                      {att.preview ? (
                        <Image
                          src={att.preview}
                          alt={att.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAttachment(att.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Occupant Forms */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Data Penghuni ({occupants.filter(isOccupantComplete).length}/
          {occupants.length})
        </h3>

        {occupants.map((occupant, index) => {
          const bed = selectedBeds[index];
          const isComplete = isOccupantComplete(occupant);

          return (
            <Card
              key={occupant.id}
              className={cn(
                "overflow-hidden transition-all pt-0",
                isComplete && "border-emerald-200 dark:border-emerald-800"
              )}
            >
              <CardHeader className="p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    Penghuni {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {bed.buildingName}
                    <span>•</span>
                    <BedDouble className="h-3 w-3" />
                    {bed.roomCode} - Bed {bed.bedCode}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`type-${index}`}>
                      Tipe <span className="text-destructive">*</span>
                      {bed.roomAllocation === "employee" && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (Kamar Karyawan)
                        </span>
                      )}
                      {bed.roomAllocation === "guest" && (
                        <span className="text-xs text-emerald-600 ml-1">
                          (Kamar Tamu - bebas)
                        </span>
                      )}
                    </Label>
                    {/* 
                      Kamar Employee: hanya karyawan (locked)
                      Kamar Guest: karyawan atau tamu (select)
                    */}
                    {bed.roomAllocation === "employee" ? (
                      // Kamar karyawan - locked ke Karyawan
                      <div
                        className={cn(
                          "flex items-center gap-2 h-10 px-3 border rounded-md",
                          occupant.type === "guest"
                            ? "bg-destructive/10 border-destructive"
                            : "bg-muted/50"
                        )}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm font-medium">Karyawan</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] ml-auto"
                        >
                          Terkunci
                        </Badge>
                      </div>
                    ) : (
                      // Kamar guest - bisa pilih karyawan atau tamu
                      <Select
                        value={occupant.type}
                        onValueChange={(value) =>
                          onOccupantUpdate(index, {
                            type: value as "employee" | "guest",
                          })
                        }
                      >
                        <SelectTrigger id={`type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Karyawan
                            </div>
                          </SelectItem>
                          <SelectItem value="guest">
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Tamu
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {/* Show error if guest in employee room */}
                    {bed.roomAllocation === "employee" &&
                      occupant.type === "guest" && (
                        <p className="text-[11px] text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Kamar karyawan tidak boleh untuk tamu
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`gender-${index}`}>
                      Gender <span className="text-destructive">*</span>
                      {bed.roomGender &&
                        bed.roomGender !== "mix" &&
                        bed.roomGender !== "flexible" && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Kamar{" "}
                            {bed.roomGender === "male" ? "Pria" : "Wanita"})
                          </span>
                        )}
                      {bed.roomGender === "flexible" && (
                        <span className="text-xs text-emerald-600 ml-1">
                          (Fleksibel - pilih salah satu)
                        </span>
                      )}
                    </Label>
                    {/* Gender locked for male/female rooms */}
                    {bed.roomGender === "male" ||
                    bed.roomGender === "female" ? (
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                        <span className="text-sm font-medium">
                          {bed.roomGender === "male"
                            ? "Laki-laki"
                            : "Perempuan"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] ml-auto"
                        >
                          Terkunci
                        </Badge>
                      </div>
                    ) : (
                      <Select
                        value={occupant.gender}
                        onValueChange={(value) =>
                          onOccupantUpdate(index, {
                            gender: value as "L" | "P",
                          })
                        }
                      >
                        <SelectTrigger id={`gender-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Laki-laki</SelectItem>
                          <SelectItem value="P">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Stay Dates - Flexible within filter range */}
                <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Periode Menginap
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      Range:{" "}
                      {format(filterStartDate, "dd MMM", { locale: localeId })}{" "}
                      - {format(filterEndDate, "dd MMM", { locale: localeId })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Check-in *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-9 justify-start text-left font-normal text-sm",
                              !occupant.inDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                            {occupant.inDate
                              ? format(occupant.inDate, "dd/MM/yy", {
                                  locale: localeId,
                                })
                              : "Pilih"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={occupant.inDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDuration = occupant.outDate
                                  ? differenceInDays(occupant.outDate, date)
                                  : differenceInDays(filterEndDate, date);
                                onOccupantUpdate(index, {
                                  inDate: date,
                                  duration: newDuration > 0 ? newDuration : 1,
                                  // Reset outDate if it becomes invalid
                                  ...(occupant.outDate &&
                                  date >= occupant.outDate
                                    ? { outDate: addDays(date, 1) }
                                    : {}),
                                });
                              }
                            }}
                            disabled={(date) =>
                              date < filterStartDate || date >= filterEndDate
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Check-out *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-9 justify-start text-left font-normal text-sm",
                              !occupant.outDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                            {occupant.outDate
                              ? format(occupant.outDate, "dd/MM/yy", {
                                  locale: localeId,
                                })
                              : "Pilih"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={occupant.outDate}
                            onSelect={(date) => {
                              if (date) {
                                const newDuration = occupant.inDate
                                  ? differenceInDays(date, occupant.inDate)
                                  : differenceInDays(date, filterStartDate);
                                onOccupantUpdate(index, {
                                  outDate: date,
                                  duration: newDuration > 0 ? newDuration : 1,
                                });
                              }
                            }}
                            disabled={(date) =>
                              date <= (occupant.inDate || filterStartDate) ||
                              date > filterEndDate
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Durasi</Label>
                      <div className="h-9 flex items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm">
                        {occupant.inDate && occupant.outDate
                          ? `${differenceInDays(
                              occupant.outDate,
                              occupant.inDate
                            )} malam`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name and Identifier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>
                      Nama Lengkap <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`name-${index}`}
                      value={occupant.name}
                      onChange={(e) =>
                        onOccupantUpdate(index, { name: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`identifier-${index}`}>
                      {occupant.type === "employee" ? "NIK" : "No. KTP/Paspor"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`identifier-${index}`}
                      value={occupant.identifier}
                      onChange={(e) =>
                        onOccupantUpdate(index, { identifier: e.target.value })
                      }
                      placeholder={
                        occupant.type === "employee"
                          ? "contoh: D12345678"
                          : "No. KTP atau Paspor"
                      }
                    />
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`phone-${index}`}
                      className="flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      Telepon
                    </Label>
                    <Input
                      id={`phone-${index}`}
                      value={occupant.phone || ""}
                      onChange={(e) =>
                        onOccupantUpdate(index, { phone: e.target.value })
                      }
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`email-${index}`}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={occupant.email || ""}
                      onChange={(e) =>
                        onOccupantUpdate(index, { email: e.target.value })
                      }
                      placeholder="email@domain.com"
                    />
                  </div>
                </div>

                {occupant.type === "employee" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`company-${index}`}>Perusahaan</Label>
                      <Input
                        id={`company-${index}`}
                        value={occupant.company || ""}
                        onChange={(e) =>
                          onOccupantUpdate(index, { company: e.target.value })
                        }
                        placeholder="Nama perusahaan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`department-${index}`}>Departemen</Label>
                      <Input
                        id={`department-${index}`}
                        value={occupant.department || ""}
                        onChange={(e) =>
                          onOccupantUpdate(index, {
                            department: e.target.value,
                          })
                        }
                        placeholder="Departemen/Divisi"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Companion Info (Required if any guest) */}
      {hasGuestOccupant && (
        <>
          <Separator />
          <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 pt-0">
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-600" />
                Data Pendamping
                <Badge variant="outline" className="ml-auto text-xs">
                  Wajib untuk Tamu
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Karyawan yang bertanggung jawab atas tamu
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companion-nik">
                    NIK Pendamping <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companion-nik"
                    value={companion?.nik || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: e.target.value,
                        name: companion?.name || "",
                      })
                    }
                    placeholder="NIK Karyawan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companion-name">
                    Nama Pendamping <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companion-name"
                    value={companion?.name || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: companion?.nik || "",
                        name: e.target.value,
                      })
                    }
                    placeholder="Nama lengkap"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="companion-email"
                    className="flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    id="companion-email"
                    type="email"
                    value={companion?.email || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: companion?.nik || "",
                        name: companion?.name || "",
                        email: e.target.value,
                      })
                    }
                    placeholder="email@domain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="companion-phone"
                    className="flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    Telepon
                  </Label>
                  <Input
                    id="companion-phone"
                    value={companion?.phone || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: companion?.nik || "",
                        name: companion?.name || "",
                        phone: e.target.value,
                      })
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companion-company">Perusahaan</Label>
                  <Input
                    id="companion-company"
                    value={companion?.company || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: companion?.nik || "",
                        name: companion?.name || "",
                        company: e.target.value,
                      })
                    }
                    placeholder="Perusahaan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companion-department">Departemen</Label>
                  <Input
                    id="companion-department"
                    value={companion?.department || ""}
                    onChange={(e) =>
                      onCompanionUpdate({
                        ...companion,
                        nik: companion?.nik || "",
                        name: companion?.name || "",
                        department: e.target.value,
                      })
                    }
                    placeholder="Departemen"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

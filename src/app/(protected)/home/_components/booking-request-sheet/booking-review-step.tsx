"use client";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  BedDouble,
  Building,
  FileText,
  UserPlus,
  Briefcase,
  Phone,
  MapPin,
  Paperclip,
  File,
  Image as ImageIcon,
  CheckCircle2,
  Users,
  Clock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type {
  BookingOccupant,
  CompanionInfo,
} from "@/app/(protected)/booking/request/_components/types";
import type { SelectedBed, BookingAttachment } from "../booking-request-types";
import { AREAS } from "../mock-data";
import { CompactProfileCard } from "@/components/common/compact-profile-card";
import Image from "next/image";

interface BookingReviewStepProps {
  searchParams: {
    areaId: string;
    startDate: Date;
    endDate: Date;
    totalPeople: number;
  };
  selectedBeds: SelectedBed[];
  occupants: BookingOccupant[];
  purpose: string;
  notes: string;
  attachments: BookingAttachment[];
  companion?: CompanionInfo;
}

export function BookingReviewStep({
  searchParams,
  selectedBeds,
  occupants,
  purpose,
  notes,
  attachments,
  companion,
}: BookingReviewStepProps) {
  const duration = differenceInDays(
    searchParams.endDate,
    searchParams.startDate
  );
  const areaName =
    AREAS.find((a) => a.id === searchParams.areaId)?.name ||
    searchParams.areaId;

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

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Data Lengkap!
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            Periksa kembali sebelum mengirim request
          </p>
        </div>
      </div>

      {/* Booking Info */}
      <Section title="Informasi Booking" icon={FileText}>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox icon={MapPin} label="Area" value={areaName} />
          <InfoBox
            icon={Users}
            label="Total Penghuni"
            value={`${occupants.length} Orang`}
          />
          <InfoBox
            icon={Calendar}
            label="Periode Filter"
            value={`${format(searchParams.startDate, "dd MMM", {
              locale: localeId,
            })} - ${format(searchParams.endDate, "dd MMM yyyy", {
              locale: localeId,
            })}`}
          />
          <InfoBox
            icon={Clock}
            label="Durasi Maksimal"
            value={`${duration} Malam`}
          />
        </div>
      </Section>

      {/* Tujuan & Catatan */}
      <Section title="Tujuan & Keperluan" icon={FileText}>
        <div className="space-y-3">
          <div className="text-sm">
            <p className="text-xs text-muted-foreground mb-1">Tujuan</p>
            <p className="font-medium">{purpose}</p>
          </div>
          {notes && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Catatan
              </p>
              <p className="italic">&quot;{notes}&quot;</p>
            </div>
          )}
        </div>
      </Section>

      {/* Lampiran */}
      {attachments.length > 0 && (
        <Section title="Lampiran" icon={Paperclip}>
          <div className="grid grid-cols-1 gap-2">
            {attachments.map((att) => {
              const FileIcon = getFileIcon(att.type);
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                >
                  {att.preview ? (
                    <Image
                      src={att.preview}
                      alt={att.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <FileIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Pendamping (jika ada tamu) */}
      {companion && companion.name && (
        <Section title="Informasi Pendamping (PIC)" icon={UserPlus}>
          <CompactProfileCard
            label="PIC"
            name={companion.name}
            identifier={companion.nik}
            company={companion.company || "-"}
            department={companion.department || "-"}
            phone={companion.phone}
            variant="amber"
          />
        </Section>
      )}

      {/* Daftar Penghuni */}
      <Section title="Daftar Penghuni" icon={Users}>
        <div className="space-y-3">
          {occupants.map((occupant, index) => {
            const bed = selectedBeds[index];
            const occDuration =
              occupant.inDate && occupant.outDate
                ? differenceInDays(occupant.outDate, occupant.inDate)
                : duration;

            return (
              <div
                key={occupant.id}
                className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm border border-transparent hover:border-border transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-6">
                      {occupant.type === "employee" ? "Karyawan" : "Tamu"}
                    </Badge>
                    <div>
                      <p className="font-semibold">{occupant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {occupant.identifier}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="h-6">
                    {occupant.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                </div>

                {/* Info Kontak */}
                {(occupant.phone || occupant.company) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {occupant.phone && (
                      <InfoRow
                        icon={Phone}
                        label="Telepon"
                        value={occupant.phone}
                      />
                    )}
                    {occupant.company && (
                      <InfoRow
                        icon={Briefcase}
                        label="Perusahaan"
                        value={occupant.company}
                      />
                    )}
                  </div>
                )}

                {/* Periode Menginap */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs">
                      Periode Menginap
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Check-in</p>
                      <p className="font-semibold">
                        {occupant.inDate
                          ? format(occupant.inDate, "dd MMM yyyy", {
                              locale: localeId,
                            })
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Check-out</p>
                      <p className="font-semibold">
                        {occupant.outDate
                          ? format(occupant.outDate, "dd MMM yyyy", {
                              locale: localeId,
                            })
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Durasi</p>
                      <p className="font-bold text-primary">
                        {occDuration} Malam
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lokasi Kamar */}
                <div className="pt-3 mt-1 border-t">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Gedung:</span>
                      <span className="font-medium">{bed.buildingName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Kamar:</span>
                      <span className="font-medium">{bed.roomCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Bed:</span>
                      <span className="font-medium">{bed.bedCode}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {bed.roomType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// Helper Components
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] font-medium text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

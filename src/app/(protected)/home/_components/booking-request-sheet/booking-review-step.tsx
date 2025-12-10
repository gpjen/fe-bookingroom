"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  BedDouble,
  Building2,
  FileText,
  UserPlus,
  Briefcase,
  Mail,
  Phone,
  Paperclip,
  File,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type {
  BookingOccupant,
  CompanionInfo,
} from "@/app/(protected)/booking/request/_components/types";
import type { SelectedBed, BookingAttachment } from "../booking-request-types";
import { AREAS } from "../mock-data";

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
  const duration = differenceInDays(searchParams.endDate, searchParams.startDate);
  const areaName = AREAS.find((a) => a.id === searchParams.areaId)?.name || "";

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
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Data Lengkap!
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            Periksa kembali data di bawah sebelum mengirim request
          </p>
        </div>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader className="p-4 bg-primary/5">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Ringkasan Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Lokasi</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {areaName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="font-semibold">
                {format(searchParams.startDate, "dd MMM yyyy", {
                  locale: localeId,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="font-semibold">
                {format(searchParams.endDate, "dd MMM yyyy", {
                  locale: localeId,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Durasi</p>
              <p className="font-semibold">{duration} Malam</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Bed</span>
            <Badge variant="secondary" className="gap-1">
              <BedDouble className="h-3 w-3" />
              {selectedBeds.length} bed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Purpose & Notes */}
      <Card>
        <CardHeader className="p-4 bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tujuan & Catatan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tujuan</p>
            <p className="text-sm bg-muted/30 p-3 rounded-lg">{purpose}</p>
          </div>
          {notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Catatan</p>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{notes}</p>
            </div>
          )}
          {attachments.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                Dokumen Terlampir ({attachments.length})
              </p>
              <div className="space-y-2">
                {attachments.map((att) => {
                  const FileIcon = getFileIcon(att.type);
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
                    >
                      {att.preview ? (
                        <img
                          src={att.preview}
                          alt={att.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupants & Beds */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Data Penghuni & Kamar
        </h3>
        {occupants.map((occupant, index) => {
          const bed = selectedBeds[index];
          return (
            <Card key={occupant.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs gap-1">
                        {occupant.type === "employee" ? (
                          <Briefcase className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {occupant.type === "employee" ? "Karyawan" : "Tamu"}
                      </Badge>
                      <Badge
                        variant={
                          occupant.gender === "L" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {occupant.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{occupant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {occupant.type === "employee" ? "NIK" : "ID"}:{" "}
                        {occupant.identifier}
                      </p>
                    </div>
                    {(occupant.phone || occupant.email) && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        {occupant.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {occupant.phone}
                          </p>
                        )}
                        {occupant.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {occupant.email}
                          </p>
                        )}
                      </div>
                    )}
                    {occupant.company && (
                      <p className="text-sm text-muted-foreground">
                        {occupant.company}
                        {occupant.department && ` • ${occupant.department}`}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right space-y-1 p-3 bg-muted/30 rounded-lg sm:min-w-[180px]">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground sm:justify-end">
                      <Building2 className="h-3 w-3" />
                      {bed.buildingName}
                    </div>
                    <div className="flex items-center gap-1 text-base font-bold sm:justify-end">
                      <BedDouble className="h-4 w-4" />
                      {bed.roomCode} - Bed {bed.bedCode}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {bed.roomType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Companion Info */}
      {companion && companion.name && (
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
          <CardHeader className="p-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-600" />
              Pendamping Tamu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-lg">{companion.name}</p>
              <p className="text-muted-foreground">NIK: {companion.nik}</p>
              {(companion.email || companion.phone) && (
                <div className="text-muted-foreground space-y-1">
                  {companion.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {companion.email}
                    </p>
                  )}
                  {companion.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {companion.phone}
                    </p>
                  )}
                </div>
              )}
              {companion.company && (
                <p className="text-muted-foreground">
                  {companion.company}
                  {companion.department && ` • ${companion.department}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Calendar,
  FileText,
  Users,
  Phone,
  Briefcase,
  MapPin,
  Bed,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  UserX,
  Download,
  LayoutGrid,
  ExternalLink,
  Paperclip,
} from "lucide-react";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type {
  BookingRequest,
  BookingOccupant,
  BookingStatus,
  OccupancyStatus,
} from "@/app/(protected)/booking/request/_components/types";

import { TicketDownloadDialog } from "./ticket-download-dialog";
import { CompactProfileCard } from "@/components/common/compact-profile-card";

interface MyBookingDetailDialogProps {
  booking: BookingRequest | null;
  onClose: () => void;
  onCancelRequest: (bookingId: string, reason: string) => void;
  onCancelOccupant: (
    bookingId: string,
    occupantId: string,
    reason: string
  ) => void;
}

export function MyBookingDetailDialog({
  booking,
  onClose,
  onCancelRequest,
  onCancelOccupant,
}: MyBookingDetailDialogProps) {
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [cancelOccupantOpen, setCancelOccupantOpen] = useState(false);
  const [selectedOccupant, setSelectedOccupant] =
    useState<BookingOccupant | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  if (!booking) return null;

  const canCancelRequest = booking.status === "PENDING";

  // Calculate days until check-in for an occupant
  const getDaysUntilCheckIn = (occupant: BookingOccupant): number => {
    if (!occupant.inDate) return Infinity;
    const checkInDate = startOfDay(new Date(occupant.inDate));
    const today = startOfDay(new Date());
    return differenceInCalendarDays(checkInDate, today);
  };

  // Check if cancellation is possible for an occupant
  const canCancelOccupant = (occupant: BookingOccupant) => {
    if (booking.status !== "APPROVED") return false;
    if (occupant.status !== "RESERVED") return false;
    if (occupant.actualCheckInAt) return false; // Already checked in

    const daysUntil = getDaysUntilCheckIn(occupant);
    // Can cancel if at least 1 day before check-in (H-1 or more)
    return daysUntil >= 1;
  };

  // Check if it's an urgent cancellation (H-1, needs warning)
  const isUrgentCancel = (occupant: BookingOccupant): boolean => {
    const daysUntil = getDaysUntilCheckIn(occupant);
    return daysUntil === 1; // Exactly 1 day before check-in
  };

  const handleCancelRequest = () => {
    if (!cancelReason.trim()) return;
    onCancelRequest(booking.id, cancelReason);
    setCancelRequestOpen(false);
    setCancelReason("");
    onClose();
  };

  const handleCancelOccupant = () => {
    if (!selectedOccupant || !cancelReason.trim()) return;
    onCancelOccupant(booking.id, selectedOccupant.id, cancelReason);
    setCancelOccupantOpen(false);
    setSelectedOccupant(null);
    setCancelReason("");
  };

  const openCancelOccupantDialog = (occupant: BookingOccupant) => {
    setSelectedOccupant(occupant);
    setCancelReason("");
    setCancelOccupantOpen(true);
  };

  const getStatusConfig = (status: BookingStatus) => {
    const config: Record<
      BookingStatus,
      { label: string; icon: typeof Clock; className: string }
    > = {
      PENDING: {
        label: "Menunggu Persetujuan",
        icon: Clock,
        className:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
      },
      APPROVED: {
        label: "Disetujui",
        icon: CheckCircle2,
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      REJECTED: {
        label: "Ditolak",
        icon: XCircle,
        className:
          "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400",
      },
      CANCELLED: {
        label: "Dibatalkan",
        icon: Ban,
        className:
          "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
      },
    };
    return config[status];
  };

  const getOccupancyStatusConfig = (status: OccupancyStatus) => {
    const config: Record<
      OccupancyStatus,
      { label: string; className: string }
    > = {
      PENDING: {
        label: "Menunggu",
        className:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
      },
      RESERVED: {
        label: "Terjadwal",
        className:
          "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
      },
      CHECKED_IN: {
        label: "Sudah Check-in",
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      CHECKED_OUT: {
        label: "Sudah Check-out",
        className:
          "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400",
      },
      CANCELLED: {
        label: "Dibatalkan",
        className:
          "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
      },
      NO_SHOW: {
        label: "Tidak Hadir",
        className:
          "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
      },
    };
    return config[status];
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const areaName = "Area 1"; // Placeholder until area data linked

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="!max-w-none !w-full md:!w-[600px] lg:!w-[700px] overflow-y-auto px-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold">
                  Detail Pemesanan
                </SheetTitle>
                <SheetDescription className="mt-1.5 font-mono text-sm flex items-center gap-2 flex-wrap">
                  <span>{booking.code}</span>
                  <Badge
                    variant="outline"
                    className={cn("gap-1.5 text-xs", statusConfig.className)}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="py-6 space-y-6">
              {/* Rejection Info - Now shows per-item rejection info */}
              {booking.status === "REJECTED" && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-300 text-sm">
                        Permintaan Ditolak
                      </p>
                      <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                        Satu atau lebih item dalam permintaan ini telah ditolak.
                        Lihat detail per penghuni di bawah.
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-rose-600 dark:text-rose-500 mt-2 italic">
                          Catatan: {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Approved Info - Show a general message since per-item approval info is in occupants */}
              {booking.status === "APPROVED" && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                        Permintaan Disetujui
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                        Semua item telah disetujui. Lihat detail per penghuni di
                        bawah.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Info */}
              {booking.status === "CANCELLED" && (
                <div className="p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-300 text-sm">
                        Dibatalkan oleh {booking.cancelledBy || "Admin"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                        {booking.cancelledAt &&
                          formatDateTime(booking.cancelledAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Info */}
              <Section title="Informasi Pengajuan" icon={Clock}>
                <div className="grid grid-cols-2 gap-3">
                  <InfoBox icon={MapPin} label="Area" value={areaName} />
                  <InfoBox
                    icon={Calendar}
                    label="Tanggal Pengajuan"
                    value={
                      booking?.createdAt
                        ? format(booking.createdAt, "dd MMM yyyy, HH:mm", {
                            locale: id,
                          })
                        : "-"
                    }
                  />
                  <InfoBox
                    icon={Users}
                    label="Jumlah Penghuni"
                    value={`${booking.occupants.length} Orang`}
                  />
                </div>
                {/* Removed expire date for now as it doesn't exist in type */}
              </Section>

              {/* Purpose */}
              <Section title="Tujuan" icon={FileText}>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {booking.purpose}
                  </p>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic whitespace-pre-wrap">
                      Catatan: {booking.notes}
                    </p>
                  )}
                </div>
              </Section>

              {/* Companion Info (if exists) */}
              {booking.companion && (
                <Section title="Informasi Pendamping (PIC)" icon={Users}>
                  <CompactProfileCard
                    label="PIC"
                    name={booking.companion.name || "-"}
                    identifier={booking.companion.nik || "-"}
                    company={booking.companion.company || "-"}
                    department={booking.companion.department || "-"}
                    phone={booking.companion.phone || "-"}
                    variant="amber"
                  />
                </Section>
              )}

              {/* Occupants */}
              <Section title="Daftar Penghuni" icon={Users}>
                <div className="space-y-3">
                  {booking.occupants.map((occupant) => {
                    const occStatusConfig = getOccupancyStatusConfig(
                      occupant.status as OccupancyStatus
                    );
                    const canCancel = canCancelOccupant(occupant);

                    return (
                      <div
                        key={occupant.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors",
                          occupant.status === "CANCELLED"
                            ? "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60"
                            : "bg-muted/50 border-transparent hover:border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant="outline" className="text-xs">
                                {occupant.type === "employee"
                                  ? "Karyawan"
                                  : "Tamu"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  occStatusConfig.className
                                )}
                              >
                                {occStatusConfig.label}
                              </Badge>

                              <Badge variant="secondary" className="text-xs">
                                {occupant.gender === "L"
                                  ? "Laki-laki"
                                  : "Perempuan"}
                              </Badge>
                            </div>

                            <p className="font-semibold text-sm">
                              {occupant.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {occupant.identifier}
                            </p>

                            {/* Company, Department & Contact Info */}
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {occupant.company && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {occupant.company}
                                  </span>
                                </div>
                              )}
                              {occupant.department && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Building className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {occupant.department}
                                  </span>
                                </div>
                              )}
                              {occupant.phone && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{occupant.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Stay Period */}
                            <div className="mt-3 pt-3 border-t">
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">
                                    Check-in
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(occupant.inDate)}
                                  </p>
                                  {occupant.actualCheckInAt && (
                                    <p className="text-emerald-600 text-[10px] mt-0.5">
                                      Aktual:{" "}
                                      {format(
                                        occupant.actualCheckInAt,
                                        "dd/MM HH:mm"
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Check-out
                                  </p>
                                  <p className="font-medium">
                                    {occupant.outDate
                                      ? formatDate(occupant.outDate)
                                      : "-"}
                                  </p>
                                  {occupant.actualCheckOutAt && (
                                    <p className="text-slate-600 text-[10px] mt-0.5">
                                      Aktual:{" "}
                                      {format(
                                        occupant.actualCheckOutAt,
                                        "dd/MM HH:mm"
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Durasi
                                  </p>
                                  <p className="font-medium text-primary">
                                    {occupant.duration
                                      ? `${occupant.duration} Hari`
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Building & Room Assignment - Show if any location data exists */}
                            {(occupant.buildingName ||
                              occupant.roomCode ||
                              occupant.bedCode) && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Gedung:
                                    </span>
                                    <span className="font-medium">
                                      {occupant.buildingName || "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Ruangan:
                                    </span>
                                    <span className="font-medium">
                                      {occupant.roomCode || "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Kasur:
                                    </span>
                                    <span className="font-medium">
                                      {occupant.bedCode || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Cancel Info */}
                            {occupant.status === "CANCELLED" && (
                              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs space-y-1">
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                  🚫 Dibatalkan
                                </p>
                                {occupant.cancelledAt && (
                                  <p className="text-muted-foreground">
                                    Waktu:{" "}
                                    <span className="text-foreground">
                                      {format(
                                        new Date(occupant.cancelledAt),
                                        "dd MMM yyyy, HH:mm",
                                        { locale: id }
                                      )}
                                    </span>
                                  </p>
                                )}
                                {occupant.cancelledByName && (
                                  <p className="text-muted-foreground">
                                    Oleh:{" "}
                                    <span className="text-foreground">
                                      {occupant.cancelledByName}
                                    </span>
                                  </p>
                                )}
                                {occupant.cancelledReason && (
                                  <p className="text-muted-foreground">
                                    Alasan:{" "}
                                    <span className="text-foreground">
                                      {occupant.cancelledReason}
                                    </span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Cancel Occupant Button */}
                          {canCancel && (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "hover:bg-rose-50 dark:hover:bg-rose-950/30",
                                  isUrgentCancel(occupant)
                                    ? "text-amber-600 hover:text-amber-700 border border-amber-300"
                                    : "text-rose-600 hover:text-rose-700"
                                )}
                                onClick={() =>
                                  openCancelOccupantDialog(occupant)
                                }
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Batalkan
                              </Button>
                              {isUrgentCancel(occupant) && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  ⚠️ H-1 Check-in
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Attachments */}
              {booking.attachments && booking.attachments.length > 0 && (
                <Section title="Lampiran" icon={Paperclip}>
                  <div className="grid grid-cols-1 gap-2">
                    {booking.attachments.map((file) => {
                      const isImage = isImageFile(file.fileType);
                      const isPdf = isPdfFile(file.fileType);

                      return (
                        <div
                          key={file.id}
                          onClick={() =>
                            handleAttachmentClick(
                              file.filePath,
                              file.fileName,
                              file.fileType
                            )
                          }
                          className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer group"
                        >
                          {/* Thumbnail for images, icon for others */}
                          {isImage ? (
                            <div className="w-10 h-10 rounded overflow-hidden border bg-muted flex-shrink-0">
                              <img
                                src={file.filePath}
                                alt={file.fileName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "h-10 w-10 rounded flex items-center justify-center flex-shrink-0",
                                isPdf
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-primary/10 text-primary"
                              )}
                            >
                              <FileText className="h-5 w-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)} •{" "}
                              {isImage ? "Gambar" : isPdf ? "PDF" : "Dokumen"}
                            </p>
                          </div>

                          <div className="text-muted-foreground group-hover:text-primary">
                            {isImage || isPdf ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Cancel button (if pending) */}
              <div>
                {canCancelRequest && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCancelReason("");
                      setCancelRequestOpen(true);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Batalkan Permintaan
                  </Button>
                )}
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2">
                {booking.status === "APPROVED" && (
                  <Button
                    size="sm"
                    onClick={() => setDownloadDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Unduh Tiket
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Request Dialog */}
      <AlertDialog open={cancelRequestOpen} onOpenChange={setCancelRequestOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Permintaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin membatalkan permintaan booking ini? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason" className="text-sm font-medium">
              Alasan Pembatalan <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              placeholder="Tuliskan alasan pembatalan..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              disabled={!cancelReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Ya, Batalkan Permintaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Occupant Dialog */}
      <AlertDialog
        open={cancelOccupantOpen}
        onOpenChange={setCancelOccupantOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedOccupant && isUrgentCancel(selectedOccupant)
                ? "⚠️ Peringatan: Pembatalan H-1"
                : "Batalkan Penghuni?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {selectedOccupant && isUrgentCancel(selectedOccupant) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                      ⚠️ Anda membatalkan penghuni ini 1 hari sebelum jadwal
                      check-in!
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                      Pembatalan mendadak dapat menyulitkan operasional.
                      Pastikan alasan pembatalan valid.
                    </p>
                  </div>
                )}
                <p>
                  Anda yakin ingin membatalkan{" "}
                  <strong className="text-foreground">
                    {selectedOccupant?.name}
                  </strong>{" "}
                  dari booking ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label
              htmlFor="cancelOccupantReason"
              className="text-sm font-medium"
            >
              Alasan Pembatalan <span className="text-rose-500">*</span>
              {selectedOccupant && isUrgentCancel(selectedOccupant) && (
                <span className="text-amber-600 text-xs ml-2">
                  (Wajib detail untuk H-1)
                </span>
              )}
            </Label>
            <Textarea
              id="cancelOccupantReason"
              placeholder={
                selectedOccupant && isUrgentCancel(selectedOccupant)
                  ? "Tuliskan alasan detail mengapa harus dibatalkan mendadak..."
                  : "Tuliskan alasan pembatalan..."
              }
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={
                selectedOccupant && isUrgentCancel(selectedOccupant) ? 4 : 3
              }
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedOccupant(null);
                setCancelReason("");
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOccupant}
              disabled={!cancelReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Ya, Batalkan Penghuni
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TicketDownloadDialog
        booking={booking}
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
      />
    </>
  );
}

// Helper Functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function handleAttachmentClick(
  filePath: string,
  fileName: string,
  fileType: string
) {
  if (isImageFile(fileType) || isPdfFile(fileType)) {
    // Open images and PDFs in new tab
    window.open(filePath, "_blank");
  } else {
    // Download other files
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Helper Components
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
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

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
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

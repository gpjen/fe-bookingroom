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
  AlertCircle,
  Ban,
  UserX,
  Download,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatDate } from "@/lib/utils";
import type {
  BookingRequest,
  BookingOccupant,
  BookingStatus,
  OccupantStatus,
} from "@/app/(protected)/booking/request/_components/types";
import { BUILDINGS } from "@/app/(protected)/booking/request/_components/mock-data";
import { TicketDownloadDialog } from "./ticket-download-dialog";

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

  const canCancelRequest = booking.status === "request";
  const canCancelOccupant = (occupant: BookingOccupant) => {
    return (
      booking.status === "approved" &&
      occupant.status === "scheduled" &&
      !occupant.actualCheckInAt
    );
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
      request: {
        label: "Menunggu Persetujuan",
        icon: Clock,
        className:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
      },
      approved: {
        label: "Disetujui",
        icon: CheckCircle2,
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
      rejected: {
        label: "Ditolak",
        icon: XCircle,
        className:
          "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400",
      },
      cancelled: {
        label: "Dibatalkan",
        icon: Ban,
        className:
          "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
      },
      expired: {
        label: "Kedaluwarsa",
        icon: AlertCircle,
        className:
          "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
      },
    };
    return config[status];
  };

  const getOccupantStatusConfig = (status: OccupantStatus) => {
    const config: Record<OccupantStatus, { label: string; className: string }> =
      {
        scheduled: {
          label: "Terjadwal",
          className:
            "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
        },
        checked_in: {
          label: "Sudah Check-in",
          className:
            "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
        },
        checked_out: {
          label: "Sudah Check-out",
          className:
            "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400",
        },
        cancelled: {
          label: "Dibatalkan",
          className:
            "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
        },
      };
    return config[status];
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const areaName =
    BUILDINGS.find((b) => b.areaId === booking.areaId)?.area || "-";

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
                  <span>{booking.bookingCode}</span>
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
              {/* Rejection Info */}
              {booking.status === "rejected" && booking.rejectReason && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-300 text-sm">
                        Alasan Penolakan
                      </p>
                      <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                        {booking.rejectReason}
                      </p>
                      {booking.adminNotes && (
                        <p className="text-xs text-rose-600 dark:text-rose-500 mt-2 italic">
                          Catatan: {booking.adminNotes}
                        </p>
                      )}
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
                    value={format(booking.requestedAt, "dd MMM yyyy, HH:mm", {
                      locale: id,
                    })}
                  />
                  <InfoBox
                    icon={Users}
                    label="Jumlah Penghuni"
                    value={`${booking.occupants.length} Orang`}
                  />
                </div>
                {booking.expiresAt && booking.status === "request" && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Permintaan akan kedaluwarsa pada{" "}
                        <strong>
                          {format(booking.expiresAt, "dd MMM yyyy", {
                            locale: id,
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </Section>

              {/* Purpose */}
              <Section title="Tujuan" icon={FileText}>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{booking.purpose}</p>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Catatan: {booking.notes}
                    </p>
                  )}
                </div>
              </Section>

              {/* Approval Info */}
              {booking.status === "approved" && booking.approvedAt && (
                <Section title="Informasi Persetujuan" icon={CheckCircle2}>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                          Disetujui oleh {booking.approvedBy || "Admin"}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                          {format(booking.approvedAt, "dd MMM yyyy, HH:mm", {
                            locale: id,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              {/* Occupants */}
              <Section title="Daftar Penghuni" icon={Users}>
                <div className="space-y-3">
                  {booking.occupants.map((occupant) => {
                    const occStatusConfig = getOccupantStatusConfig(
                      occupant.status as OccupantStatus
                    );
                    const canCancel = canCancelOccupant(occupant);

                    return (
                      <div
                        key={occupant.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors",
                          occupant.status === "cancelled"
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

                            {/* Contact & Company */}
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              {occupant.phone && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{occupant.phone}</span>
                                </div>
                              )}
                              {occupant.company && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{occupant.company}</span>
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

                            {/* Building & Room Assignment */}
                            {booking.status === "approved" &&
                              occupant.status !== "cancelled" && (
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

                            {/* Cancel Reason */}
                            {occupant.status === "cancelled" &&
                              occupant.cancelReason && (
                                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                  <p className="text-muted-foreground">
                                    Alasan pembatalan:{" "}
                                    <span className="text-foreground">
                                      {occupant.cancelReason}
                                    </span>
                                  </p>
                                </div>
                              )}
                          </div>

                          {/* Cancel Occupant Button */}
                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => openCancelOccupantDialog(occupant)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Batalkan
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Attachments */}
              {booking.attachments && booking.attachments.length > 0 && (
                <Section title="Lampiran" icon={FileText}>
                  <div className="grid grid-cols-1 gap-2">
                    {booking.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {file.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 space-y-3">
            <div className="flex gap-2">
              {canCancelRequest && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setCancelReason("");
                    setCancelRequestOpen(true);
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Batalkan Permintaan
                </Button>
              )}
              {booking.status === "approved" && (
                <Button
                  onClick={() => setDownloadDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Unduh Tiket
                </Button>
              )}
              <Button
                variant="outline"
                className={canCancelRequest ? "" : "w-full"}
                onClick={onClose}
              >
                Tutup
              </Button>
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
            <AlertDialogTitle>Batalkan Penghuni?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin membatalkan{" "}
              <strong>{selectedOccupant?.name}</strong> dari booking ini?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label
              htmlFor="cancelOccupantReason"
              className="text-sm font-medium"
            >
              Alasan Pembatalan <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="cancelOccupantReason"
              placeholder="Tuliskan alasan pembatalan..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
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

import { useState, useEffect } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  User,
  Building,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Bed,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { format } from "date-fns";
import { id } from "date-fns/locale";

import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

import { BookingRequest, OccupantStatus } from "./types";
import { BUILDINGS } from "./mock-data";

interface BookingDetailDialogProps {
  booking: BookingRequest | null;
  actionType: "view" | "approve" | "reject" | null;
  adminNotes: string;
  onAdminNotesChange: (notes: string) => void;
  rejectReason?: string;
  onRejectReasonChange?: (reason: string) => void;
  onConfirm: (updatedBooking?: BookingRequest) => void;
  onCancel: () => void;
  onRequestApprove?: () => void;
  onRequestReject?: () => void;
}

export function BookingDetailDialog({
  booking,
  actionType,
  adminNotes,
  onAdminNotesChange,
  rejectReason,
  onRejectReasonChange,
  onConfirm,
  onCancel,
  onRequestApprove,
  onRequestReject,
}: BookingDetailDialogProps) {
  const [occupantEdits, setOccupantEdits] = useState<
    Record<string, { room: string; bedCode: string }>
  >({});

  const [isRejecting, setIsRejecting] = useState(false);

  /* ---------------------------------------------
   * Reset state setiap kali booking berubah
   * ------------------------------------------- */
  useEffect(() => {
    if (!booking) return;

    const initial: Record<string, { room: string; bedCode: string }> = {};

    booking.occupants.forEach((occ) => {
      initial[occ.id] = {
        room: occ.roomId || "",
        bedCode: occ.bedId || "",
      };
    });

    setOccupantEdits(initial);
    setIsRejecting(false);
  }, [booking]);

  if (!booking) return null;

  const isPending = booking.status === "request";
  const isEditing = isPending && !isRejecting;

  /* ---------------------------------------------
   * Update occupant assignment
   * ------------------------------------------- */
  const handleOccupantChange = (
    id: string,
    field: "room" | "bedCode",
    value: string
  ) => {
    setOccupantEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  /* ---------------------------------------------
   * Handle Approve
   * ------------------------------------------- */
  const handleApprove = () => {
    const hasUnassigned = booking.occupants.some(
      (occ) => !occupantEdits[occ.id]?.room || !occupantEdits[occ.id]?.bedCode
    );

    if (hasUnassigned) {
      toast.error("Semua tamu harus memiliki ruangan dan bed.");
      return;
    }

    const updatedBooking: BookingRequest = {
      ...booking,
      occupants: booking.occupants.map((occ) => ({
        ...occ,
        roomId: occupantEdits[occ.id].room,
        bedId: occupantEdits[occ.id].bedCode,
        status: "scheduled" as OccupantStatus,
      })),
    };

    onConfirm(updatedBooking);
  };

  /* ---------------------------------------------
   * Handle Reject
   * ------------------------------------------- */
  const handleReject = () => {
    if (!rejectReason) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }

    onConfirm();
  };

  /* ---------------------------------------------
   * Status Style Config
   * ------------------------------------------- */
  const getStatusConfig = (status: BookingRequest["status"]) => {
    const base = "border px-2 py-0.5 rounded text-xs";
    switch (status) {
      case "request":
        return {
          label: "Menunggu",
          icon: Clock,
          className: `${base} bg-yellow-500/10 text-yellow-700 border-yellow-500/20`,
        };
      case "approved":
        return {
          label: "Disetujui",
          icon: CheckCircle2,
          className: `${base} bg-blue-500/10 text-blue-700 border-blue-500/20`,
        };
      case "rejected":
        return {
          label: "Ditolak",
          icon: XCircle,
          className: `${base} bg-red-500/10 text-red-700 border-red-500/20`,
        };
      case "cancelled":
        return {
          label: "Dibatalkan",
          icon: XCircle,
          className: `${base} bg-gray-500/10 text-gray-700 border-gray-500/20`,
        };
      default:
        return {
          label: status,
          icon: Clock,
          className: `${base} bg-gray-500/10 text-gray-700 border-gray-500/20`,
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const canApprove = isPending;
  const canReject = isPending;
  const isAction = actionType !== "view";

  /* ---------------------------------------------
   * UI Layout
   * ------------------------------------------- */

  return (
    <Sheet open={true} onOpenChange={onCancel}>
      <SheetContent className="!max-w-none !w-full md:!w-[600px] lg:!w-[800px] overflow-y-auto px-4">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold">
                Detail Permintaan Booking
              </SheetTitle>
              <SheetDescription className="mt-1.5 font-mono text-sm">
                <span className="mr-2">{booking.bookingCode}</span>
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
            {/* Request Info */}
            <Section title="Informasi Request" icon={FileText}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoBox
                  icon={Users}
                  label="Total Penghuni"
                  value={`${booking.occupants.length} Orang`}
                />
                <InfoBox
                  icon={Clock}
                  label="Kadaluarsa Pada"
                  value={
                    booking.expiresAt
                      ? format(booking.expiresAt, "dd MMM yyyy", { locale: id })
                      : "-"
                  }
                />
              </div>
            </Section>

            {/* Main Location Info */}
            <Section title="Lokasi yang Diminta" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoBox
                  icon={MapPin}
                  label="Area"
                  value={
                    BUILDINGS.find((b) => b.areaId === booking.areaId)?.area ||
                    booking.areaId
                  }
                />
                <InfoBox
                  icon={Building}
                  label="Gedung"
                  value={
                    (() => {
                      const uniqueBuildingIds = [
                        ...new Set(
                          booking.occupants
                            .filter((o) => o.buildingId)
                            .map((o) => o.buildingId)
                        ),
                      ];
                      const buildingNames = uniqueBuildingIds
                        .map((id) => BUILDINGS.find((b) => b.id === id)?.name)
                        .filter(Boolean);
                      return buildingNames.length > 0
                        ? buildingNames.join(", ")
                        : "Belum ditentukan";
                    })()
                  }
                />
              </div>
            </Section>

            {/* Requester Info */}
            <Section title="Informasi Pemohon" icon={User}>
              <div className="p-4 bg-muted/40 rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {booking.requester.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {booking.requester.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {booking.requester.nik}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={booking.requester.email}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Telepon"
                    value={booking.requester.phone}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label="Perusahaan"
                    value={booking.requester.company}
                  />
                  <InfoRow
                    icon={Users}
                    label="Departemen"
                    value={booking.requester.department}
                  />
                </div>
              </div>
            </Section>

            {/* Occupants Info */}
            <Section title="Daftar Penghuni / Tamu" icon={Users}>
              <div className="space-y-3">
                {booking.occupants.map((occupant) => {
                  const isEditing = actionType === "approve";
                  const currentEdit = occupantEdits[occupant.id] || {
                    room: "",
                    bedCode: "",
                  };

                  return (
                    <div
                      key={occupant.id}
                      className="p-4 bg-muted/50 rounded-lg space-y-3 text-sm border border-transparent hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6">
                              {occupant.type === "employee"
                                ? "Karyawan"
                                : "Tamu"}
                            </Badge>
                            {occupant.companion && (
                              <Badge
                                variant="secondary"
                                className="h-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              >
                                Pendamping: {occupant.companion.name}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{occupant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {occupant.identifier}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              occupant.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                            className="h-6"
                          >
                            {occupant.status === "scheduled"
                              ? "Terjadwal"
                              : occupant.status === "checked_in"
                              ? "Check-In"
                              : occupant.status === "checked_out"
                              ? "Check-Out"
                              : "Batal"}
                          </Badge>
                          <Badge variant="secondary" className="h-6">
                            {occupant.gender === "L"
                              ? "Laki-laki"
                              : "Perempuan"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <InfoRow
                          icon={Phone}
                          label="Telepon"
                          value={occupant.phone || "-"}
                        />
                        {occupant.company && (
                          <InfoRow
                            icon={Briefcase}
                            label="Perusahaan"
                            value={occupant.company}
                          />
                        )}
                      </div>

                      {/* Stay & Location Details */}
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-xs">
                            Periode Menginap
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Dari
                            </p>
                            <p className="font-semibold">
                              {formatDate(occupant.inDate)}
                            </p>
                            {occupant.actualCheckInAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Aktual:{" "}
                                {format(
                                  occupant.actualCheckInAt,
                                  "dd MMM yyyy, HH:mm",
                                  { locale: id }
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Sampai
                            </p>
                            <p className="font-semibold">
                              {formatDate(occupant.outDate)}
                            </p>
                            {occupant.actualCheckOutAt && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Aktual:{" "}
                                {format(
                                  occupant.actualCheckOutAt,
                                  "dd MMM yyyy, HH:mm",
                                  { locale: id }
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Durasi
                            </p>
                            <p className="font-bold text-primary">
                              {occupant.duration
                                ? `${occupant.duration} Hari`
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Room Assignment Section */}
                      <div className="pt-3 mt-1 border-t">
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`room-${occupant.id}`}
                                className="text-xs"
                              >
                                Ruangan
                              </Label>
                              <Select
                                value={currentEdit.room}
                                onValueChange={(value) => {
                                  handleOccupantChange(
                                    occupant.id,
                                    "room",
                                    value
                                  );
                                  // Clear bed selection when room changes
                                  // In the future, this will trigger an API call to fetch available beds for the selected room
                                  handleOccupantChange(
                                    occupant.id,
                                    "bedCode",
                                    ""
                                  );
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue placeholder="Pilih Kamar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <SelectItem
                                      key={i}
                                      value={`R-10${i + 1}`}
                                      className="text-xs"
                                    >
                                      R-10{i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`bed-${occupant.id}`}
                                className="text-xs"
                              >
                                Kasur
                              </Label>
                              <Select
                                value={currentEdit.bedCode}
                                onValueChange={(value) =>
                                  handleOccupantChange(
                                    occupant.id,
                                    "bedCode",
                                    value
                                  )
                                }
                                disabled={!currentEdit.room}
                              >
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue
                                    placeholder={
                                      currentEdit.room
                                        ? "Pilih Kasur"
                                        : "Pilih Ruangan Dulu"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {["B-01", "B-02", "B-03", "B-04"].map(
                                    (bed) => (
                                      <SelectItem
                                        key={bed}
                                        value={bed}
                                        className="text-xs"
                                      >
                                        {bed}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Ruangan:
                              </span>
                              <span className="font-medium">
                                {occupant.roomId || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Kasur:
                              </span>
                              <span className="font-medium">
                                {occupant.bedId || "-"}
                              </span>
                            </div>
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

            {/* Purpose */}
            <Section title="Tujuan & Keperluan" icon={FileText}>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Tujuan</p>
                  <p className="font-medium">{booking.purpose}</p>
                </div>
                {booking.notes && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Catatan Pemohon
                    </p>
                    <p className="italic">"{booking.notes}"</p>
                  </div>
                )}
              </div>
            </Section>

            {/* Approval History */}
            {booking.approvedAt && (
              <Section title="Riwayat Approval" icon={UserCheck}>
                <div className="space-y-2">
                  {booking.approvedAt && (
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-sm">
                        <p className="font-semibold">
                          Disetujui oleh {booking.approvedBy}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(booking.approvedAt, "dd MMM yyyy, HH:mm", {
                            locale: id,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Admin Section */}
            {(isAction || booking.adminNotes || booking.rejectReason) && (
              <Section title="Area Administrator" icon={UserCheck}>
                {isAction ? (
                  <div className="space-y-3">
                    {actionType === "reject" && (
                      <div>
                        <Label htmlFor="rejectReason" className="text-sm">
                          Alasan Penolakan{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="rejectReason"
                          placeholder="Contoh: Kapasitas Penuh"
                          className="mt-1.5"
                          value={rejectReason}
                          onChange={(e) =>
                            onRejectReasonChange?.(e.target.value)
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="adminNotes" className="text-sm">
                        Catatan Administrator
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Opsional
                      </p>
                    </div>
                    <Textarea
                      id="adminNotes"
                      placeholder={
                        actionType === "reject"
                          ? "Tuliskan detail alasan penolakan..."
                          : "Tambahkan catatan..."
                      }
                      value={adminNotes}
                      onChange={(e) => onAdminNotesChange(e.target.value)}
                      className={cn(
                        "resize-none text-sm",
                        actionType === "reject" &&
                          !adminNotes &&
                          "border-red-500/50"
                      )}
                      rows={3}
                    />
                    {actionType === "reject" && !rejectReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-2">
                        <AlertCircle className="h-3 w-3" />
                        Alasan penolakan wajib diisi
                      </p>
                    )}
                  </div>
                ) : booking.adminNotes || booking.rejectReason ? (
                  <div className="space-y-3">
                    {booking.rejectReason && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
                          Alasan Penolakan:
                        </p>
                        <p className="text-red-700 dark:text-red-300">
                          {booking.rejectReason}
                        </p>
                      </div>
                    )}
                    {booking.adminNotes && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          Catatan Admin:
                        </p>
                        <p>{booking.adminNotes}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 space-y-3 flex-shrink-0">
          {/* Action Buttons based on status */}
          {!isAction && (
            <div className="flex flex-wrap gap-2">
              {canApprove && (
                <Button
                  onClick={() => {
                    onRequestApprove?.();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Setujui
                </Button>
              )}
              {canReject && (
                <Button
                  onClick={() => {
                    onRequestReject?.();
                  }}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
              )}
            </div>
          )}

          {/* Confirm/Cancel for actions */}
          {isAction && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={
                  actionType === "approve" ? handleApprove : handleReject
                }
                disabled={
                  actionType === "reject" &&
                  (!rejectReason || !rejectReason.trim())
                }
                className={cn(
                  "flex-1",
                  actionType === "approve" && "bg-green-600 hover:bg-green-700",
                  actionType === "reject" && "bg-red-600 hover:bg-red-700"
                )}
              >
                {actionType === "approve" && "Konfirmasi Setuju"}
                {actionType === "reject" && "Konfirmasi Tolak"}
              </Button>
            </div>
          )}

          {/* Close button for view mode when no actions available */}
          {!isAction && !canApprove && !canReject && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              Tutup
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper Components
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
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
  icon: any;
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
  icon: any;
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

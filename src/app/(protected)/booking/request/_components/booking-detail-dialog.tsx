import { useState, useMemo, useEffect } from "react";

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
import { CompactProfileCard } from "@/components/common/compact-profile-card";

import { BookingRequest, OccupantStatus } from "./types";
import { BUILDINGS, ROOMS, BEDS } from "./mock-data";

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
  // State for occupant location edits (building, room, bed)
  const initialOccupantEdits = useMemo(() => {
    if (!booking) return {};
    const initial: Record<
      string,
      { buildingId: string; roomId: string; bedId: string }
    > = {};
    booking.occupants.forEach((occ) => {
      initial[occ.id] = {
        buildingId: occ.buildingId || "",
        roomId: occ.roomId || "",
        bedId: occ.bedId || "",
      };
    });
    return initial;
  }, [booking]);

  const [occupantEdits, setOccupantEdits] =
    useState<
      Record<string, { buildingId: string; roomId: string; bedId: string }>
    >(initialOccupantEdits);

  // Reset occupantEdits when booking changes
  useEffect(() => {
    setOccupantEdits(initialOccupantEdits);
  }, [initialOccupantEdits]);

  // Helper to get available rooms for a building
  const getRoomsForBuilding = (buildingId: string) => {
    return ROOMS.filter((r) => r.buildingId === buildingId);
  };

  // Helper to get available beds for a room
  const getBedsForRoom = (roomId: string) => {
    return BEDS.filter((b) => b.roomId === roomId);
  };

  if (!booking) return null;

  const isPending = booking.status === "request";

  /* ---------------------------------------------
   * Update occupant assignment
   * ------------------------------------------- */
  const handleOccupantChange = (
    id: string,
    field: "buildingId" | "roomId" | "bedId",
    value: string
  ) => {
    setOccupantEdits((prev) => {
      const current = prev[id] || { buildingId: "", roomId: "", bedId: "" };

      // When building changes, reset room and bed
      if (field === "buildingId") {
        return {
          ...prev,
          [id]: { buildingId: value, roomId: "", bedId: "" },
        };
      }

      // When room changes, reset bed
      if (field === "roomId") {
        return {
          ...prev,
          [id]: { ...current, roomId: value, bedId: "" },
        };
      }

      return {
        ...prev,
        [id]: { ...current, [field]: value },
      };
    });
  };

  /* ---------------------------------------------
   * Handle Approve
   * ------------------------------------------- */
  const handleApprove = () => {
    const hasUnassigned = booking.occupants.some(
      (occ) =>
        !occupantEdits[occ.id]?.buildingId ||
        !occupantEdits[occ.id]?.roomId ||
        !occupantEdits[occ.id]?.bedId
    );

    if (hasUnassigned) {
      toast.error("Semua penghuni harus memiliki gedung, ruangan, dan kasur.");
      return;
    }

    const updatedBooking: BookingRequest = {
      ...booking,
      occupants: booking.occupants.map((occ) => {
        const edit = occupantEdits[occ.id];
        const building = BUILDINGS.find((b) => b.id === edit.buildingId);
        const room = ROOMS.find((r) => r.id === edit.roomId);
        const bed = BEDS.find((b) => b.id === edit.bedId);

        return {
          ...occ,
          buildingId: edit.buildingId,
          buildingName: building?.name || "",
          roomId: edit.roomId,
          roomCode: room?.code || "",
          bedId: edit.bedId,
          bedCode: bed?.code || "",
          areaId: building?.areaId || "",
          areaName: building?.area || "",
          status: "scheduled" as OccupantStatus,
        };
      }),
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
      <SheetContent className="!max-w-none !w-full md:!w-[600px] lg:!w-[700px] overflow-y-auto px-4">
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
              <div className="grid grid-cols-1 gap-3">
                <InfoBox
                  icon={MapPin}
                  label="Area"
                  value={
                    BUILDINGS.find((b) => b.areaId === booking.areaId)?.area ||
                    booking.areaId
                  }
                />
              </div>
            </Section>

            {/* Requester Info */}
            <Section title="Informasi Pemohon" icon={User}>
              <CompactProfileCard
                label="Pemohon"
                name={booking.requester.name}
                identifier={booking.requester.nik}
                company={booking.requester.company}
                department={booking.requester.department}
                phone={booking.requester.phone}
                email={booking.requester.email}
                variant="blue"
              />
            </Section>

            {/* Companion Info (if exists) */}
            {booking.companion && (
              <Section title="Informasi Pendamping (PIC)" icon={Users}>
                <CompactProfileCard
                  label="PIC"
                  name={booking.companion.name}
                  identifier={booking.companion.nik}
                  company={booking.companion.company || "-"}
                  department={booking.companion.department || "-"}
                  phone={booking.companion.phone}
                  email={booking.companion.email}
                  variant="amber"
                />
              </Section>
            )}

            {/* Occupants Info */}
            <Section title="Daftar Penghuni / Tamu" icon={Users}>
              <div className="space-y-3">
                {booking.occupants.map((occupant) => {
                  const isEditing = actionType === "approve";
                  const currentEdit = occupantEdits[occupant.id] || {
                    buildingId: "",
                    roomId: "",
                    bedId: "",
                  };
                  const availableRooms = getRoomsForBuilding(
                    currentEdit.buildingId
                  );
                  const availableBeds = getBedsForRoom(currentEdit.roomId);

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
                          <div className="space-y-3">
                            {/* Show current assignment from requester if any */}
                            {(occupant.buildingName ||
                              occupant.roomCode ||
                              occupant.bedCode) && (
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                                  Permintaan dari pemohon:
                                </p>
                                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                                  <span>
                                    Gedung: {occupant.buildingName || "-"}
                                  </span>
                                  <span>
                                    Ruangan: {occupant.roomCode || "-"}
                                  </span>
                                  <span>Kasur: {occupant.bedCode || "-"}</span>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                              {/* Building Select */}
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`building-${occupant.id}`}
                                  className="text-xs"
                                >
                                  Gedung <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={currentEdit.buildingId}
                                  onValueChange={(value) =>
                                    handleOccupantChange(
                                      occupant.id,
                                      "buildingId",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue placeholder="Pilih Gedung" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BUILDINGS.map((building) => (
                                      <SelectItem
                                        key={building.id}
                                        value={building.id}
                                        className="text-xs"
                                      >
                                        {building.name} ({building.area})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Room Select */}
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`room-${occupant.id}`}
                                  className="text-xs"
                                >
                                  Ruangan{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={currentEdit.roomId}
                                  onValueChange={(value) =>
                                    handleOccupantChange(
                                      occupant.id,
                                      "roomId",
                                      value
                                    )
                                  }
                                  disabled={!currentEdit.buildingId}
                                >
                                  <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue
                                      placeholder={
                                        currentEdit.buildingId
                                          ? "Pilih Ruangan"
                                          : "Pilih Gedung Dulu"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableRooms.map((room) => (
                                      <SelectItem
                                        key={room.id}
                                        value={room.id}
                                        className="text-xs"
                                      >
                                        {room.code} - {room.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Bed Select */}
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`bed-${occupant.id}`}
                                  className="text-xs"
                                >
                                  Kasur <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={currentEdit.bedId}
                                  onValueChange={(value) =>
                                    handleOccupantChange(
                                      occupant.id,
                                      "bedId",
                                      value
                                    )
                                  }
                                  disabled={!currentEdit.roomId}
                                >
                                  <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue
                                      placeholder={
                                        currentEdit.roomId
                                          ? "Pilih Kasur"
                                          : "Pilih Ruangan Dulu"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableBeds.map((bed) => (
                                      <SelectItem
                                        key={bed.id}
                                        value={bed.id}
                                        className="text-xs"
                                      >
                                        Kasur {bed.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-xs">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Gedung:
                              </span>
                              <span className="font-medium">
                                {occupant.buildingName || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Ruangan:
                              </span>
                              <span className="font-medium">
                                {occupant.roomCode || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Kasur:
                              </span>
                              <span className="font-medium">
                                {occupant.bedCode || "-"}
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
                    <p className="italic">&quot;{booking.notes}&quot;</p>
                  </div>
                )}
              </div>
            </Section>

            {/* Status History - Approved */}
            {booking.status === "approved" && booking.approvedAt && (
              <Section title="Riwayat Status" icon={UserCheck}>
                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Disetujui oleh {booking.approvedBy || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(booking.approvedAt, "dd MMM yyyy, HH:mm", {
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* Status History - Rejected */}
            {booking.status === "rejected" && (
              <Section title="Riwayat Status" icon={XCircle}>
                <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-semibold text-red-700 dark:text-red-300">
                      Ditolak oleh Admin
                    </p>
                    {booking.rejectReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Alasan: {booking.rejectReason}
                      </p>
                    )}
                    {booking.adminNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Catatan: {booking.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Status History - Cancelled by Requester */}
            {booking.status === "cancelled" && (
              <Section title="Riwayat Status" icon={XCircle}>
                <div className="flex items-start gap-3 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                  <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      Dibatalkan oleh {booking.cancelledBy || "Pemohon"}
                    </p>
                    {booking.cancelledAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(booking.cancelledAt, "dd MMM yyyy, HH:mm", {
                          locale: id,
                        })}
                      </p>
                    )}
                    {booking.cancelledReason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Alasan: {booking.cancelledReason}
                      </p>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Status History - Expired */}
            {booking.status === "expired" && (
              <Section title="Riwayat Status" icon={AlertCircle}>
                <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-semibold text-orange-700 dark:text-orange-300">
                      Permintaan Kedaluwarsa
                    </p>
                    {booking.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kedaluwarsa pada{" "}
                        {format(booking.expiresAt, "dd MMM yyyy, HH:mm", {
                          locale: id,
                        })}
                      </p>
                    )}
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Permintaan tidak diproses dalam batas waktu yang
                      ditentukan
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* Admin Section - Only for action mode */}
            {isAction && (
              <Section title="Area Administrator" icon={UserCheck}>
                <div className="space-y-3">
                  {actionType === "reject" && (
                    <div>
                      <Label htmlFor="rejectReason" className="text-sm">
                        Alasan Penolakan <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="rejectReason"
                        placeholder="Contoh: Kapasitas Penuh"
                        className="mt-1.5"
                        value={rejectReason}
                        onChange={(e) => onRejectReasonChange?.(e.target.value)}
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

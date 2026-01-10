"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Bed,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  BookingDetailData,
  BookingOccupant,
  BOOKING_STATUS_CONFIG,
  OCCUPANCY_STATUS_CONFIG,
  GENDER_CONFIG,
  OCCUPANT_TYPE_CONFIG,
  OccupantType,
} from "./types";

// ==========================================
// PROPS
// ==========================================

interface BookingDetailDialogProps {
  booking: BookingDetailData | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onApprove?: (bookingId: string, notes?: string) => Promise<void>;
  onReject?: (
    bookingId: string,
    reason: string,
    notes?: string
  ) => Promise<void>;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function BookingDetailDialog({
  booking,
  isOpen,
  isLoading = false,
  onClose,
  onApprove,
  onReject,
}: BookingDetailDialogProps) {
  // State
  const [actionMode, setActionMode] = useState<"view" | "approve" | "reject">(
    "view"
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog closes
  const handleClose = () => {
    setActionMode("view");
    setAdminNotes("");
    setRejectReason("");
    onClose();
  };

  // Handle approve
  const handleApprove = async () => {
    if (!booking || !onApprove) return;

    setIsSubmitting(true);
    try {
      await onApprove(booking.id, adminNotes || undefined);
      toast.success("Booking berhasil disetujui");
      handleClose();
    } catch (error) {
      toast.error("Gagal menyetujui booking");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!booking || !onReject) return;

    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(booking.id, rejectReason, adminNotes || undefined);
      toast.success("Booking berhasil ditolak");
      handleClose();
    } catch (error) {
      toast.error("Gagal menolak booking");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  const isPending = booking.status === "PENDING";
  const statusConfig = BOOKING_STATUS_CONFIG[booking.status];

  // Calculate duration from occupants
  const dateRange = getDateRange(booking.occupants);
  const duration =
    dateRange.checkIn && dateRange.checkOut
      ? differenceInDays(dateRange.checkOut, dateRange.checkIn)
      : null;

  // Calculate how many items admin can approve/reject
  const approvableItems = booking.occupants.filter(
    (occ) => occ.canApprove && !occ.approvedAt && !occ.rejectedAt
  );
  const approvedItems = booking.occupants.filter((occ) => occ.approvedAt);
  const rejectedItems = booking.occupants.filter((occ) => occ.rejectedAt);
  const pendingItems = booking.occupants.filter(
    (occ) => !occ.approvedAt && !occ.rejectedAt
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="!max-w-none !w-full md:!w-[600px] lg:!w-[700px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold">
                Detail Permintaan Booking
              </SheetTitle>
              <SheetDescription className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm">{booking.code}</span>
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 text-xs", statusConfig.className)}
                >
                  <StatusIcon status={booking.status} className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              {/* Date Range Summary */}
              <Section title="Periode Menginap" icon={Calendar}>
                <div className="grid grid-cols-3 gap-4">
                  <InfoCard
                    label="Check-in"
                    value={
                      dateRange.checkIn
                        ? format(dateRange.checkIn, "dd MMM yyyy", {
                            locale: localeId,
                          })
                        : "-"
                    }
                  />
                  <InfoCard
                    label="Check-out"
                    value={
                      dateRange.checkOut
                        ? format(dateRange.checkOut, "dd MMM yyyy", {
                            locale: localeId,
                          })
                        : "-"
                    }
                  />
                  <InfoCard
                    label="Durasi"
                    value={duration ? `${duration} malam` : "-"}
                    highlight
                  />
                </div>
              </Section>

              {/* Requester Info */}
              <Section title="Informasi Pemohon" icon={User}>
                <PersonCard
                  name={booking.requesterName}
                  identifier={booking.requesterNik}
                  company={booking.requesterCompany}
                  department={booking.requesterDepartment}
                  email={booking.requesterEmail}
                  phone={booking.requesterPhone}
                  variant="blue"
                />
              </Section>

              {/* Companion (if exists) */}
              {booking.companion?.name && (
                <Section title="Pendamping (PIC Tamu)" icon={UserCheck}>
                  <PersonCard
                    name={booking.companion.name}
                    identifier={booking.companion.nik}
                    company={booking.companion.company}
                    department={booking.companion.department}
                    email={booking.companion.email}
                    phone={booking.companion.phone}
                    variant="amber"
                  />
                </Section>
              )}

              {/* Occupants */}
              <Section
                title={`Penghuni (${booking.occupants.length} orang)`}
                icon={Users}
              >
                {/* Approval Status Summary */}
                {isPending && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Menunggu:</span>
                        <span className="font-medium">
                          {pendingItems.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">
                          Disetujui:
                        </span>
                        <span className="font-medium">
                          {approvedItems.length}
                        </span>
                      </div>
                      {rejectedItems.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-muted-foreground">
                            Ditolak:
                          </span>
                          <span className="font-medium">
                            {rejectedItems.length}
                          </span>
                        </div>
                      )}
                    </div>
                    {approvableItems.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2">
                        ✓ Anda dapat menyetujui/menolak {approvableItems.length}{" "}
                        item
                      </p>
                    )}
                    {approvableItems.length === 0 &&
                      pendingItems.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Item yang tersisa menunggu approval dari admin gedung
                          lain
                        </p>
                      )}
                  </div>
                )}
                <div className="space-y-3">
                  {booking.occupants.map((occ) => (
                    <OccupancyCard key={occ.id} occupancy={occ} />
                  ))}
                </div>
              </Section>

              {/* Purpose */}
              <Section title="Tujuan & Keperluan" icon={FileText}>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Tujuan
                    </Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {booking.purpose}
                    </p>
                  </div>
                  {booking.notes && (
                    <div className="pt-2 border-t border-dashed">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Catatan
                      </Label>
                      <p className="text-sm italic mt-1 text-muted-foreground">
                        &quot;{booking.notes}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Attachments */}
              {booking.attachments.length > 0 && (
                <Section title="Lampiran" icon={Paperclip}>
                  <div className="grid gap-2">
                    {booking.attachments.map((att) => {
                      const isImage = isImageFile(att.fileType);
                      const isPdf = isPdfFile(att.fileType);

                      return (
                        <div
                          key={att.id}
                          onClick={() =>
                            handleAttachmentClick(
                              att.filePath,
                              att.fileName,
                              att.fileType
                            )
                          }
                          className="flex items-center justify-between p-3 border rounded-lg bg-background group hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {/* Thumbnail for images, icon for others */}
                            {isImage ? (
                              <div className="w-12 h-12 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                                <img
                                  src={att.filePath}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "p-2 rounded-md flex-shrink-0",
                                  isPdf
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-primary/10 text-primary"
                                )}
                              >
                                {isPdf ? (
                                  <FileText className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {att.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(att.fileSize)} •{" "}
                                {isImage ? "Gambar" : isPdf ? "PDF" : "Dokumen"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary">
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

              {/* Note: Approval/Rejection history is now shown per-item in OccupancyCard */}

              {/* Admin Action Section */}
              {actionMode !== "view" && (
                <Section title="Area Administrator" icon={UserCheck}>
                  <div className="space-y-4">
                    {actionMode === "reject" && (
                      <div>
                        <Label htmlFor="rejectReason">
                          Alasan Penolakan{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="rejectReason"
                          placeholder="Contoh: Kapasitas penuh"
                          className="mt-1.5"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="adminNotes">Catatan Administrator</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                        Opsional
                      </p>
                      <Textarea
                        id="adminNotes"
                        placeholder={
                          actionMode === "reject"
                            ? "Tuliskan detail alasan penolakan..."
                            : "Tambahkan catatan..."
                        }
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
          {actionMode === "view" ? (
            /* View Mode Actions */
            <div className="flex flex-wrap gap-2">
              {isPending && onApprove && approvableItems.length > 0 && (
                <Button
                  onClick={() => setActionMode("approve")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Setujui ({approvableItems.length} item)
                </Button>
              )}
              {isPending && onReject && approvableItems.length > 0 && (
                <Button
                  onClick={() => setActionMode("reject")}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak ({approvableItems.length} item)
                </Button>
              )}
              {isPending && approvableItems.length === 0 && (
                <p className="text-sm text-muted-foreground w-full text-center py-2">
                  Tidak ada item yang bisa Anda proses di gedung Anda
                </p>
              )}
              {(!isPending || approvableItems.length === 0) && (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  Tutup
                </Button>
              )}
            </div>
          ) : (
            /* Action Mode Buttons */
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionMode("view")}
                className="flex-1"
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={
                  actionMode === "approve" ? handleApprove : handleReject
                }
                disabled={
                  isSubmitting ||
                  (actionMode === "reject" && !rejectReason.trim())
                }
                className={cn(
                  "flex-1",
                  actionMode === "approve" && "bg-green-600 hover:bg-green-700",
                  actionMode === "reject" && "bg-red-600 hover:bg-red-700"
                )}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {actionMode === "approve"
                  ? "Konfirmasi Setuju"
                  : "Konfirmasi Tolak"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getDateRange(occupants: BookingOccupant[]) {
  if (!occupants.length) return { checkIn: null, checkOut: null };

  const checkInDates = occupants
    .map((o) => (o.inDate ? new Date(o.inDate).getTime() : 0))
    .filter((d) => d > 0);

  const checkOutDates = occupants
    .map((o) => (o.outDate ? new Date(o.outDate).getTime() : null))
    .filter(Boolean) as number[];

  return {
    checkIn: checkInDates.length ? new Date(Math.min(...checkInDates)) : null,
    checkOut: checkOutDates.length
      ? new Date(Math.max(...checkOutDates))
      : null,
  };
}

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
    // Download other files (DOC, DOCX, etc.)
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ==========================================
// SUB COMPONENTS
// ==========================================

function StatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  switch (status) {
    case "PENDING":
      return <Clock className={className} />;
    case "APPROVED":
      return <CheckCircle2 className={className} />;
    case "REJECTED":
    case "CANCELLED":
      return <XCircle className={className} />;
    default:
      return <Clock className={className} />;
  }
}

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

function InfoCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold truncate",
          highlight && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PersonCard({
  name,
  identifier,
  company,
  department,
  email,
  phone,
  variant = "blue",
}: {
  name: string;
  identifier?: string | null;
  company?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  variant?: "blue" | "amber";
}) {
  const bgColor =
    variant === "blue"
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-amber-500/10 border-amber-500/20";
  const textColor =
    variant === "blue"
      ? "text-blue-700 dark:text-blue-300"
      : "text-amber-700 dark:text-amber-300";

  return (
    <div className={cn("p-4 rounded-lg border", bgColor)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
            variant === "blue"
              ? "bg-blue-500/20 text-blue-600"
              : "bg-amber-500/20 text-amber-600"
          )}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold", textColor)}>{name}</p>
          {identifier && (
            <p className="text-xs text-muted-foreground font-mono">
              {identifier}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {company && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{company}</span>
          </div>
        )}
        {department && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building className="h-3 w-3" />
            <span className="truncate">{department}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OccupancyCard({ occupancy }: { occupancy: BookingOccupant }) {
  const occ = occupancy;
  // Flat object now

  const typeKey = (occ.type === "guest" ? "GUEST" : "EMPLOYEE") as OccupantType;
  const typeConfig = OCCUPANT_TYPE_CONFIG[typeKey];

  const genderKey = occ.gender === "P" ? "FEMALE" : "MALE";
  const genderConfig = GENDER_CONFIG[genderKey];

  const statusConfig =
    (occ.status && OCCUPANCY_STATUS_CONFIG[occ.status]) ||
    OCCUPANCY_STATUS_CONFIG.PENDING;

  const checkIn = occ.inDate
    ? format(new Date(occ.inDate), "dd MMM yyyy", {
        locale: localeId,
      })
    : "-";

  const checkOut = occ.outDate
    ? format(new Date(occ.outDate), "dd MMM yyyy", { locale: localeId })
    : "-";

  const nights =
    occ.outDate && occ.inDate
      ? differenceInDays(new Date(occ.outDate), new Date(occ.inDate))
      : null;

  return (
    <div
      className={cn(
        "p-4 bg-muted/50 rounded-lg border transition-colors",
        occ.canApprove && !occ.approvedAt && !occ.rejectedAt
          ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
          : "hover:border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 text-xs">
            {typeConfig.label}
          </Badge>
          {genderConfig && (
            <Badge variant="secondary" className="h-5 text-xs">
              {genderConfig.label}
            </Badge>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "h-5 text-xs",
            `bg-${statusConfig.color}-500/10 text-${statusConfig.color}-700 border-${statusConfig.color}-500/20`
          )}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Name & ID */}
      <div className="mb-3">
        <p className="font-semibold">{occ.name}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {occ.identifier || "-"}
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div>
          <p className="text-muted-foreground">Check-in</p>
          <p className="font-medium">{checkIn}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Check-out</p>
          <p className="font-medium">{checkOut}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Durasi</p>
          <p className="font-bold text-primary">
            {nights ? `${nights} malam` : "-"}
          </p>
        </div>
      </div>

      {/* Location */}
      {(occ.buildingName || occ.roomCode || occ.bedCode) && (
        <>
          <Separator className="my-3" />
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {occ.buildingName && (
              <div className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Gedung:</span>
                <span className="font-medium">{occ.buildingName}</span>
              </div>
            )}
            {occ.roomCode && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Ruangan:</span>
                <span className="font-medium">{occ.roomCode}</span>
              </div>
            )}
            {occ.bedCode && (
              <div className="flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Bed:</span>
                <span className="font-medium">{occ.bedCode}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cancellation Info */}
      {occ.status === "CANCELLED" && occ.cancelledAt && (
        <>
          <Separator className="my-3" />
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              🚫 Dibatalkan
            </p>
            <p className="text-muted-foreground">
              Waktu:{" "}
              <span className="text-foreground">
                {format(new Date(occ.cancelledAt), "dd MMM yyyy, HH:mm", {
                  locale: localeId,
                })}
              </span>
            </p>
            {occ.cancelledByName && (
              <p className="text-muted-foreground">
                Oleh:{" "}
                <span className="text-foreground">{occ.cancelledByName}</span>
              </p>
            )}
            {occ.cancelledReason && (
              <p className="text-muted-foreground">
                Alasan:{" "}
                <span className="text-foreground">{occ.cancelledReason}</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* Per-Item Approval Info */}
      {occ.approvedAt && (
        <>
          <Separator className="my-3" />
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs space-y-1">
            <p className="font-medium text-green-700 dark:text-green-300">
              ✅ Sudah Disetujui
            </p>
            <p className="text-muted-foreground">
              Waktu:{" "}
              <span className="text-foreground">
                {format(new Date(occ.approvedAt), "dd MMM yyyy, HH:mm", {
                  locale: localeId,
                })}
              </span>
            </p>
            {occ.approvedByName && (
              <p className="text-muted-foreground">
                Oleh:{" "}
                <span className="text-foreground">{occ.approvedByName}</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* Rejection Info */}
      {occ.rejectedAt && (
        <>
          <Separator className="my-3" />
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs space-y-1">
            <p className="font-medium text-red-700 dark:text-red-300">
              ❌ Ditolak
            </p>
            <p className="text-muted-foreground">
              Waktu:{" "}
              <span className="text-foreground">
                {format(new Date(occ.rejectedAt), "dd MMM yyyy, HH:mm", {
                  locale: localeId,
                })}
              </span>
            </p>
            {occ.rejectedByName && (
              <p className="text-muted-foreground">
                Oleh:{" "}
                <span className="text-foreground">{occ.rejectedByName}</span>
              </p>
            )}
            {occ.rejectedReason && (
              <p className="text-muted-foreground">
                Alasan:{" "}
                <span className="text-foreground">{occ.rejectedReason}</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* Can Approve Indicator */}
      {occ.canApprove && !occ.approvedAt && !occ.rejectedAt && (
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
          ✓ Anda dapat menyetujui item ini
        </div>
      )}
    </div>
  );
}

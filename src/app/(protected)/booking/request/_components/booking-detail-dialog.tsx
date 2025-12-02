import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookingRequest } from "./types";
import { Badge } from "@/components/ui/badge";
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
  IdCard,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BookingDetailDialogProps {
  booking: BookingRequest | null;
  actionType: "view" | "approve" | "reject" | null;
  adminNotes: string;
  onAdminNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookingDetailDialog({
  booking,
  actionType,
  adminNotes,
  onAdminNotesChange,
  onConfirm,
  onCancel,
}: BookingDetailDialogProps) {
  if (!booking || !actionType) return null;

  const getStatusConfig = (status: BookingRequest["status"]) => {
    switch (status) {
      case "request":
        return {
          label: "Menunggu",
          className:
            "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20",
          icon: Clock,
        };
      case "approved":
        return {
          label: "Disetujui",
          className:
            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          icon: CheckCircle2,
        };
      case "checkin":
        return {
          label: "Check-In",
          className:
            "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
          icon: CheckCircle2,
        };
      case "checkout":
        return {
          label: "Check-Out",
          className:
            "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          label: "Ditolak",
          className:
            "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
          icon: XCircle,
        };
      case "cancelled":
        return {
          label: "Dibatalkan",
          className:
            "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          className:
            "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const isAction = actionType !== "view";

  const getBookingTypeConfig = (type: BookingRequest["bookingType"]) => {
    const types = {
      employee: {
        label: "Karyawan",
        className:
          "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      },
      guest: {
        label: "Tamu",
        className:
          "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      },
      others: {
        label: "Lainnya",
        className:
          "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      },
    };
    return types[type];
  };

  const bookingTypeConfig = getBookingTypeConfig(booking.bookingType);

  const canApprove = booking.status === "request";
  const canReject = booking.status === "request";

  return (
    <Sheet open={true} onOpenChange={onCancel}>
      <SheetContent className="!max-w-none !w-full md:!w-[500px] lg:!w-[730px] overflow-y-auto px-4">
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
            {/* Requester Info */}
            <Section title="Informasi Pemohon" icon={User}>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {booking.requester.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {booking.requester.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.requester.nik}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", bookingTypeConfig.className)}
                  >
                    {bookingTypeConfig.label}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
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

            {/* Guest Info */}
            {booking.guestInfo && (
              <Section title="Informasi Tamu" icon={Users}>
                <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                  <InfoRow
                    icon={User}
                    label="Nama"
                    value={booking.guestInfo.name}
                  />
                  <InfoRow
                    icon={IdCard}
                    label="No. Identitas"
                    value={booking.guestInfo.idNumber}
                  />
                  <InfoRow
                    icon={User}
                    label="Jenis Kelamin"
                    value={
                      booking.guestInfo.gender === "L"
                        ? "Laki-laki"
                        : "Perempuan"
                    }
                  />
                  <InfoRow
                    icon={Phone}
                    label="Telepon"
                    value={booking.guestInfo.phone}
                  />
                  {booking.guestInfo.company && (
                    <InfoRow
                      icon={Briefcase}
                      label="Perusahaan"
                      value={booking.guestInfo.company}
                    />
                  )}
                </div>
              </Section>
            )}

            {/* Room Info */}
            <Section title="Detail Ruangan" icon={Building}>
              <div className="grid grid-cols-2 gap-3">
                <InfoBox icon={MapPin} label="Area" value={booking.area} />
                <InfoBox
                  icon={Building}
                  label="Gedung"
                  value={booking.building}
                />
                <InfoBox icon={Building} label="Ruangan" value={booking.room} />
                {booking.bedCode && (
                  <InfoBox
                    icon={Bed}
                    label="Kode Bed"
                    value={booking.bedCode}
                  />
                )}
              </div>
            </Section>

            {/* Date Info */}
            <Section title="Periode Menginap" icon={Calendar}>
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Check-in
                    </p>
                    <p className="font-semibold">
                      {format(booking.checkInDate, "dd MMM yyyy", {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      {booking.duration} Hari
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      Check-out
                    </p>
                    <p className="font-semibold">
                      {format(booking.checkOutDate, "dd MMM yyyy", {
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Section>

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
            {(isAction || booking.adminNotes) && (
              <Section title="Area Administrator" icon={UserCheck}>
                {isAction ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="adminNotes" className="text-sm">
                        Catatan Administrator
                        {actionType === "reject" && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {actionType === "reject"
                          ? "Wajib diisi untuk penolakan"
                          : "Opsional"}
                      </p>
                    </div>
                    <Textarea
                      id="adminNotes"
                      placeholder={
                        actionType === "reject"
                          ? "Tuliskan alasan penolakan..."
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
                    {actionType === "reject" && !adminNotes && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Catatan wajib diisi untuk penolakan
                      </p>
                    )}
                  </div>
                ) : booking.adminNotes ? (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Catatan Admin:
                    </p>
                    <p>{booking.adminNotes}</p>
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
                    onCancel();
                    // Parent will handle opening approve dialog
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
                    onCancel();
                    // Parent will handle opening reject dialog
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
                onClick={onConfirm}
                disabled={actionType === "reject" && !adminNotes.trim()}
                className={cn(
                  "flex-1",
                  actionType === "approve" && "bg-green-600 hover:bg-green-700",
                  actionType === "reject" && "bg-red-600 hover:bg-red-700"
                )}
              >
                {actionType === "approve" && "Setujui"}
                {actionType === "reject" && "Tolak"}
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
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="ml-2 font-medium truncate">{value}</span>
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

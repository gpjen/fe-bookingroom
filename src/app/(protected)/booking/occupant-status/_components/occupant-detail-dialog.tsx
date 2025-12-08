"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Bed,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { OccupantWithBooking } from "./mock-data";
import type { OccupantStatus } from "../../request/_components/types";

interface OccupantDetailDialogProps {
  occupant: OccupantWithBooking | null;
  onClose: () => void;
  onCheckIn: (occupant: OccupantWithBooking) => void;
  onCheckOut: (occupant: OccupantWithBooking) => void;
}

const getStatusConfig = (status: OccupantStatus) => {
  const configs: Record<
    OccupantStatus,
    { label: string; icon: typeof Clock; className: string }
  > = {
    scheduled: {
      label: "Terjadwal",
      icon: Clock,
      className:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
    },
    checked_in: {
      label: "Sudah Check-In",
      icon: LogIn,
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    checked_out: {
      label: "Sudah Check-Out",
      icon: LogOut,
      className:
        "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400",
    },
    cancelled: {
      label: "Dibatalkan",
      icon: XCircle,
      className:
        "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };
  return configs[status];
};

export function OccupantDetailDialog({
  occupant,
  onClose,
  onCheckIn,
  onCheckOut,
}: OccupantDetailDialogProps) {
  if (!occupant) return null;

  const status = occupant.status || "scheduled";
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const canCheckIn = status === "scheduled";
  const canCheckOut = status === "checked_in";

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="!max-w-none !w-full md:!w-[550px] lg:!w-[600px] overflow-y-auto px-6">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold">
                Detail Penghuni
              </SheetTitle>
              <SheetDescription className="mt-1.5 font-mono text-sm flex items-center gap-2 flex-wrap">
                <span>{occupant.bookingCode}</span>
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

        <div className="py-6 space-y-6">
          {/* Occupant Info */}
          <Section title="Informasi Penghuni" icon={User}>
            <div className="p-4 bg-muted/40 rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                  {occupant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{occupant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {occupant.identifier}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {occupant.type === "employee" ? "Karyawan" : "Tamu"}
                  </Badge>
                  <Badge variant="secondary">
                    {occupant.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {occupant.phone && (
                  <InfoRow
                    icon={Phone}
                    label="Telepon"
                    value={occupant.phone}
                  />
                )}
                {occupant.email && (
                  <InfoRow icon={Mail} label="Email" value={occupant.email} />
                )}
                {occupant.company && (
                  <InfoRow
                    icon={Briefcase}
                    label="Perusahaan"
                    value={occupant.company}
                  />
                )}
                {occupant.department && (
                  <InfoRow
                    icon={User}
                    label="Departemen"
                    value={occupant.department}
                  />
                )}
              </div>
            </div>
          </Section>

          {/* Requester Info */}
          <Section title="Informasi Pemohon" icon={User}>
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              <p className="font-medium">{occupant.requesterName}</p>
              <p className="text-muted-foreground text-xs">
                {occupant.requesterNik}
              </p>
            </div>
          </Section>

          {/* Location */}
          <Section title="Lokasi Penempatan" icon={Building}>
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                icon={MapPin}
                label="Area"
                value={occupant.areaName || "-"}
              />
              <InfoBox
                icon={Building}
                label="Gedung"
                value={occupant.buildingName || "-"}
              />
              <InfoBox
                icon={MapPin}
                label="Ruangan"
                value={occupant.roomCode || "-"}
              />
              <InfoBox
                icon={Bed}
                label="Kasur"
                value={occupant.bedCode || "-"}
              />
            </div>
          </Section>

          {/* Stay Period */}
          <Section title="Periode Menginap" icon={Calendar}>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Check-In</p>
                <p className="font-semibold text-sm">
                  {format(new Date(occupant.inDate), "dd MMM yyyy", {
                    locale: id,
                  })}
                </p>
                {occupant.actualCheckInAt && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Aktual:{" "}
                    {format(new Date(occupant.actualCheckInAt), "dd/MM HH:mm")}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Check-Out</p>
                <p className="font-semibold text-sm">
                  {occupant.outDate
                    ? format(new Date(occupant.outDate), "dd MMM yyyy", {
                        locale: id,
                      })
                    : "-"}
                </p>
                {occupant.actualCheckOutAt && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Aktual:{" "}
                    {format(new Date(occupant.actualCheckOutAt), "dd/MM HH:mm")}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Durasi</p>
                <p className="font-bold text-sm text-primary">
                  {occupant.duration} Hari
                </p>
              </div>
            </div>
          </Section>

          {/* Status Info */}
          {status === "checked_in" && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-sm">
                  Penghuni sedang menginap
                </span>
              </div>
              {occupant.actualCheckInAt && (
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 ml-6">
                  Check-in pada{" "}
                  {format(
                    new Date(occupant.actualCheckInAt),
                    "dd MMM yyyy, HH:mm",
                    { locale: id }
                  )}
                </p>
              )}
            </div>
          )}

          {status === "checked_out" && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                <LogOut className="h-4 w-4" />
                <span className="font-medium text-sm">
                  Penghuni telah check-out
                </span>
              </div>
              {occupant.actualCheckOutAt && (
                <p className="text-xs text-slate-600 dark:text-slate-500 mt-1 ml-6">
                  Check-out pada{" "}
                  {format(
                    new Date(occupant.actualCheckOutAt),
                    "dd MMM yyyy, HH:mm",
                    { locale: id }
                  )}
                </p>
              )}
            </div>
          )}

          {status === "cancelled" && (
            <div className="p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                <XCircle className="h-4 w-4" />
                <span className="font-medium text-sm">
                  Pemesanan dibatalkan
                </span>
              </div>
              {occupant.cancelledReason && (
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-1 ml-6">
                  Alasan: {occupant.cancelledReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex gap-2">
            {canCheckIn && (
              <Button
                onClick={() => onCheckIn(occupant)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Check-In
              </Button>
            )}
            {canCheckOut && (
              <Button
                onClick={() => onCheckOut(occupant)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Check-Out
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className={canCheckIn || canCheckOut ? "" : "w-full"}
            >
              Tutup
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
    <div className="flex items-start gap-2">
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

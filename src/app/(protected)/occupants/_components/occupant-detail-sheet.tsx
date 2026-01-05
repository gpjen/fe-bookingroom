"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  User,
  Phone,
  Mail,
  Building2,
  Clock,
  History,
  LogIn,
  LogOut,
  Ticket,
  AlertCircle,
  Calendar,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import {
  OccupantDetail,
  OccupantListItem,
  OccupancyStatus,
  OccupancyLogAction,
} from "../_actions/occupants.types";
import { getOccupantById } from "../_actions/occupants.actions";
import {
  checkInOccupant,
  checkOutOccupant,
} from "@/app/(protected)/properties/buildings/[id]/_actions/occupancy.actions";

// ========================================
// STATUS CONFIG
// ========================================

const statusConfig: Record<
  OccupancyStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    icon: Clock,
  },
  RESERVED: {
    label: "Dipesan",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    icon: Calendar,
  },
  CHECKED_IN: {
    label: "Aktif",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    icon: CheckCircle2,
  },
  CHECKED_OUT: {
    label: "Selesai",
    className: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
    icon: LogOut,
  },
  CANCELLED: {
    label: "Batal",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: AlertCircle,
  },
  NO_SHOW: {
    label: "No Show",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    icon: AlertCircle,
  },
};

const logActionConfig: Record<
  OccupancyLogAction,
  { label: string; icon: string; className: string }
> = {
  CREATED: { label: "Dibuat", icon: "📝", className: "text-blue-600" },
  CHECKED_IN: { label: "Check-In", icon: "✅", className: "text-emerald-600" },
  DATE_CHANGED: {
    label: "Ubah Tanggal",
    icon: "📅",
    className: "text-amber-600",
  },
  TRANSFERRED: {
    label: "Pindah Kamar",
    icon: "🔄",
    className: "text-purple-600",
  },
  EARLY_CHECKOUT: {
    label: "Checkout Awal",
    icon: "⏰",
    className: "text-orange-600",
  },
  CHECKED_OUT: { label: "Check-Out", icon: "👋", className: "text-slate-600" },
  CANCELLED: { label: "Dibatalkan", icon: "❌", className: "text-red-600" },
  STATUS_CHANGED: {
    label: "Update Status",
    icon: "🔧",
    className: "text-gray-600",
  },
};

// ========================================
// PROPS
// ========================================

interface OccupantDetailSheetProps {
  occupant: OccupantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

// ========================================
// HELPER COMPONENTS
// ========================================

const formatDate = (date: Date | null) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
};

// ========================================
// COMPONENT
// ========================================

export function OccupantDetailSheet({
  occupant,
  open,
  onOpenChange,
  onUpdate,
}: OccupantDetailSheetProps) {
  const [detail, setDetail] = useState<OccupantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();

  // Fetch detail data
  const fetchDetail = useCallback(async (occupantId: string) => {
    setLoading(true);
    try {
      const result = await getOccupantById(occupantId);
      if (result.success) {
        setDetail(result.data);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load data
  useEffect(() => {
    if (open && occupant?.id) {
      fetchDetail(occupant.id);
    } else if (!open) {
      setDetail(null);
      setActiveTab("profile");
    }
  }, [open, occupant?.id, fetchDetail]);

  // Action handlers
  const handleCheckIn = useCallback(
    async (occupancyId: string) => {
      if (!detail) return;
      startTransition(async () => {
        const result = await checkInOccupant(occupancyId);
        if (result.success) {
          toast.success("Check-in berhasil!");
          await fetchDetail(detail.id);
          onUpdate?.();
        } else {
          toast.error(result.error || "Gagal melakukan check-in");
        }
      });
    },
    [detail, fetchDetail, onUpdate]
  );

  const handleCheckOut = useCallback(
    async (occupancyId: string) => {
      if (!detail) return;
      startTransition(async () => {
        const result = await checkOutOccupant({ occupancyId });
        if (result.success) {
          toast.success("Check-out berhasil!");
          await fetchDetail(detail.id);
          onUpdate?.();
        } else {
          toast.error(result.error || "Gagal melakukan check-out");
        }
      });
    },
    [detail, fetchDetail, onUpdate]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0 border-l border-border/40 shadow-2xl">
        <SheetHeader className="px-6 py-6 pb-2 space-y-4 bg-gradient-to-b from-muted/30 to-transparent">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <SheetTitle className="text-xl font-bold tracking-tight">
                {loading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  detail?.occupantName || "Detail Penghuni"
                )}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2 text-sm">
                  {loading ? (
                    <Skeleton className="h-5 w-32" />
                  ) : (
                    detail && (
                      <div className="flex items-center gap-2 font-medium">
                        <Badge
                          variant="secondary"
                          className="rounded-md px-2 py-0.5 h-6 bg-background/50 backdrop-blur-sm border shadow-sm text-foreground/80"
                        >
                          {detail.occupantType === "EMPLOYEE"
                            ? "Karyawan"
                            : "Tamu"}
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          {detail.occupantCompany && (
                            <span className="truncate max-w-[200px]">
                              {detail.occupantCompany}
                            </span>
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {loading || !detail ? (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 pb-0">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger
                  value="profile"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger
                  value="stays"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Building2 className="h-4 w-4" />
                  Daftar Hunian
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 min-w-[20px] bg-muted-foreground/10"
                  >
                    {detail.occupancies.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <Separator className="mt-4 opacity-50" />

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="stays" className="m-0 space-y-6">
                  {detail.occupancies.length === 0 ? (
                    <div className="text-center py-12 px-4 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="font-medium">Tidak ada riwayat hunian</p>
                      <p className="text-sm mt-1 opacity-70">
                        Belum ada data check-in untuk penghuni ini.
                      </p>
                    </div>
                  ) : (
                    detail.occupancies.map((stay) => {
                      const canCheckIn =
                        stay.status === "RESERVED" || stay.status === "PENDING";
                      const canCheckOut = stay.status === "CHECKED_IN";
                      const StatusIcon = statusConfig[stay.status].icon;

                      return (
                        <div
                          key={stay.id}
                          className="group relative rounded-2xl border border-border/50 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-border/80"
                        >
                          <div className="p-5">
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-5">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`h-10 w-10 mt-1 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                    stay.status === "CHECKED_IN"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-base tracking-tight">
                                    {stay.bed.room.building.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                                    <Badge
                                      variant="outline"
                                      className="font-normal bg-background/50 h-5 px-1.5 text-xs text-muted-foreground border-border/60"
                                    >
                                      {stay.bed.room.building.area.name}
                                    </Badge>
                                    <span className="flex items-center gap-1.5 text-xs">
                                      <span className="w-1 h-1 rounded-full bg-border" />
                                      {stay.bed.room.name}
                                      <span className="w-1 h-1 rounded-full bg-border" />
                                      Bed {stay.bed.code}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`rounded-full px-2.5 py-0.5 border ${
                                  statusConfig[stay.status].className
                                }`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                {statusConfig[stay.status].label}
                              </Badge>
                            </div>

                            {/* Info & Dates */}
                            <div className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/20 p-4 mb-4">
                              <div className="flex flex-col sm:flex-row gap-6">
                                {/* Check In */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    <LogIn className="h-3.5 w-3.5" /> Check-In
                                  </div>
                                  <div className="font-semibold text-sm">
                                    {formatDate(stay.checkInDate)}
                                  </div>
                                  {stay.actualCheckIn && (
                                    <div className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDateTime(stay.actualCheckIn)}
                                    </div>
                                  )}
                                </div>

                                {/* Separator for desktop */}
                                <div className="hidden sm:block w-px bg-border/40 my-1" />

                                {/* Check Out */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    <LogOut className="h-3.5 w-3.5" /> Check-Out
                                  </div>
                                  <div className="font-semibold text-sm">
                                    {stay.checkOutDate ? (
                                      formatDate(stay.checkOutDate)
                                    ) : (
                                      <span className="italic text-muted-foreground font-normal">
                                        Belum ditentukan
                                      </span>
                                    )}
                                  </div>
                                  {stay.actualCheckOut && (
                                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDateTime(stay.actualCheckOut)}
                                    </div>
                                  )}
                                  {stay.originalCheckOutDate &&
                                    stay.checkOutDate &&
                                    stay.originalCheckOutDate.getTime() !==
                                      stay.checkOutDate.getTime() && (
                                      <div className="text-[11px] text-amber-600 mt-1 flex items-start gap-1 leading-tight bg-amber-50 p-1 rounded">
                                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                        Awal:{" "}
                                        {formatDate(stay.originalCheckOutDate)}
                                      </div>
                                    )}
                                </div>
                              </div>

                              {stay.booking?.code && (
                                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Ticket className="h-3.5 w-3.5 text-primary/70" />
                                  Booking Ref:{" "}
                                  <span className="font-mono text-foreground">
                                    {stay.booking.code}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions & Logs */}
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full border-t border-border/30 pt-1"
                            >
                              <AccordionItem value="logs" className="border-0">
                                <div className="flex items-center justify-between">
                                  <AccordionTrigger className="py-2 hover:no-underline text-xs font-medium text-muted-foreground data-[state=open]:text-primary pr-0 flex-1 justify-start gap-2">
                                    <History className="h-3.5 w-3.5" />
                                    Riwayat Aktivitas ({stay.logs.length})
                                  </AccordionTrigger>

                                  {/* Action Buttons floated right */}
                                  <div className="flex gap-2">
                                    {canCheckIn && (
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs px-3 shadow-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCheckIn(stay.id);
                                        }}
                                        disabled={isPending}
                                      >
                                        Check-In
                                      </Button>
                                    )}
                                    {canCheckOut && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs px-3 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCheckOut(stay.id);
                                        }}
                                        disabled={isPending}
                                      >
                                        Check-Out
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <AccordionContent className="pt-2 pb-0">
                                  {stay.logs.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/10 rounded-lg italic">
                                      Belum ada aktivitas tercatat
                                    </div>
                                  ) : (
                                    <div className="relative pl-3 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border/40">
                                      {stay.logs.map((log) => {
                                        const config =
                                          logActionConfig[log.action];
                                        return (
                                          <div
                                            key={log.id}
                                            className="relative pl-5 text-sm"
                                          >
                                            <div className="absolute left-[-4px] top-1.5 h-2.5 w-2.5 rounded-full bg-background border-2 border-muted-foreground/30 ring-2 ring-background" />

                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center justify-between gap-2">
                                                <span
                                                  className={`font-semibold text-xs ${config.className} flex items-center gap-1.5`}
                                                >
                                                  {config.label}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                  {formatDistanceToNow(
                                                    new Date(log.performedAt),
                                                    {
                                                      addSuffix: true,
                                                      locale: id,
                                                    }
                                                  )}
                                                </span>
                                              </div>

                                              <div className="text-xs text-foreground/80">
                                                {log.buildingName}{" "}
                                                <span className="text-muted-foreground">
                                                  •
                                                </span>{" "}
                                                {log.roomCode}
                                              </div>

                                              {log.notes && (
                                                <div className="text-xs text-muted-foreground italic bg-muted/20 px-2 py-1 rounded mt-0.5">
                                                  &quot;{log.notes}&quot;
                                                </div>
                                              )}

                                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <User className="h-3 w-3" />{" "}
                                                {log.performedByName}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="profile" className="m-0 space-y-6">
                  {/* Personal Info */}
                  <div className="grid gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="h-4 w-4" /> Informasi Pribadi
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Nama Lengkap
                          </div>
                          <div className="font-medium">
                            {detail.occupantName}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Nomor Induk (NIK/KTP)
                          </div>
                          <div className="font-medium font-mono tracking-wide">
                            {detail.occupantNik}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Jenis Kelamin
                          </div>
                          <div className="font-medium">
                            {detail.occupantGender === "MALE"
                              ? "Laki-Laki"
                              : "Perempuan"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Kontak
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl flex items-start gap-3">
                          <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Telepon
                            </div>
                            <div className="font-medium text-sm">
                              {detail.occupantPhone || "-"}
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl flex items-start gap-3">
                          <div className="p-2 bg-purple-100/50 text-purple-600 rounded-lg">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Email
                            </div>
                            <div className="font-medium text-sm break-all">
                              {detail.occupantEmail || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(detail.occupantDepartment ||
                      detail.occupantPosition ||
                      detail.occupantCompany) && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> Pekerjaan
                        </h3>
                        <div className="p-4 rounded-xl border bg-muted/10 border-border/40 grid grid-cols-2 gap-y-4 gap-x-6">
                          <div className="col-span-2 space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Perusahaan / Instansi
                            </div>
                            <div className="font-medium">
                              {detail.occupantCompany || "-"}
                            </div>
                          </div>
                          {detail.occupantDepartment && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Departemen
                              </div>
                              <div className="font-medium text-sm">
                                {detail.occupantDepartment}
                              </div>
                            </div>
                          )}
                          {detail.occupantPosition && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Jabatan
                              </div>
                              <div className="font-medium text-sm">
                                {detail.occupantPosition}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

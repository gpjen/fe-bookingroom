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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Bed,
  Clock,
  History,
  LogIn,
  LogOut,
  Ticket,
  AlertCircle,
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
  { label: string; className: string }
> = {
  PENDING: {
    label: "Menunggu",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  RESERVED: {
    label: "Dipesan",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  CHECKED_IN: {
    label: "Check-In",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  NO_SHOW: {
    label: "Tidak Hadir",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

const logActionConfig: Record<
  OccupancyLogAction,
  { label: string; icon: string; className: string }
> = {
  CREATED: { label: "Dibuat", icon: "📝", className: "text-blue-600" },
  CHECKED_IN: { label: "Check-In", icon: "✅", className: "text-emerald-600" },
  DATE_CHANGED: {
    label: "Tanggal Diubah",
    icon: "📅",
    className: "text-amber-600",
  },
  TRANSFERRED: {
    label: "Dipindahkan",
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
    label: "Status Berubah",
    icon: "🔧",
    className: "text-gray-600",
  },
};

// ========================================
// PROPS
// ========================================

interface OccupantDetailSheetProps {
  occupant: OccupantListItem | null; // Note: This list item is now an Occupant Summary
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
  const [activeTab, setActiveTab] = useState("stays");
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
      // occupant.id is now the Occupant ID
      fetchDetail(occupant.id);
    }

    if (!open) {
      setDetail(null);
      setActiveTab("stays");
    }
  }, [open, occupant?.id, fetchDetail]);

  // Action handlers (Per Occupancy)
  const handleCheckIn = useCallback(
    async (occupancyId: string) => {
      if (!detail) return;
      startTransition(async () => {
        const result = await checkInOccupant(occupancyId);
        if (result.success) {
          toast.success("Check-in berhasil!");
          // Reload detail
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
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl">
                {loading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  detail?.occupantName || "Detail Penghuni"
                )}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2 text-sm">
                  {loading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    detail && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            detail.occupantType === "EMPLOYEE"
                              ? "default"
                              : "secondary"
                          }
                          className="rounded-full"
                        >
                          {detail.occupantType === "EMPLOYEE"
                            ? "Karyawan"
                            : "Tamu"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {detail.occupantCompany || "-"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </SheetDescription>
            </div>
            {/* Additional Header Actions or Status could go here */}
          </div>
        </SheetHeader>

        {loading || !detail ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stays" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Daftar Hunian
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 min-w-[20px]"
                  >
                    {detail.occupancies.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profil Biodata
                </TabsTrigger>
              </TabsList>
            </div>

            <Separator />

            <ScrollArea className="flex-1">
              <div className="p-6 pt-4">
                <TabsContent value="stays" className="m-0 space-y-4">
                  {detail.occupancies.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>Tidak ada riwayat hunian</p>
                    </div>
                  ) : (
                    detail.occupancies.map((stay) => {
                      const canCheckIn =
                        stay.status === "RESERVED" || stay.status === "PENDING";
                      const canCheckOut = stay.status === "CHECKED_IN";

                      return (
                        <Card
                          key={stay.id}
                          className={`overflow-hidden transition-all duration-200 ${
                            stay.status === "CHECKED_IN"
                              ? "border-primary/50 shadow-sm"
                              : "border-border/60 opacity-90 hover:opacity-100"
                          }`}
                        >
                          {/* Card Header: Location & Status */}
                          <div className="bg-muted/30 p-4 border-b flex justify-between items-start gap-3">
                            <div className="flex gap-3">
                              <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center shrink-0 text-primary">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm flex items-center gap-2">
                                  {stay.bed.room.building.name}
                                  <span className="text-muted-foreground font-normal">
                                    •
                                  </span>
                                  {stay.bed.room.code}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 font-normal text-[10px]"
                                  >
                                    {stay.bed.room.building.area.name}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" />
                                    {stay.bed.code}
                                  </span>
                                  {stay.booking?.code && (
                                    <span className="flex items-center gap-1">
                                      <Ticket className="h-3 w-3" />
                                      {stay.booking.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={statusConfig[stay.status].className}
                            >
                              {statusConfig[stay.status].label}
                            </Badge>
                          </div>

                          <CardContent className="p-4 space-y-5">
                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm relative">
                              <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border/50 -translate-x-[50%]" />

                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Check-In
                                </div>
                                <div className="font-medium">
                                  {formatDate(stay.checkInDate)}
                                </div>
                                {stay.actualCheckIn && (
                                  <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(stay.actualCheckIn)}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1 pl-2">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Check-Out
                                </div>
                                <div className="font-medium">
                                  {stay.checkOutDate ? (
                                    formatDate(stay.checkOutDate)
                                  ) : (
                                    <span className="italic text-muted-foreground text-xs">
                                      Belum ditentukan
                                    </span>
                                  )}
                                </div>
                                {stay.actualCheckOut && (
                                  <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(stay.actualCheckOut)}
                                  </div>
                                )}
                                {stay.originalCheckOutDate &&
                                  stay.checkOutDate &&
                                  stay.originalCheckOutDate.getTime() !==
                                    stay.checkOutDate.getTime() && (
                                    <div className="text-[10px] text-amber-600 mt-1 flex items-start gap-1 leading-tight">
                                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                      Jadwal awal:{" "}
                                      {formatDate(stay.originalCheckOutDate)}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Actions (Login/out) */}
                            {(canCheckIn || canCheckOut) && (
                              <div className="flex gap-2">
                                {canCheckIn && (
                                  <Button
                                    size="sm"
                                    className="flex-1 h-8"
                                    onClick={() => handleCheckIn(stay.id)}
                                    disabled={isPending}
                                  >
                                    <LogIn className="h-3.5 w-3.5 mr-2" />{" "}
                                    Check-In
                                  </Button>
                                )}
                                {canCheckOut && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 border-slate-300 text-slate-700"
                                    onClick={() => handleCheckOut(stay.id)}
                                    disabled={isPending}
                                  >
                                    <LogOut className="h-3.5 w-3.5 mr-2" />{" "}
                                    Check-Out
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Logs Accordion */}
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full border rounded-lg bg-background"
                            >
                              <AccordionItem value="logs" className="border-0">
                                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50 text-xs font-medium text-muted-foreground rounded-lg data-[state=open]:rounded-b-none data-[state=open]:bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <History className="h-3.5 w-3.5" />
                                    Riwayat Aktivitas ({stay.logs.length})
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-0">
                                  <div className="max-h-[300px] overflow-y-auto pt-2">
                                    {stay.logs.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-muted-foreground">
                                        Tidak ada aktivitas
                                      </div>
                                    ) : (
                                      <div className="space-y-0 divide-y">
                                        {stay.logs.map((log) => {
                                          const config =
                                            logActionConfig[log.action];
                                          return (
                                            <div
                                              key={log.id}
                                              className="p-3 hover:bg-muted/30 transition-colors flex gap-3 text-sm"
                                            >
                                              <div className="mt-0.5">
                                                {config.icon}
                                              </div>
                                              <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span
                                                    className={`font-semibold text-xs ${config.className}`}
                                                  >
                                                    {config.label}
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground">
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
                                                  {log.buildingName} -{" "}
                                                  {log.roomCode}
                                                </div>
                                                {log.notes && (
                                                  <div className="text-xs text-muted-foreground italic">
                                                    &quot;{log.notes}&quot;
                                                  </div>
                                                )}
                                                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                                                  <User className="h-3 w-3" />{" "}
                                                  {log.performedByName} •{" "}
                                                  {formatDateTime(
                                                    log.performedAt
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="profile" className="m-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Biodata Lengkap
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Nama Lengkap
                          </div>
                          <div className="font-medium">
                            {detail.occupantName}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Nomor Induk (NIK/KTP)
                          </div>
                          <div className="font-medium font-mono">
                            {detail.occupantNik}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Jenis Kelamin
                          </div>
                          <div className="font-medium">
                            {detail.occupantGender === "MALE"
                              ? "Laki-Laki"
                              : "Perempuan"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Tipe
                          </div>
                          <div className="font-medium">
                            {detail.occupantType === "EMPLOYEE"
                              ? "Karyawan"
                              : "Tamu"}
                          </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Perusahaan / Instansi
                          </div>
                          <div className="font-medium">
                            {detail.occupantCompany || "-"}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Kontak
                        </h4>
                        <div className="grid gap-3">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground">
                                Telepon
                              </div>
                              <div>{detail.occupantPhone || "-"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground">
                                Email
                              </div>
                              <div>{detail.occupantEmail || "-"}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {(detail.occupantDepartment ||
                        detail.occupantPosition) && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Pekerjaan
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Departemen
                                </div>
                                <div className="font-medium text-sm">
                                  {detail.occupantDepartment || "-"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Jabatan
                                </div>
                                <div className="font-medium text-sm">
                                  {detail.occupantPosition || "-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

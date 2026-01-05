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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Briefcase,
  Phone,
  Mail,
  Building2,
  DoorOpen,
  Bed,
  Calendar,
  Clock,
  History,
  LogIn,
  LogOut,
  ArrowRightLeft,
  FileText,
  MapPin,
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
  occupant: OccupantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

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
  const [activeTab, setActiveTab] = useState("info");
  const [isPending, startTransition] = useTransition();

  // Fetch detail data
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const result = await getOccupantById(id);
      if (result.success) {
        setDetail(result.data);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load data when sheet opens with a new occupant
  useEffect(() => {
    if (open && occupant?.id) {
      fetchDetail(occupant.id);
    }

    // Cleanup when closing
    if (!open) {
      setDetail(null);
      setActiveTab("info");
    }
  }, [open, occupant?.id, fetchDetail]);

  // Action handlers
  const handleCheckIn = useCallback(async () => {
    if (!detail) return;

    startTransition(async () => {
      const result = await checkInOccupant(detail.id);
      if (result.success) {
        toast.success("Check-in berhasil!");
        // Reload detail to get updated status
        await fetchDetail(detail.id);
        onUpdate?.();
      } else {
        toast.error(result.error || "Gagal melakukan check-in");
      }
    });
  }, [detail, fetchDetail, onUpdate]);

  const handleCheckOut = useCallback(async () => {
    if (!detail) return;

    startTransition(async () => {
      const result = await checkOutOccupant({ occupancyId: detail.id });
      if (result.success) {
        toast.success("Check-out berhasil!");
        await fetchDetail(detail.id);
        onUpdate?.();
      } else {
        toast.error(result.error || "Gagal melakukan check-out");
      }
    });
  }, [detail, fetchDetail, onUpdate]);

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: id });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
  };

  // Can do actions
  const canCheckIn =
    detail?.status === "RESERVED" || detail?.status === "PENDING";
  const canCheckOut = detail?.status === "CHECKED_IN";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-2 md:p-4">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl" asChild>
                <h2>
                  {loading ? (
                    <span className="inline-block h-6 w-40 bg-muted animate-pulse rounded" />
                  ) : (
                    detail?.occupantName || "Detail Penghuni"
                  )}
                </h2>
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {loading ? (
                    <span className="inline-block h-4 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      <Badge
                        className={
                          statusConfig[detail?.status || "PENDING"].className
                        }
                      >
                        {statusConfig[detail?.status || "PENDING"].label}
                      </Badge>
                      {detail?.bookingCode && (
                        <Badge variant="outline" className="font-mono text-xs">
                          <Ticket className="h-3 w-3 mr-1" />
                          {detail.bookingCode}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="info" className="gap-1.5">
                <User className="h-4 w-4" />
                Informasi
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-4 w-4" />
                Riwayat ({detail.logs.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="info" className="m-0 space-y-6">
                {/* Occupant Info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Data Penghuni
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Nama
                        </div>
                        <div className="font-medium">{detail.occupantName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Tipe
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          {detail.occupantType === "EMPLOYEE" ? (
                            <>
                              <Briefcase className="h-3.5 w-3.5" /> Karyawan
                            </>
                          ) : (
                            <>
                              <User className="h-3.5 w-3.5" /> Tamu
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          NIK/KTP
                        </div>
                        <div className="font-medium">
                          {detail.occupantNik || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Gender
                        </div>
                        <div className="font-medium">
                          {detail.occupantGender === "MALE"
                            ? "Laki-laki"
                            : "Perempuan"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Perusahaan
                        </div>
                        <div className="font-medium">
                          {detail.occupantCompany || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Jabatan
                        </div>
                        <div className="font-medium">
                          {detail.occupantPosition || "-"}
                        </div>
                      </div>
                    </div>
                    {(detail.occupantPhone || detail.occupantEmail) && (
                      <>
                        <Separator />
                        <div className="flex flex-wrap gap-4 text-sm">
                          {detail.occupantPhone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {detail.occupantPhone}
                            </div>
                          )}
                          {detail.occupantEmail && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {detail.occupantEmail}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Location Info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Lokasi Menginap
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Area
                        </div>
                        <div className="font-medium">{detail.areaName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Bangunan
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {detail.buildingName}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Ruangan
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          <DoorOpen className="h-3.5 w-3.5" />
                          {detail.roomCode} - {detail.roomName}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Lantai
                        </div>
                        <div className="font-medium">
                          Lt. {detail.floorNumber}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground text-xs">Bed</div>
                        <div className="font-medium flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {detail.bedCode} ({detail.bedLabel})
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stay Period */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Periode Menginap
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Check-In
                        </div>
                        <div className="font-medium">
                          {formatDate(detail.checkInDate)}
                        </div>
                        {detail.actualCheckIn && (
                          <div className="text-xs text-muted-foreground">
                            Aktual: {formatDateTime(detail.actualCheckIn)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Check-Out
                        </div>
                        <div className="font-medium">
                          {detail.checkOutDate ? (
                            formatDate(detail.checkOutDate)
                          ) : (
                            <span className="text-muted-foreground italic">
                              Belum ditentukan
                            </span>
                          )}
                        </div>
                        {detail.actualCheckOut && (
                          <div className="text-xs text-muted-foreground">
                            Aktual: {formatDateTime(detail.actualCheckOut)}
                          </div>
                        )}
                      </div>
                    </div>
                    {detail.originalCheckOutDate &&
                      detail.originalCheckOutDate !== detail.checkOutDate && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Checkout awal (sebelumnya:{" "}
                          {formatDate(detail.originalCheckOutDate)})
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Notes */}
                {detail.notes && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Catatan
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {detail.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {(canCheckIn || canCheckOut) && (
                  <div className="flex gap-2 pt-2">
                    {canCheckIn && (
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleCheckIn}
                        disabled={isPending}
                      >
                        <LogIn className="h-4 w-4" />
                        Check-In
                      </Button>
                    )}
                    {canCheckOut && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={handleCheckOut}
                        disabled={isPending}
                      >
                        <LogOut className="h-4 w-4" />
                        Check-Out
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0">
                {detail.logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada riwayat aktivitas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {detail.logs.map((log, index) => {
                      const config = logActionConfig[log.action];
                      return (
                        <div key={log.id} className="flex gap-3 relative">
                          {/* Timeline line */}
                          {index < detail.logs.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                          )}

                          {/* Icon */}
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                            {config.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium text-sm ${config.className}`}
                              >
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(log.performedAt),
                                  {
                                    addSuffix: true,
                                    locale: id,
                                  }
                                )}
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground mt-0.5">
                              oleh {log.performedByName}
                            </div>

                            {/* Transfer Info */}
                            {log.action === "TRANSFERRED" &&
                              log.fromBedCode &&
                              log.toBedCode && (
                                <div className="flex items-center gap-2 mt-2 text-sm bg-muted/50 p-2 rounded">
                                  <span>{log.fromBedCode}</span>
                                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                  <span>{log.toBedCode}</span>
                                </div>
                              )}

                            {/* Date Change Info */}
                            {log.action === "DATE_CHANGED" && (
                              <div className="mt-2 text-sm bg-muted/50 p-2 rounded space-y-1">
                                {log.previousCheckInDate &&
                                  log.newCheckInDate && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        Check-In:
                                      </span>
                                      <span className="line-through text-muted-foreground">
                                        {formatDate(log.previousCheckInDate)}
                                      </span>
                                      <span>→</span>
                                      <span>
                                        {formatDate(log.newCheckInDate)}
                                      </span>
                                    </div>
                                  )}
                                {log.previousCheckOutDate &&
                                  log.newCheckOutDate && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        Check-Out:
                                      </span>
                                      <span className="line-through text-muted-foreground">
                                        {formatDate(log.previousCheckOutDate)}
                                      </span>
                                      <span>→</span>
                                      <span>
                                        {formatDate(log.newCheckOutDate)}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )}

                            {/* Reason */}
                            {log.reason && (
                              <div className="mt-2 text-sm text-muted-foreground italic">
                                &ldquo;{log.reason}&rdquo;
                              </div>
                            )}

                            {/* Time */}
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(log.performedAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>Data tidak ditemukan</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import {
  getMyBookings,
  BookingListItem,
} from "@/app/(protected)/booking/_actions/booking.actions";

interface QuickRequestSheetProps {
  trigger?: React.ReactNode;
}

export function QuickRequestSheet({ trigger }: QuickRequestSheetProps) {
  const [requests, setRequests] = useState<BookingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch API on mount (client side)
  useEffect(() => {
    // TODO: Ideally pass this data from server component or use SWR/React Query
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getMyBookings();
        if (result.success) {
          setRequests(result.data.data.slice(0, 5)); // Limit to 5 for widget
        }
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "PENDING").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
    };
  }, [requests]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; className: string; icon: typeof Clock }
    > = {
      PENDING: {
        label: "Menunggu",
        className:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        icon: Clock,
      },
      APPROVED: {
        label: "Disetujui",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Ditolak",
        className:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
      },
      CANCELLED: {
        label: "Batal",
        className:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
        icon: XCircle,
      },
    };
    const c = config[status] || config.PENDING;
    const Icon = c.icon;
    return (
      <Badge
        variant="outline"
        className={`text-[10px] h-5 gap-1 ${c.className}`}
      >
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Permintaan Saya
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Permintaan Saya
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Menunggu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Disetujui</p>
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Permintaan Terbaru
              </p>
              <Link href="/booking/mine">
                <Button variant="link" size="sm" className="h-auto p-0">
                  Lihat Semua
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{request.code}</p>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-muted-foreground">
                        <p>{request.occupantCount} Penghuni</p>
                        <p>
                          {format(
                            new Date(request.createdAt),
                            "dd MMM yyyy, HH:mm",
                            {
                              locale: localeId,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada permintaan</p>
              </div>
            )}
          </div>

          {/* View All Button */}
          <Link href="/booking/mine" className="block mt-4">
            <Button className="w-full group">
              Lihat Semua Permintaan
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

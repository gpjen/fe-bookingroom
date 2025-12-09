"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { MOCK_BOOKING_REQUESTS } from "@/app/(protected)/booking/request/_components/mock-data";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

interface QuickRequestSheetProps {
  trigger?: React.ReactNode;
}

export function QuickRequestSheet({ trigger }: QuickRequestSheetProps) {
  // Get recent requests (sorted by requestedAt, limit 5 for sheet)
  const recentRequests = useMemo(() => {
    return [...MOCK_BOOKING_REQUESTS]
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, 5);
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      pending: MOCK_BOOKING_REQUESTS.filter((r) => r.status === "request")
        .length,
      approved: MOCK_BOOKING_REQUESTS.filter((r) => r.status === "approved")
        .length,
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; className: string; icon: typeof Clock }
    > = {
      request: {
        label: "Menunggu",
        className:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        icon: Clock,
      },
      approved: {
        label: "Disetujui",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: CheckCircle,
      },
    };
    const c = config[status] || config.request;
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

            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {request.bookingCode}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-muted-foreground">
                        <p>{request.occupants.length} Penghuni</p>
                        <p>
                          {format(request.requestedAt, "dd MMM yyyy, HH:mm", {
                            locale: localeId,
                          })}
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

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { MOCK_BOOKING_REQUESTS } from "@/app/(protected)/booking/request/_components/mock-data";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

export function QuickRequestWidget() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmit = (data: unknown) => {
    console.log("Booking Request Data:", data);
  };

  // Get recent requests (sorted by requestedAt, limit 3)
  const recentRequests = useMemo(() => {
    return [...MOCK_BOOKING_REQUESTS]
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, 3);
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      pending: MOCK_BOOKING_REQUESTS.filter((r) => r.status === "request").length,
      approved: MOCK_BOOKING_REQUESTS.filter((r) => r.status === "approved").length,
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      request: {
        label: "Menunggu",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        icon: Clock,
      },
      approved: {
        label: "Disetujui",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: CheckCircle,
      },
    };
    const c = config[status] || config.request;
    const Icon = c.icon;
    return (
      <Badge variant="outline" className={`text-[10px] h-5 gap-1 ${c.className}`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Permintaan Saya
            </CardTitle>
            <Button size="sm" onClick={() => setIsFormOpen(true)} className="h-8 gap-1.5">
              <Plus className="h-4 w-4" />
              Buat Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Permintaan Terbaru</p>
            {recentRequests.length > 0 ? (
              <div className="space-y-2">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{request.bookingCode}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.occupants.length} Penghuni • {format(request.requestedAt, "dd MMM yy", { locale: localeId })}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada permintaan</p>
              </div>
            )}
          </div>

          {/* View All Link */}
          <Link href="/booking/mine">
            <Button variant="ghost" size="sm" className="w-full group">
              Lihat Semua Permintaan
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <BookingRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}

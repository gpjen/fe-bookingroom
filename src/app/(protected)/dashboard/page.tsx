"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Building as BuildingIcon,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Mock data for recent requests
const MOCK_RECENT_REQUESTS = [
  {
    id: "req-1",
    bookingCode: "REQ-ABC123",
    requester: { name: "Gandi Purna Jen", department: "IT" },
    area: "Area Utara",
    building: "Mess LQ 1",
    inDate: new Date(2025, 0, 15),
    outDate: new Date(2025, 0, 22),
    occupants: 2,
    status: "request" as const,
    requestedAt: new Date(2025, 0, 10),
  },
  {
    id: "req-2",
    bookingCode: "REQ-DEF456",
    requester: { name: "Ahmad Yani", department: "HRD" },
    area: "Area Selatan",
    building: "Mess Selatan A",
    inDate: new Date(2025, 0, 20),
    outDate: new Date(2025, 0, 27),
    occupants: 3,
    status: "approved" as const,
    requestedAt: new Date(2025, 0, 8),
  },
  {
    id: "req-3",
    bookingCode: "REQ-GHI789",
    requester: { name: "Siti Nurhaliza", department: "Finance" },
    area: "Area Timur",
    building: "Mess Timur",
    inDate: new Date(2025, 0, 12),
    outDate: new Date(2025, 0, 15),
    occupants: 1,
    status: "rejected" as const,
    requestedAt: new Date(2025, 0, 5),
  },
];

export default function Page() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmit = (data: any) => {
    console.log("Booking Request Data:", data);
    // Here you would typically send the data to your backend
  };

  const totalRequests = MOCK_RECENT_REQUESTS.length;
  const pendingRequests = MOCK_RECENT_REQUESTS.filter(
    (r) => r.status === "request"
  ).length;
  const approvedRequests = MOCK_RECENT_REQUESTS.filter(
    (r) => r.status === "approved"
  ).length;
  const rejectedRequests = MOCK_RECENT_REQUESTS.filter(
    (r) => r.status === "rejected"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "request":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
          >
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base">
              Pantau dan kelola permintaan booking mess perusahaan
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setIsFormOpen(true)}
            className="shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Buat Permintaan Baru
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{totalRequests}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Total Permintaan
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{pendingRequests}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Menunggu Persetujuan
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{approvedRequests}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Disetujui
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-500/10 rounded-xl">
                  <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-500" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{rejectedRequests}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Ditolak
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Requests Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Permintaan Terbaru
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {MOCK_RECENT_REQUESTS.length} permintaan dalam 30 hari terakhir
              </p>
            </div>
            <Button variant="ghost" size="sm" className="group">
              Lihat Semua
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <Card className="overflow-hidden border-0 shadow-md">
            <div className="divide-y divide-border">
              {MOCK_RECENT_REQUESTS.length > 0 ? (
                MOCK_RECENT_REQUESTS.map((request, index) => (
                  <div
                    key={request.id}
                    className="p-6 hover:bg-accent/30 transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                      {/* Left: Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-base">
                            {request.bookingCode}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 shrink-0 text-primary/70" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {request.requester.name}
                              </p>
                              <p className="text-xs truncate">
                                {request.requester.department}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <BuildingIcon className="h-4 w-4 shrink-0 text-primary/70" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {request.building}
                              </p>
                              <p className="text-xs truncate">{request.area}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">
                                {format(request.inDate, "dd MMM", {
                                  locale: localeId,
                                })}{" "}
                                -{" "}
                                {format(request.outDate, "dd MMM yyyy", {
                                  locale: localeId,
                                })}
                              </p>
                              <p className="text-xs">
                                {request.occupants} Penghuni
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0 text-primary/70" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">
                                {format(request.requestedAt, "dd MMM yyyy", {
                                  locale: localeId,
                                })}
                              </p>
                              <p className="text-xs">Tanggal Pengajuan</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex items-center pt-2 lg:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full lg:w-auto opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all group/btn"
                        >
                          Lihat Detail
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Belum Ada Permintaan
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Belum ada permintaan booking yang dibuat. Klik tombol "Buat
                    Permintaan Baru" untuk memulai.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Request Form Dialog */}
      <BookingRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}

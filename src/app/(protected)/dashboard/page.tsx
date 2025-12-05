"use client";

import { useState, useMemo } from "react";
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
  UserCheck,
  UserX,
  BedDouble,
  Ban,
  AlertCircle,
} from "lucide-react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  MOCK_BOOKING_REQUESTS,
  BUILDINGS,
} from "@/app/(protected)/booking/request/_components/mock-data";
import type {
  BookingStatus,
  OccupantStatus,
} from "@/app/(protected)/booking/request/_components/types";

// Helper functions
const getBuildingInfo = (buildingId: string) => {
  return BUILDINGS.find((b) => b.id === buildingId);
};

const getStatusBadge = (status: BookingStatus) => {
  const config: Record<
    BookingStatus,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    request: {
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: "Menunggu",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    },
    approved: {
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
      label: "Disetujui",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    },
    rejected: {
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: "Ditolak",
      className:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
    },
    cancelled: {
      icon: <Ban className="h-3 w-3 mr-1" />,
      label: "Dibatalkan",
      className:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800",
    },
    expired: {
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      label: "Kedaluwarsa",
      className:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    },
  };

  const { icon, label, className } = config[status] || {
    icon: null,
    label: status,
    className: "",
  };

  return (
    <Badge variant="outline" className={className}>
      {icon}
      {label}
    </Badge>
  );
};

const getOccupantStatusBadge = (status: OccupantStatus) => {
  const config: Record<
    OccupantStatus,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    scheduled: {
      icon: <Calendar className="h-3 w-3 mr-1" />,
      label: "Terjadwal",
      className:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    },
    checked_in: {
      icon: <UserCheck className="h-3 w-3 mr-1" />,
      label: "Check-in",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    },
    checked_out: {
      icon: <UserX className="h-3 w-3 mr-1" />,
      label: "Check-out",
      className:
        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800",
    },
    cancelled: {
      icon: <Ban className="h-3 w-3 mr-1" />,
      label: "Dibatalkan",
      className:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800",
    },
  };

  const { icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {icon}
      {label}
    </Badge>
  );
};

export default function Page() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmit = (data: unknown) => {
    console.log("Booking Request Data:", data);
  };

  // Calculate stats from mock data
  const stats = useMemo(() => {
    const requests = MOCK_BOOKING_REQUESTS;
    const allOccupants = requests.flatMap((r) => r.occupants);

    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "request").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      cancelled: requests.filter((r) => r.status === "cancelled").length,
      expired: requests.filter((r) => r.status === "expired").length,
      totalOccupants: allOccupants.length,
      checkedIn: allOccupants.filter((o) => o.status === "checked_in").length,
      checkedOut: allOccupants.filter((o) => o.status === "checked_out").length,
      scheduled: allOccupants.filter((o) => o.status === "scheduled").length,
      guests: allOccupants.filter((o) => o.type === "guest").length,
      employees: allOccupants.filter((o) => o.type === "employee").length,
    };
  }, []);

  // Get recent requests (sorted by requestedAt, limit 5)
  const recentRequests = useMemo(() => {
    return [...MOCK_BOOKING_REQUESTS]
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, 5);
  }, []);

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

        {/* Stats Overview - Booking Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Status Permintaan Booking
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.total}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Permintaan
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.pending}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Menunggu
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.approved}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Disetujui
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl">
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.rejected}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Ditolak
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gray-500/10 rounded-xl">
                    <Ban className="h-5 w-5 text-gray-600 dark:text-gray-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">
                  {stats.cancelled + stats.expired}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Batal/Expired
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Overview - Occupants */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Status Penghuni
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-violet-500/10 rounded-xl">
                    <Users className="h-5 w-5 text-violet-600 dark:text-violet-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">
                  {stats.totalOccupants}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Penghuni
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.scheduled}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Terjadwal
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">{stats.checkedIn}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Checked-in
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-500/10 rounded-xl">
                    <UserX className="h-5 w-5 text-slate-600 dark:text-slate-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">
                  {stats.checkedOut}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Checked-out
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all border-0 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/50 dark:to-teal-950/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                    <BedDouble className="h-5 w-5 text-cyan-600 dark:text-cyan-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-0.5">
                  {stats.employees} / {stats.guests}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Karyawan / Tamu
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Requests Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Permintaan Terbaru
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {recentRequests.length} permintaan terbaru
              </p>
            </div>
            <Button variant="ghost" size="sm" className="group">
              Lihat Semua
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <Card className="overflow-hidden border-0 shadow-md">
            <div className="divide-y divide-border">
              {recentRequests.length > 0 ? (
                recentRequests.map((request) => {
                  // Get unique buildings from occupants
                  const occupantBuildings = request.occupants
                    .filter((occ) => occ.buildingId)
                    .map((occ) => getBuildingInfo(occ.buildingId!))
                    .filter(Boolean);
                  const uniqueBuildings = [
                    ...new Map(
                      occupantBuildings.map((b) => [b?.id, b])
                    ).values(),
                  ];
                  const earliestDate = request.occupants.reduce(
                    (min, occ) => (occ.inDate < min ? occ.inDate : min),
                    request.occupants[0]?.inDate || new Date()
                  );
                  const latestDate = request.occupants.reduce(
                    (max, occ) =>
                      occ.outDate && occ.outDate > max ? occ.outDate : max,
                    request.occupants[0]?.outDate || new Date()
                  );
                  const guestCount = request.occupants.filter(
                    (o) => o.type === "guest"
                  ).length;
                  const employeeCount = request.occupants.filter(
                    (o) => o.type === "employee"
                  ).length;

                  return (
                    <div
                      key={request.id}
                      className="p-6 hover:bg-accent/30 transition-all group cursor-pointer"
                    >
                      <div className="flex flex-col lg:flex-row gap-4 lg:items-start justify-between">
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
                                  {request.requester.department} -{" "}
                                  {request.requester.company}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <BuildingIcon className="h-4 w-4 shrink-0 text-primary/70" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {uniqueBuildings.length > 0
                                    ? uniqueBuildings
                                        .map((b) => b?.name)
                                        .join(", ")
                                    : "-"}
                                </p>
                                <p className="text-xs truncate">
                                  {uniqueBuildings[0]?.area || "-"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">
                                  {format(earliestDate, "dd MMM", {
                                    locale: localeId,
                                  })}{" "}
                                  -{" "}
                                  {format(latestDate, "dd MMM yyyy", {
                                    locale: localeId,
                                  })}
                                </p>
                                <p className="text-xs">
                                  {request.occupants.length} Penghuni (
                                  {employeeCount} Karyawan
                                  {guestCount > 0 && `, ${guestCount} Tamu`})
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

                          {/* Purpose */}
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-medium">Tujuan:</span>{" "}
                            {request.purpose}
                          </p>

                          {/* Occupant Status Summary for approved bookings */}
                          {request.status === "approved" && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {request.occupants.slice(0, 3).map((occ) => (
                                <div
                                  key={occ.id}
                                  className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md"
                                >
                                  <span className="font-medium truncate max-w-[100px]">
                                    {occ.name.split(" ")[0]}
                                  </span>
                                  {getOccupantStatusBadge(
                                    occ.status || "scheduled"
                                  )}
                                </div>
                              ))}
                              {request.occupants.length > 3 && (
                                <span className="text-xs text-muted-foreground px-2 py-1">
                                  +{request.occupants.length - 3} lainnya
                                </span>
                              )}
                            </div>
                          )}
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
                  );
                })
              ) : (
                <div className="p-16 text-center">
                  <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Belum Ada Permintaan
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Belum ada permintaan booking yang dibuat. Klik tombol
                    &quot;Buat Permintaan Baru&quot; untuk memulai.
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

"use client";

import { Clock, UserCheck, LogOut, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OccupantStats } from "../_actions/occupants.types";
import { Skeleton } from "@/components/ui/skeleton";

// ========================================
// PROPS
// ========================================

interface OccupantStatsCardsProps {
  stats: OccupantStats;
  isLoading?: boolean;
  onFilterClick?: (status: string) => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function OccupantStatsCards({
  stats,
  isLoading,
  onFilterClick,
}: OccupantStatsCardsProps) {
  const activeCount = stats.checkedIn;
  const pendingCount = stats.pending + stats.reserved;

  // Calculate percentage
  const activePercent =
    stats.total > 0 ? Math.round((activeCount / stats.total) * 100) : 0;

  // Handler that prevents page reload
  const handleClick = (status: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onFilterClick?.(status);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Akan Masuk (Pending + Reserved) */}
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-amber-200"
        onClick={handleClick("PENDING,RESERVED")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Akan Masuk</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold text-amber-600">
                {pendingCount}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  {stats.pending} pending
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  {stats.reserved} reserved
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sedang Menginap (Checked In) */}
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
        onClick={handleClick("CHECKED_IN")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sedang Menginap</CardTitle>
          <UserCheck className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold text-emerald-600">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activePercent}% dari total record
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selesai (Checked Out) */}
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
        onClick={handleClick("CHECKED_OUT")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          <LogOut className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.checkedOut}</div>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  {stats.cancelled} batal
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-400" />
                  {stats.noShow} no show
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-violet-200"
        onClick={handleClick("all")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Record</CardTitle>
          <Users className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

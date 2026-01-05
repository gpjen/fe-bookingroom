"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, UserCheck, LogOut, Users } from "lucide-react";
import { OccupantStats } from "../_actions/occupants.types";

interface OccupantStatsCardsProps {
  stats: OccupantStats;
  isLoading?: boolean;
}

// Stat card with soft colors
function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconColor,
  bgColor,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description?: string;
  iconColor: string;
  bgColor: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted/70 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight">
                  {value.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {label}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {description}
                  </p>
                )}
              </>
            )}
          </div>

          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              bgColor
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function OccupantStatsCards({
  stats,
  isLoading,
}: OccupantStatsCardsProps) {
  // Calculate percentages for context
  const activeCount = stats.pending + stats.reserved + stats.checkedIn;
  const activePercent =
    stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Menunggu & Reservasi - Upcoming */}
      <StatCard
        icon={Clock}
        label="Menunggu Check-In"
        value={stats.pending + stats.reserved}
        description={
          stats.pending > 0
            ? `${stats.pending} pending, ${stats.reserved} dipesan`
            : undefined
        }
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-950/30"
        isLoading={isLoading}
      />

      {/* Aktif Check-In */}
      <StatCard
        icon={UserCheck}
        label="Sedang Menginap"
        value={stats.checkedIn}
        description={
          activePercent > 0 ? `${activePercent}% dari total` : undefined
        }
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-950/30"
        isLoading={isLoading}
      />

      {/* Selesai Check-Out */}
      <StatCard
        icon={LogOut}
        label="Sudah Check-Out"
        value={stats.checkedOut}
        iconColor="text-slate-500 dark:text-slate-400"
        bgColor="bg-slate-100 dark:bg-slate-800/50"
        isLoading={isLoading}
      />

      {/* Total Aktif */}
      <StatCard
        icon={Users}
        label="Total Aktif"
        value={activeCount}
        description={`dari ${stats.total} total record`}
        iconColor="text-violet-600 dark:text-violet-400"
        bgColor="bg-violet-50 dark:bg-violet-950/30"
        isLoading={isLoading}
      />
    </div>
  );
}

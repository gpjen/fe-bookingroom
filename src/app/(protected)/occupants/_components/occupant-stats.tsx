"use client";

import { cn } from "@/lib/utils";
import { Clock, UserCheck, LogOut, Users, TrendingUp } from "lucide-react";
import { OccupantStats } from "../_actions/occupants.types";
import { Skeleton } from "@/components/ui/skeleton";

interface OccupantStatsCardsProps {
  stats: OccupantStats;
  isLoading?: boolean;
  onFilterClick?: (status: string) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  subValue?: string;
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
  isLoading?: boolean;
  trend?: string; // e.g. "+12%"
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  className,
  iconClassName,
  onClick,
  isLoading,
  trend,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 p-6 transition-all duration-300 hover:shadow-lg cursor-pointer",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "p-3 rounded-xl bg-opacity-10",
            iconClassName
              ? iconClassName.replace("text-", "bg-")
              : "bg-slate-100"
          )}
        >
          <Icon className={cn("h-6 w-6", iconClassName)} />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="h-3 w-3 mr-1" /> {trend}
          </span>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {value.toLocaleString()}
            </span>
            {subValue && (
              <span className="text-sm text-muted-foreground">{subValue}</span>
            )}
          </div>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-current opacity-[0.03] group-hover:scale-150 transition-transform duration-500 ease-out pointer-events-none" />
    </div>
  );
}

export function OccupantStatsCards({
  stats,
  isLoading,
  onFilterClick,
}: OccupantStatsCardsProps) {
  const activeCount = stats.checkedIn;
  const pendingCount = stats.pending + stats.reserved;

  // Calculate raw "active" percentage just for visual context (active vs total records)
  const activePercent =
    stats.total > 0 ? Math.round((activeCount / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* INCOMING */}
      <StatCard
        label="Akan Masuk"
        value={pendingCount}
        subValue={pendingCount > 0 ? "Pending & Reservasi" : "Tidak ada"}
        icon={Clock}
        iconClassName="text-amber-600"
        onClick={() => onFilterClick?.("PENDING,RESERVED")}
        isLoading={isLoading}
      />

      {/* ACTIVE */}
      <StatCard
        label="Sedang Menginap"
        value={activeCount}
        subValue={`${activePercent}% dari total`}
        icon={UserCheck}
        iconClassName="text-emerald-600"
        onClick={() => onFilterClick?.("CHECKED_IN")}
        isLoading={isLoading}
      />

      {/* COMPLETED */}
      <StatCard
        label="Selesai (Check-Out)"
        value={stats.checkedOut}
        icon={LogOut}
        iconClassName="text-blue-600"
        onClick={() => onFilterClick?.("CHECKED_OUT")}
        isLoading={isLoading}
      />

      {/* TOTAL */}
      <StatCard
        label="Total Terdaftar"
        value={stats.total}
        subValue="Semua waktu"
        icon={Users}
        iconClassName="text-violet-600"
        onClick={() => onFilterClick?.("all")}
        isLoading={isLoading}
      />
    </div>
  );
}

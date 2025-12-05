"use client";

import { Card } from "@/components/ui/card";
import { BedDouble, Users, Clock, Wrench, TrendingUp } from "lucide-react";
import { getOccupancyStats } from "./mock-data";
import { cn } from "@/lib/utils";

export function OccupancyOverview() {
  const stats = getOccupancyStats();

  const cards = [
    {
      title: "Total Bed",
      value: stats.totalBeds,
      icon: BedDouble,
      gradient:
        "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-500",
    },
    {
      title: "Terisi",
      value: stats.occupiedBeds,
      icon: Users,
      gradient:
        "from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-500",
    },
    {
      title: "Tersedia",
      value: stats.availableBeds,
      icon: BedDouble,
      gradient:
        "from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600 dark:text-violet-500",
    },
    {
      title: "Dipesan",
      value: stats.reservedBeds,
      icon: Clock,
      gradient:
        "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-500",
    },
    {
      title: "Maintenance",
      value: stats.maintenanceBeds,
      icon: Wrench,
      gradient:
        "from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50",
      iconBg: "bg-gray-500/10",
      iconColor: "text-gray-600 dark:text-gray-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ringkasan Okupansi</h2>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-emerald-600">
            {stats.occupancyRate}%
          </span>
          <span className="text-muted-foreground">Tingkat Hunian</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={cn(
                "relative overflow-hidden border-0 bg-gradient-to-br",
                card.gradient
              )}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-black/5 rounded-full -mr-8 -mt-8" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", card.iconBg)}>
                    <Icon className={cn("h-4 w-4", card.iconColor)} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{card.value}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {card.title}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

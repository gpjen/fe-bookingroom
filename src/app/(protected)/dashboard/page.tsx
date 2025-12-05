"use client";

import { OccupancyOverview } from "./_components/occupancy-overview";
import { OccupancyPieChart } from "./_components/charts/occupancy-pie-chart";
import { AreaOccupancyBarChart } from "./_components/charts/area-occupancy-bar-chart";
import { BuildingOccupancyBarChart } from "./_components/charts/building-occupancy-bar-chart";
import { OccupantTypePieChart } from "./_components/charts/occupant-type-pie-chart";
import { GenderPieChart } from "./_components/charts/gender-pie-chart";
import { CompanyDistributionChart } from "./_components/charts/company-distribution-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-base">
          Pantau okupansi gedung dan penghuni mess perusahaan
        </p>
      </div>

      {/* Occupancy Overview Stats */}
      <OccupancyOverview />

      {/* Charts Row 1: Status Bed & Okupansi per Area */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <OccupancyPieChart />
        <div className="lg:col-span-2">
          <AreaOccupancyBarChart />
        </div>
      </div>

      {/* Charts Row 2: Okupansi Gedung & Tipe Penghuni & Gender */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BuildingOccupancyBarChart />
        </div>
        <OccupantTypePieChart />
        <GenderPieChart />
      </div>

      {/* Charts Row 3: Company Distribution */}
      <CompanyDistributionChart />
    </div>
  );
}

"use client";

import {
  DoorOpen,
  Users,
  Bed,
  CheckCircle2,
  Wrench,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildingStatsData } from "../_actions/building-detail.schema";

// ========================================
// PROPS
// ========================================

interface BuildingStatsProps {
  initialData: BuildingStatsData;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingStats({ initialData: data }: BuildingStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total Rooms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ruangan</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalRooms}</div>
          <p className="text-xs text-muted-foreground">
            {data.totalBeds} tempat tidur
          </p>
        </CardContent>
      </Card>

      {/* Occupancy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Okupansi</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.occupancyRate}%</div>
          <p className="text-xs text-muted-foreground">
            {data.bedsOccupied} dari {data.totalBeds} bed terisi
          </p>
        </CardContent>
      </Card>

      {/* Available Beds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bed Tersedia</CardTitle>
          <Bed className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {data.bedsAvailable}
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              {data.bedsReserved} reserved
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              {data.bedsMaintenance} maintenance
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          {data.status ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Wrench className="h-4 w-4 text-amber-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.status ? "Aktif" : "Tidak Aktif"}
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {data.totalImages} foto
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data.totalPIC} PIC
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

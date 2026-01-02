"use client";

import { useState, useEffect, useRef } from "react";
import {
  DoorOpen,
  Users,
  Bed,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBuildingStats } from "../_actions/building-detail.actions";
import { BuildingStatsData } from "../_actions/building-detail.schema";

// ========================================
// LOADING STATE
// ========================================

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingStats({ id }: { id: string }) {
  const [data, setData] = useState<BuildingStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    async function fetchData() {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const result = await getBuildingStats(id);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat statistik");
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return <StatsLoading />;
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

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

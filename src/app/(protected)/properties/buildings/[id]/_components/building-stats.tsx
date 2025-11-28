"use client";

import { useState, useEffect } from "react";
import { DoorOpen, Users, Wifi, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface BuildingStatsData {
  totalRooms: number;
  totalOccupied: number;
  totalCapacity: number;
  totalFacilities: number;
  status: string;
}

// Mock Data Fetcher
const fetchStatsData = async (id: string): Promise<BuildingStatsData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalRooms: 24,
        totalOccupied: 18,
        totalCapacity: 40,
        totalFacilities: 5,
        status: "active",
      });
    }, 1500); // Simulate 1.5s delay
  });
};

export function BuildingStats({ id }: { id: string }) {
  const [data, setData] = useState<BuildingStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatsData(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
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

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Kamar</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalRooms}</div>
          <p className="text-xs text-muted-foreground">Unit kamar tersedia</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Okupansi</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round((data.totalOccupied / data.totalCapacity) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {data.totalOccupied} dari {data.totalCapacity} kapasitas terisi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fasilitas</CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalFacilities}</div>
          <p className="text-xs text-muted-foreground">
            Fasilitas gedung aktif
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{data.status}</div>
          <p className="text-xs text-muted-foreground">Kondisi operasional</p>
        </CardContent>
      </Card>
    </div>
  );
}

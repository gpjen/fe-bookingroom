"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface BuildingOverviewData {
  description: string;
  type: string;
  totalFloors: number;
  arealCode: string;
  buildYear: number;
}

// Mock Data Fetcher
const fetchOverviewData = async (id: string): Promise<BuildingOverviewData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        description:
          "Gedung asrama utama untuk karyawan staff. Dilengkapi dengan fasilitas lengkap dan akses mudah ke kantin utama.",
        type: "Mess",
        totalFloors: 3,
        arealCode: "AREA-LQ-01",
        buildYear: 2022,
      });
    }, 1000); // Simulate 1.2s delay
  });
};

export function BuildingOverview({ id }: { id: string }) {
  const [data, setData] = useState<BuildingOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Detail Teknis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">
                Tipe Bangunan
              </span>
              <span className="font-medium">{data.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Total Lantai
              </span>
              <span className="font-medium">{data.totalFloors}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Kode Areal
              </span>
              <span className="font-medium">{data.arealCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Tahun Dibangun
              </span>
              <span className="font-medium">{data.buildYear}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

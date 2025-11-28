"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface BuildingFacilitiesData {
  facilities: string[];
}

// Mock Data Fetcher
const fetchFacilitiesData = async (
  id: string
): Promise<BuildingFacilitiesData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        facilities: [
          "AC",
          "WiFi",
          "TV Kabel",
          "Kamar Mandi Dalam",
          "Parkir Area",
        ],
      });
    }, 1800); // Simulate 1.8s delay
  });
};

export function BuildingFacilities({ id }: { id: string }) {
  const [data, setData] = useState<BuildingFacilitiesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilitiesData(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fasilitas Gedung</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.facilities.map((facility, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg dark:border-zinc-800"
            >
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{facility}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

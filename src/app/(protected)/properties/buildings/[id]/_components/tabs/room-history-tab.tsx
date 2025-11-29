"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns, HistoryOccupant } from "./columns";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomHistoryTabProps {
  roomId: string;
}

// Mock Data Generator
const getMockHistory = (count: number): HistoryOccupant[] => {
  const names = ["Joko Widodo", "Susilo Bambang", "Megawati", "Habibie", "Abdurrahman Wahid", "Soeharto", "Soekarno"];
  return Array.from({ length: count }).map((_, i) => ({
    id: `hist-${i}`,
    name: names[i % names.length],
    nik: `D${2023000 + i}`,
    gender: "Male",
    checkInDate: "2023-01-01",
    checkOutDate: "2023-12-31",
    department: "Former Staff",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=hist${i}`,
    status: "Checked Out",
  }));
};

export function RoomHistoryTab({ roomId }: RoomHistoryTabProps) {
  const [data, setData] = useState<HistoryOccupant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setData(getMockHistory(15)); // Generate enough data for pagination
      setIsLoading(false);
    };

    fetchHistory();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-5">
      <DataTable columns={columns} data={data} searchKey="name" />
    </div>
  );
}

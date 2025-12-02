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
  const names = [
    "Joko Widodo",
    "Susilo Bambang",
    "Megawati",
    "Habibie",
    "Abdurrahman Wahid",
    "Soeharto",
    "Soekarno",
  ];
  const companies = [
    "PT Harita Nickel",
    "PT Lygend",
    "Dinas Pertambangan",
    "Vendor A",
    "Vendor B",
  ];
  const departments = [
    "HRD",
    "Finance",
    "Operations",
    "Safety",
    "External Relations",
  ];

  return Array.from({ length: count }).map((_, i) => {
    const type = i % 3 === 0 ? "employee" : i % 3 === 1 ? "guest" : "other";
    const isEmployee = type === "employee";
    const gender = i % 2 === 0 ? "Male" : "Female";

    return {
      id: `hist-${i}`,
      name: names[i % names.length],
      identifier: isEmployee ? `${2023000 + i}` : `ID-${1000 + i}`,
      type: type as "employee" | "guest" | "other",
      gender: gender as "Male" | "Female",
      checkInDate: "01/01/2023",
      checkOutDate: "12/31/2023",
      company: isEmployee
        ? "PT Harita Nickel"
        : companies[i % companies.length],
      department: isEmployee ? departments[i % departments.length] : undefined,
      notes:
        i % 4 === 0
          ? "Late checkout requested"
          : i % 5 === 0
          ? "Room condition good"
          : undefined,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=hist${i}`,
      status: i % 10 === 0 ? "Cancelled" : "Checked Out",
      companionName: !isEmployee && i % 2 === 0 ? "Gandi Jen" : undefined,
      companionId: !isEmployee && i % 2 === 0 ? "D0525000109" : undefined,
      bedCode: i % 2 === 0 ? "A" : "B",
    };
  });
};

export function RoomHistoryTab({ roomId }: RoomHistoryTabProps) {
  const [data, setData] = useState<HistoryOccupant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      <DataTable
        columns={columns}
        pageSizeOptions={[10, 25, 50, 100]}
        data={data}
        searchKey="name"
      />
    </div>
  );
}

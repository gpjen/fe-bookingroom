"use client";

import { useState, useEffect } from "react";
import { columns } from "./_components/columns";
import { SystemLog, LogLevel, LogStatus } from "./_components/types";
import { addDays, subDays, subMinutes } from "date-fns";
import { DateRange } from "react-day-picker";
import { Activity, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

// Mock Data Generator
const generateMockLogs = (count: number): SystemLog[] => {
  const actions = [
    "LOGIN",
    "LOGOUT",
    "CREATE_BOOKING",
    "CANCEL_BOOKING",
    "UPDATE_PROFILE",
    "CREATE_BUILDING",
    "UPDATE_SETTINGS",
    "DELETE_USER",
    "APPROVE_BOOKING",
    "REJECT_BOOKING",
  ];
  const modules = ["AUTH", "BOOKING", "ADMIN", "USER", "SYSTEM"];
  const users = [
    { name: "SYSTEM", nik: "SYSTEM", role: "SYSTEM" },
    { name: "Admin System", nik: "SYSTEM", role: "ADMIN" },
    { name: "Budi Santoso", nik: "12345678", role: "USER" },
    { name: "Siti Aminah", nik: "87654321", role: "MANAGER" },
    { name: "John Doe", nik: "11223344", role: "USER" },
    { name: "Jane Smith", nik: "44332211", role: "ADMIN" },
  ];

  return Array.from({ length: count })
    .map((_, i) => {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];
      const status: LogStatus = Math.random() > 0.1 ? "SUCCESS" : "FAILURE";
      const level: LogLevel =
        status === "FAILURE"
          ? "ERROR"
          : action.includes("DELETE")
          ? "WARNING"
          : "INFO";

      return {
        id: `log-${i}`,
        timestamp: subMinutes(new Date(), Math.floor(Math.random() * 10000)),
        level,
        action,
        module,
        message: `User ${user.name} performed ${action} on ${module} module.`,
        user: {
          ...user,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        status,
      };
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  useEffect(() => {
    const initialLogs = generateMockLogs(50);
    setLogs(initialLogs);
    setIsLoading(false);
  }, []);

  // Filter logs based on search and date range
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.nik.includes(searchQuery) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      (!dateRange?.from || log.timestamp >= dateRange.from) &&
      (!dateRange?.to || log.timestamp <= addDays(dateRange.to, 1));

    return matchesSearch && matchesDate;
  });

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" /> Log Aktivitas
            </h1>
            <p className="text-muted-foreground mt-1">
              Daftar lengkap riwayat aktivitas dalam sistem.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari log (Aksi, User, NIK)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <DataTable columns={columns} data={filteredLogs} />
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { BedDouble } from "lucide-react";
import { getOccupancyStats } from "../mock-data";

const COLORS = {
  occupied: "#3b82f6",
  available: "#22c55e",
  reserved: "#f59e0b",
  maintenance: "#6b7280",
};

export function OccupancyPieChart() {
  const stats = useMemo(() => getOccupancyStats(), []);

  const data = [
    { name: "Terisi", value: stats.occupiedBeds, color: COLORS.occupied },
    { name: "Tersedia", value: stats.availableBeds, color: COLORS.available },
    { name: "Dipesan", value: stats.reservedBeds, color: COLORS.reserved },
    {
      name: "Maintenance",
      value: stats.maintenanceBeds,
      color: COLORS.maintenance,
    },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BedDouble className="h-5 w-5 text-primary" />
          Status Bed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} bed`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold">{stats.totalBeds}</p>
          <p className="text-xs text-muted-foreground">Total Bed</p>
        </div>
      </CardContent>
    </Card>
  );
}

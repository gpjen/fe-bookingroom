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
import { Users } from "lucide-react";
import { MOCK_BEDS } from "../mock-data";

export function OccupantTypePieChart() {
  const data = useMemo(() => {
    const occupiedBeds = MOCK_BEDS.filter(
      (b) => b.status === "occupied" && b.occupant
    );

    const employees = occupiedBeds.filter(
      (b) => b.occupant?.type === "employee"
    ).length;
    const guests = occupiedBeds.filter(
      (b) => b.occupant?.type === "guest"
    ).length;

    return [
      { name: "Karyawan", value: employees, color: "#3b82f6" },
      { name: "Tamu", value: guests, color: "#f59e0b" },
    ];
  }, []);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Tipe Penghuni
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
                paddingAngle={3}
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
                formatter={(value: number) => [`${value} orang`, ""]}
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
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Penghuni</p>
        </div>
      </CardContent>
    </Card>
  );
}

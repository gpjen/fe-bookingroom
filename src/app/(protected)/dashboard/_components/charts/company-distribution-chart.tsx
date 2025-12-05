"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Building } from "lucide-react";
import { MOCK_BEDS } from "../mock-data";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function CompanyDistributionChart() {
  const data = useMemo(() => {
    const occupiedBeds = MOCK_BEDS.filter(
      (b) => b.status === "occupied" && b.occupant
    );

    const companyCount: Record<string, number> = {};
    occupiedBeds.forEach((bed) => {
      const company = bed.occupant?.company || "Lainnya";
      companyCount[company] = (companyCount[company] || 0) + 1;
    });

    return Object.entries(companyCount)
      .map(([name, value]) => ({
        name: name.replace("PT. ", "").substring(0, 20),
        fullName: name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, []);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Distribusi per Perusahaan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, textAnchor: "end" }}
                height={60}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} orang`, "Penghuni"]}
                labelFormatter={(label) => {
                  const item = data.find((d) => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Building2 } from "lucide-react";
import { AREAS, getBuildingStats } from "../mock-data";

export function BuildingOccupancyBarChart() {
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const buildingStats = useMemo(() => {
    return getBuildingStats(selectedArea === "all" ? undefined : selectedArea);
  }, [selectedArea]);

  const data = buildingStats.map((building) => ({
    name: building.name.replace("Block ", ""),
    fullName: building.name,
    Okupansi: building.occupancyRate,
    area: building.areaName,
  }));

  const getBarColor = (rate: number) => {
    if (rate >= 90) return "#ef4444";
    if (rate >= 70) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Tingkat Okupansi Gedung
          </CardTitle>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Area</SelectItem>
              {AREAS.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, "Okupansi"]}
                labelFormatter={(label) => {
                  const item = data.find((d) => d.name === label);
                  return item ? `${item.fullName} (${item.area})` : label;
                }}
              />
              <Bar dataKey="Okupansi" radius={[0, 4, 4, 0]} maxBarSize={25}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.Okupansi)}
                  />
                ))}
                <LabelList
                  dataKey="Okupansi"
                  position="right"
                  formatter={(value) => `${Number(value)}%`}
                  style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">&lt; 70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">70-90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-muted-foreground">&gt; 90%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

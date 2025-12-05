"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Building2, BedDouble, Users, TrendingUp } from "lucide-react";
import { getAreaStats } from "./mock-data";
import { cn } from "@/lib/utils";

export function AreaSummaryTable() {
  const areaStats = useMemo(() => getAreaStats(), []);

  const totals = useMemo(() => {
    return {
      totalBuildings: areaStats.reduce((acc, a) => acc + a.totalBuildings, 0),
      totalBeds: areaStats.reduce((acc, a) => acc + a.totalBeds, 0),
      occupiedBeds: areaStats.reduce((acc, a) => acc + a.occupiedBeds, 0),
      availableBeds: areaStats.reduce((acc, a) => acc + a.availableBeds, 0),
    };
  }, [areaStats]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return "text-rose-600 dark:text-rose-400";
    if (rate >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getOccupancyBg = (rate: number) => {
    if (rate >= 90) return "bg-rose-100 dark:bg-rose-900/30";
    if (rate >= 70) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-emerald-100 dark:bg-emerald-900/30";
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 90) return { label: "Penuh", className: "bg-rose-100 text-rose-700 border-rose-200" };
    if (rate >= 70) return { label: "Ramai", className: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Normal", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Ringkasan per Area
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Area</TableHead>
                <TableHead className="font-semibold text-center">Gedung</TableHead>
                <TableHead className="font-semibold text-center">Total Bed</TableHead>
                <TableHead className="font-semibold text-center">Terisi</TableHead>
                <TableHead className="font-semibold text-center">Tersedia</TableHead>
                <TableHead className="font-semibold text-center w-[180px]">Okupansi</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areaStats.map((area) => {
                const status = getStatusBadge(area.occupancyRate);
                return (
                  <TableRow key={area.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-violet-100 dark:bg-violet-900/30">
                          <MapPin className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <span className="font-semibold">{area.name}</span>
                          <p className="text-xs text-muted-foreground">{area.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{area.totalBuildings}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{area.totalBeds}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {area.occupiedBeds}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {area.availableBeds}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={area.occupancyRate} className="h-2 flex-1" />
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-semibold min-w-[45px] justify-center",
                            getOccupancyColor(area.occupancyRate),
                            getOccupancyBg(area.occupancyRate)
                          )}
                        >
                          {area.occupancyRate}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", status.className)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Total Row */}
              <TableRow className="bg-muted/70 font-semibold border-t-2">
                <TableCell>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Total Keseluruhan
                  </span>
                </TableCell>
                <TableCell className="text-center">{totals.totalBuildings}</TableCell>
                <TableCell className="text-center">{totals.totalBeds}</TableCell>
                <TableCell className="text-center text-blue-600 dark:text-blue-400">
                  {totals.occupiedBeds}
                </TableCell>
                <TableCell className="text-center text-emerald-600 dark:text-emerald-400">
                  {totals.availableBeds}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.round((totals.occupiedBeds / totals.totalBeds) * 100)} 
                      className="h-2 flex-1" 
                    />
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-semibold min-w-[45px] justify-center",
                        getOccupancyColor(Math.round((totals.occupiedBeds / totals.totalBeds) * 100)),
                        getOccupancyBg(Math.round((totals.occupiedBeds / totals.totalBeds) * 100))
                      )}
                    >
                      {Math.round((totals.occupiedBeds / totals.totalBeds) * 100)}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

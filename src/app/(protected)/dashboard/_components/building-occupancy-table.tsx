"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, BedDouble, Users, TrendingUp } from "lucide-react";
import { AREAS, getBuildingStats } from "./mock-data";
import { cn } from "@/lib/utils";

export function BuildingOccupancyTable() {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  
  const buildingStats = useMemo(() => {
    return getBuildingStats(selectedArea === "all" ? undefined : selectedArea);
  }, [selectedArea]);

  const totals = useMemo(() => {
    return {
      totalRooms: buildingStats.reduce((acc, b) => acc + b.totalRooms, 0),
      totalBeds: buildingStats.reduce((acc, b) => acc + b.totalBeds, 0),
      occupiedBeds: buildingStats.reduce((acc, b) => acc + b.occupiedBeds, 0),
      availableBeds: buildingStats.reduce((acc, b) => acc + b.availableBeds, 0),
    };
  }, [buildingStats]);

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

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Okupansi per Gedung
          </CardTitle>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Pilih Area" />
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
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Gedung</TableHead>
                <TableHead className="font-semibold text-center">Area</TableHead>
                <TableHead className="font-semibold text-center">Kamar</TableHead>
                <TableHead className="font-semibold text-center">Total Bed</TableHead>
                <TableHead className="font-semibold text-center">Terisi</TableHead>
                <TableHead className="font-semibold text-center">Tersedia</TableHead>
                <TableHead className="font-semibold text-center w-[180px]">Okupansi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildingStats.map((building) => (
                <TableRow key={building.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/10">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium">{building.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {building.areaName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {building.totalRooms}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{building.totalBeds}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {building.occupiedBeds}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {building.availableBeds}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={building.occupancyRate} className="h-2 flex-1" />
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-semibold min-w-[45px] justify-center",
                          getOccupancyColor(building.occupancyRate),
                          getOccupancyBg(building.occupancyRate)
                        )}
                      >
                        {building.occupancyRate}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-muted/70 font-semibold border-t-2">
                <TableCell>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Total
                  </span>
                </TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-center">{totals.totalRooms}</TableCell>
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
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

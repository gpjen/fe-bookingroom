"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  BedDouble,
  Users,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AREAS, getBuildingStats, getAreaStats } from "./mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AreaBuildingStats() {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const areaStats = getAreaStats();
  const buildingStats = getBuildingStats(selectedArea === "all" ? undefined : selectedArea);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return "text-rose-600 dark:text-rose-400";
    if (rate >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  return (
    <div className="space-y-6">
      {/* Area Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Okupansi per Area
          </h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {areaStats.map((area) => (
            <Card 
              key={area.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                selectedArea === area.id ? "border-primary" : "border-transparent hover:border-primary/30"
              )}
              onClick={() => setSelectedArea(area.id === selectedArea ? "all" : area.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{area.name}</h3>
                    <p className="text-xs text-muted-foreground">{area.totalBuildings} Gedung</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-semibold", getOccupancyColor(area.occupancyRate))}
                  >
                    {area.occupancyRate}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={area.occupancyRate} 
                    className="h-1.5"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {area.occupiedBeds} Terisi
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {area.availableBeds} Kosong
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Building List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Detail Gedung
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {buildingStats.map((building) => (
              <div
                key={building.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{building.name}</h4>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {building.areaName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{building.totalRooms} Kamar</span>
                    <span>•</span>
                    <span>{building.totalBeds} Bed</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {building.availableBeds}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Tersedia</p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{building.occupiedBeds}</p>
                    <p className="text-[10px] text-muted-foreground">Terisi</p>
                  </div>
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-semibold", getOccupancyColor(building.occupancyRate))}>
                        {building.occupancyRate}%
                      </span>
                    </div>
                    <Progress value={building.occupancyRate} className="h-1.5" />
                  </div>
                </div>

                <Link href={`/properties/buildings/${building.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

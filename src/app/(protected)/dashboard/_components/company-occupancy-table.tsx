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
import { Building, Users, Briefcase, UserCheck } from "lucide-react";
import { MOCK_BEDS, AREAS } from "./mock-data";
import { cn } from "@/lib/utils";

export function CompanyOccupancyTable() {
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const companyData = useMemo(() => {
    let occupiedBeds = MOCK_BEDS.filter((b) => b.status === "occupied" && b.occupant);
    
    if (selectedArea !== "all") {
      occupiedBeds = occupiedBeds.filter((b) => b.areaId === selectedArea);
    }

    // Group by company
    const companyMap: Record<string, {
      company: string;
      total: number;
      employees: number;
      guests: number;
      areas: Set<string>;
    }> = {};

    occupiedBeds.forEach((bed) => {
      const company = bed.occupant?.company || "Lainnya";
      if (!companyMap[company]) {
        companyMap[company] = {
          company,
          total: 0,
          employees: 0,
          guests: 0,
          areas: new Set(),
        };
      }
      companyMap[company].total++;
      if (bed.occupant?.type === "employee") {
        companyMap[company].employees++;
      } else {
        companyMap[company].guests++;
      }
      companyMap[company].areas.add(bed.areaName);
    });

    const totalOccupants = occupiedBeds.length;

    return Object.values(companyMap)
      .map((c) => ({
        ...c,
        areas: Array.from(c.areas),
        percentage: totalOccupants > 0 ? Math.round((c.total / totalOccupants) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [selectedArea]);

  const totals = useMemo(() => {
    return {
      total: companyData.reduce((acc, c) => acc + c.total, 0),
      employees: companyData.reduce((acc, c) => acc + c.employees, 0),
      guests: companyData.reduce((acc, c) => acc + c.guests, 0),
    };
  }, [companyData]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Okupansi per Perusahaan
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
                <TableHead className="font-semibold">Perusahaan</TableHead>
                <TableHead className="font-semibold text-center">Total</TableHead>
                <TableHead className="font-semibold text-center">Karyawan</TableHead>
                <TableHead className="font-semibold text-center">Tamu</TableHead>
                <TableHead className="font-semibold w-[180px]">Persentase</TableHead>
                <TableHead className="font-semibold">Area Tersebar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyData.map((data, index) => (
                <TableRow key={data.company} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        index === 0 ? "bg-amber-500" :
                        index === 1 ? "bg-gray-400" :
                        index === 2 ? "bg-amber-700" : "bg-slate-300"
                      )}>
                        {index + 1}
                      </div>
                      <span className="font-medium truncate max-w-[200px]" title={data.company}>
                        {data.company}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold">{data.total}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {data.employees}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {data.guests}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={data.percentage} className="h-2 flex-1" />
                      <span className="text-xs font-semibold min-w-[35px] text-right">
                        {data.percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {data.areas.map((area) => (
                        <Badge key={area} variant="outline" className="text-[10px]">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-muted/70 font-semibold border-t-2">
                <TableCell>
                  <span className="font-semibold">Total ({companyData.length} Perusahaan)</span>
                </TableCell>
                <TableCell className="text-center font-bold">{totals.total}</TableCell>
                <TableCell className="text-center text-blue-600 dark:text-blue-400">
                  {totals.employees}
                </TableCell>
                <TableCell className="text-center text-amber-600 dark:text-amber-400">
                  {totals.guests}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="h-2 flex-1" />
                    <span className="text-xs font-semibold min-w-[35px] text-right">100%</span>
                  </div>
                </TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

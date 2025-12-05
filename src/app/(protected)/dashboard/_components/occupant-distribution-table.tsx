"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Briefcase, UserCheck, Building2 } from "lucide-react";
import { MOCK_BEDS, AREAS, MOCK_BUILDINGS } from "./mock-data";
import { cn } from "@/lib/utils";

export function OccupantDistributionTable() {
  const distributionData = useMemo(() => {
    const occupiedBeds = MOCK_BEDS.filter((b) => b.status === "occupied" && b.occupant);
    
    // Group by area
    return AREAS.map((area) => {
      const areaBeds = occupiedBeds.filter((b) => b.areaId === area.id);
      const employees = areaBeds.filter((b) => b.occupant?.type === "employee");
      const guests = areaBeds.filter((b) => b.occupant?.type === "guest");
      
      // Count by company
      const companyCount: Record<string, number> = {};
      areaBeds.forEach((bed) => {
        const company = bed.occupant?.company || "Lainnya";
        companyCount[company] = (companyCount[company] || 0) + 1;
      });
      
      // Count by gender
      const maleCount = areaBeds.filter((b) => b.occupant?.gender === "L").length;
      const femaleCount = areaBeds.filter((b) => b.occupant?.gender === "P").length;
      
      return {
        area,
        total: areaBeds.length,
        employees: employees.length,
        guests: guests.length,
        male: maleCount,
        female: femaleCount,
        topCompanies: Object.entries(companyCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2),
      };
    });
  }, []);

  const totals = useMemo(() => {
    return {
      total: distributionData.reduce((acc, d) => acc + d.total, 0),
      employees: distributionData.reduce((acc, d) => acc + d.employees, 0),
      guests: distributionData.reduce((acc, d) => acc + d.guests, 0),
      male: distributionData.reduce((acc, d) => acc + d.male, 0),
      female: distributionData.reduce((acc, d) => acc + d.female, 0),
    };
  }, [distributionData]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Distribusi Penghuni per Area
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Area</TableHead>
                <TableHead className="font-semibold text-center">Total</TableHead>
                <TableHead className="font-semibold text-center">Karyawan</TableHead>
                <TableHead className="font-semibold text-center">Tamu</TableHead>
                <TableHead className="font-semibold text-center">Laki-laki</TableHead>
                <TableHead className="font-semibold text-center">Perempuan</TableHead>
                <TableHead className="font-semibold">Perusahaan Terbanyak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributionData.map((data) => (
                <TableRow key={data.area.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/10">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-semibold">{data.area.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg">{data.total}</span>
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
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400">
                      {data.male}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400">
                      {data.female}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {data.topCompanies.map(([company, count]) => (
                        <Badge 
                          key={company} 
                          variant="outline" 
                          className="text-[10px] truncate max-w-[120px]"
                          title={company}
                        >
                          {company.replace("PT. ", "").substring(0, 15)}... ({count})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-muted/70 font-semibold border-t-2">
                <TableCell>
                  <span className="font-semibold">Total</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-lg">{totals.total}</span>
                </TableCell>
                <TableCell className="text-center text-blue-600 dark:text-blue-400">
                  {totals.employees}
                </TableCell>
                <TableCell className="text-center text-amber-600 dark:text-amber-400">
                  {totals.guests}
                </TableCell>
                <TableCell className="text-center">{totals.male}</TableCell>
                <TableCell className="text-center">{totals.female}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

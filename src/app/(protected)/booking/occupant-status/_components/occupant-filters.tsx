"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OccupantFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  buildingFilter: string;
  setBuildingFilter: (building: string) => void;
  buildings: { id: string; name: string }[];
  clearFilters: () => void;
  activeFiltersCount: number;
}

export function OccupantFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  buildingFilter,
  setBuildingFilter,
  buildings,
  clearFilters,
  activeFiltersCount,
}: OccupantFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama, kode booking, NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="scheduled">Terjadwal</SelectItem>
          <SelectItem value="checked_in">Check-In</SelectItem>
          <SelectItem value="checked_out">Check-Out</SelectItem>
          <SelectItem value="cancelled">Dibatalkan</SelectItem>
        </SelectContent>
      </Select>

      {/* Building Filter */}
      <Select value={buildingFilter} onValueChange={setBuildingFilter}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Gedung" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Gedung</SelectItem>
          {buildings.map((building) => (
            <SelectItem key={building.id} value={building.id}>
              {building.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Reset
          <Badge variant="secondary" className="h-5 w-5 p-0 justify-center">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}

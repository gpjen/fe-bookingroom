"use client";

import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter, RotateCcw } from "lucide-react";
import {
  OccupancyStatus,
  OccupantType,
  Gender,
  FilterOptions,
} from "../_actions/occupants.types";

// ========================================
// FILTER STATE TYPES
// ========================================

export interface FilterState {
  search: string;
  status: OccupancyStatus | "all";
  occupantType: OccupantType | "all";
  gender: Gender | "all";
  buildingId: string;
  areaId: string;
  hasBooking: "all" | "true" | "false";
}

export const defaultFilters: FilterState = {
  search: "",
  status: "all",
  occupantType: "all",
  gender: "all",
  buildingId: "all",
  areaId: "all",
  hasBooking: "all",
};

// ========================================
// PROPS
// ========================================

interface OccupantsFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filterOptions: FilterOptions;
  isLoading?: boolean;
}

// ========================================
// STATUS LABELS
// ========================================

const statusLabels: Record<OccupancyStatus, string> = {
  PENDING: "Menunggu",
  RESERVED: "Dipesan",
  CHECKED_IN: "Check-In",
  CHECKED_OUT: "Check-Out",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak Hadir",
};

// ========================================
// COMPONENT
// ========================================

export function OccupantsFilters({
  filters,
  onFiltersChange,
  filterOptions,
  isLoading,
}: OccupantsFiltersProps) {
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== "all") count++;
    if (filters.occupantType !== "all") count++;
    if (filters.gender !== "all") count++;
    if (filters.buildingId !== "all") count++;
    if (filters.areaId !== "all") count++;
    if (filters.hasBooking !== "all") count++;
    return count;
  }, [filters]);

  // Filter buildings by selected area
  const filteredBuildings = useMemo(() => {
    if (filters.areaId === "all") return filterOptions.buildings;
    return filterOptions.buildings.filter((b) => b.areaId === filters.areaId);
  }, [filterOptions.buildings, filters.areaId]);

  // Handlers
  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, status: value as OccupancyStatus | "all" });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        occupantType: value as OccupantType | "all",
      });
    },
    [filters, onFiltersChange]
  );

  const handleGenderChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, gender: value as Gender | "all" });
    },
    [filters, onFiltersChange]
  );

  const handleAreaChange = useCallback(
    (value: string) => {
      // Reset building when area changes
      onFiltersChange({
        ...filters,
        areaId: value,
        buildingId: "all",
      });
    },
    [filters, onFiltersChange]
  );

  const handleBuildingChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, buildingId: value });
    },
    [filters, onFiltersChange]
  );

  const handleBookingChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        hasBooking: value as "all" | "true" | "false",
      });
    },
    [filters, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    onFiltersChange(defaultFilters);
  }, [onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIK, email, gedung..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {filterOptions.statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {statusLabels[s.value]} ({s.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={filters.occupantType}
          onValueChange={handleTypeChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
            <SelectItem value="GUEST">Tamu</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters Toggle */}
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Extended Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Gender Filter */}
        <Select
          value={filters.gender}
          onValueChange={handleGenderChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="MALE">Laki-laki</SelectItem>
            <SelectItem value="FEMALE">Perempuan</SelectItem>
          </SelectContent>
        </Select>

        {/* Area Filter */}
        <Select
          value={filters.areaId}
          onValueChange={handleAreaChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Area</SelectItem>
            {filterOptions.areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Building Filter */}
        <Select
          value={filters.buildingId}
          onValueChange={handleBuildingChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Bangunan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bangunan</SelectItem>
            {filteredBuildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Booking Filter */}
        <Select
          value={filters.hasBooking}
          onValueChange={handleBookingChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sumber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sumber</SelectItem>
            <SelectItem value="true">Via Booking</SelectItem>
            <SelectItem value="false">Direct Placement</SelectItem>
          </SelectContent>
        </Select>

        {/* Active Filters Badge */}
        {activeFiltersCount > 0 && (
          <Badge
            variant="secondary"
            className="h-9 px-3 flex items-center gap-1.5"
          >
            <Filter className="h-3 w-3" />
            {activeFiltersCount} filter aktif
          </Badge>
        )}
      </div>
    </div>
  );
}

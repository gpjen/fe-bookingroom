"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Building2,
  Users,
  Calendar as CalendarIcon,
  Briefcase,
  UserPlus,
  Sparkles,
  Minus,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Eye,
} from "lucide-react";
import {
  useAreas,
  useBuildings,
  useRoomAvailability,
  useRoomTypes,
  type RoomAvailability,
} from "./room-search-api";
import type { SelectedBed } from "./booking-request-types";
import { RoomAvailabilityTimeline } from "./room-availability-timeline";
import { BookingRequestSheet } from "./booking-request-sheet/index";
import { RoomDetailDialog } from "./room-detail-dialog";
import { SelectionSummaryBar } from "./selection-summary-bar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  format,
  addDays,
  differenceInDays,
  isBefore,
  startOfDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

function DatePicker({
  date,
  onSelect,
  label,
  minDate,
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  label: string;
  minDate?: Date;
}) {
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const disabledDays = { before: minDate || tomorrow };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start text-left font-normal px-3",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMM yy", { locale: localeId }) : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={disabledDays}
          initialFocus
          locale={localeId}
        />
      </PopoverContent>
    </Popover>
  );
}

export function RoomSearch() {
  // API Hooks for real data
  const { areas } = useAreas();
  const { roomTypes } = useRoomTypes();
  const {
    rooms,
    error: roomsError,
    searchRooms,
    filterRooms: clientFilterRooms,
  } = useRoomAvailability();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [employeeCount, setEmployeeCount] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllRooms, setShowAllRooms] = useState(false); // Show all rooms including full ones

  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [roomRequirements, setRoomRequirements] = useState<
    { type: string; count: number }[]
  >([]);

  const [appliedRoomRequirements, setAppliedRoomRequirements] = useState<
    { type: string; count: number }[]
  >([]);

  const [selectedBeds, setSelectedBeds] = useState<SelectedBed[]>([]);

  const [selectedRoom, setSelectedRoom] = useState<RoomAvailability | null>(
    null
  );
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  // Get buildings for selected area
  const { buildings } = useBuildings(selectedArea || undefined);

  const totalPeople = employeeCount + guestCount;
  const tomorrow = addDays(startOfDay(new Date()), 1);

  const duration =
    startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  const totalRoomRequested = roomRequirements.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setHasSearched(false);
    if (date && endDate && isBefore(endDate, date)) {
      setEndDate(addDays(date, 1));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && startDate) {
      const days = differenceInDays(date, startDate);
      if (days > 90) {
        setEndDate(addDays(startDate, 90));
      } else {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
    }
    setHasSearched(false);
  };

  // Filter rooms client-side (for building filter after search)
  const filteredRooms = useMemo(() => {
    if (!hasSearched || rooms.length === 0) return [];

    let result = clientFilterRooms({
      buildingId: selectedBuilding === "all" ? undefined : selectedBuilding,
      onlyAvailable: !showAllRooms, // When showAllRooms is true, don't filter by availability
    });

    // Filter by Room Requirements (Types) - using APPLIED requirements
    if (appliedRoomRequirements.length > 0) {
      const requiredTypes = new Set(appliedRoomRequirements.map((r) => r.type));
      result = result.filter((r) => requiredTypes.has(r.type));
    }

    result = result.sort((a, b) => b.availableBeds - a.availableBeds);
    return result;
  }, [
    hasSearched,
    rooms,
    selectedBuilding,
    appliedRoomRequirements,
    clientFilterRooms,
    showAllRooms,
  ]);

  const handleSearch = async () => {
    if (!startDate || !endDate || totalPeople === 0 || !selectedArea) return;

    setIsSearching(true);
    setSelectedBeds([]); // Clear bed selections on new search
    setAppliedRoomRequirements(roomRequirements); // Snapshot the requirements

    const success = await searchRooms({
      areaId: selectedArea,
      checkInDate: startDate,
      checkOutDate: endDate,
      includeFullRooms: showAllRooms,
    });

    if (success) {
      setHasSearched(true);
    } else if (roomsError) {
      toast.error(roomsError);
    }

    setIsSearching(false);
  };

  const canSearch =
    startDate &&
    endDate &&
    totalPeople > 0 &&
    duration > 0 &&
    duration <= 91 &&
    !!selectedArea;

  const resetFilters = () => {
    setSelectedBuilding("all");
  };

  const handleBedSelection = (bed: SelectedBed) => {
    setSelectedBeds((prev) => {
      const exists = prev.find((b) => b.bedId === bed.bedId);
      if (exists) {
        // Remove bed
        return prev.filter((b) => b.bedId !== bed.bedId);
      } else {
        // Add bed (if not exceeding limit)
        if (prev.length >= totalPeople) return prev;
        return [...prev, bed];
      }
    });
  };

  const handleRoomSelect = (room: RoomAvailability) => {
    setSelectedRoom(room);
    setRoomDialogOpen(true);
  };

  const handleClearAllBeds = () => {
    setSelectedBeds([]);
  };

  const handleRemoveBed = (bedId: string) => {
    setSelectedBeds((prev) => prev.filter((b) => b.bedId !== bedId));
  };

  const handleBookNow = () => {
    if (selectedBeds.length >= totalPeople) {
      setBookingSheetOpen(true);
    }
  };

  const handleBookingSheetClose = () => {
    setBookingSheetOpen(false);
  };

  // Handle successful booking - refresh timeline data
  const handleBookingSuccess = async () => {
    // Clear selected beds since they're now booked
    setSelectedBeds([]);

    // Re-fetch room data to update timeline with new pending booking
    if (startDate && endDate && selectedArea) {
      await searchRooms({
        areaId: selectedArea,
        checkInDate: startDate,
        checkOutDate: endDate,
        includeFullRooms: showAllRooms,
      });
    }
  };

  const addRequirement = () => {
    if (totalRoomRequested >= totalPeople) return;
    const defaultType = roomTypes.length > 0 ? roomTypes[0].code : "";
    setRoomRequirements([...roomRequirements, { type: defaultType, count: 1 }]);
    setHasSearched(false);
  };

  const removeRequirement = (index: number) => {
    const newReqs = [...roomRequirements];
    newReqs.splice(index, 1);
    setRoomRequirements(newReqs);
    setHasSearched(false);
  };

  const updateRequirement = (
    index: number,
    field: "type" | "count",
    value: string | number
  ) => {
    const newReqs = [...roomRequirements];

    if (field === "count") {
      // Validate room count increase
      const diff = (value as number) - newReqs[index].count;
      if (diff > 0 && totalRoomRequested + diff > totalPeople) return;
    }

    newReqs[index] = { ...newReqs[index], [field]: value };
    setRoomRequirements(newReqs);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar - Compact */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            {/* Area Select */}
            <div className="space-y-1 lg:w-[180px]">
              <Label className="text-xs font-medium flex items-center gap-1">
                Area <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedArea}
                onValueChange={(v) => {
                  setSelectedArea(v);
                  setHasSearched(false);
                  setSelectedBuilding("all");
                }}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pilih Area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates Row */}
            <div className="flex gap-2 flex-1">
              {/* Check-in Date */}
              <div className="space-y-1 flex-1 lg:max-w-[140px]">
                <Label className="text-xs font-medium">Check-in</Label>
                <DatePicker
                  date={startDate}
                  onSelect={handleStartDateChange}
                  label="Tanggal"
                  minDate={tomorrow}
                />
              </div>

              {/* Check-out Date */}
              <div className="space-y-1 flex-1 lg:max-w-[140px]">
                <Label className="text-xs font-medium">Check-out</Label>
                <DatePicker
                  date={endDate}
                  onSelect={handleEndDateChange}
                  label="Tanggal"
                  minDate={startDate ? addDays(startDate, 1) : tomorrow}
                />
              </div>
            </div>

            {/* People Count & Room Config */}
            <div className="space-y-1 lg:w-[200px]">
              <Label className="text-xs font-medium">Orang & Kamar</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start text-left font-normal text-sm"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{totalPeople} org</span>
                      {totalRoomRequested > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center gap-0.5">
                            <Sparkles className="h-3 w-3 text-primary" />
                            {totalRoomRequested}kmr
                          </span>
                        </>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-6">
                    {/* People Count Section */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          Jumlah Orang
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Total penghuni yang akan menginap
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Karyawan */}
                        <div className="flex flex-col gap-2 p-2 border rounded-lg bg-blue-50/30 dark:bg-blue-900/10">
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
                            <Briefcase className="h-3.5 w-3.5" />
                            Karyawan
                          </div>
                          <div className="flex items-center justify-between bg-background border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-r-none"
                              onClick={() => {
                                setEmployeeCount(
                                  Math.max(0, employeeCount - 1)
                                );
                                setHasSearched(false);
                              }}
                              disabled={employeeCount <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center">
                              {employeeCount}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-l-none"
                              onClick={() => {
                                setEmployeeCount(
                                  Math.min(50, employeeCount + 1)
                                );
                                setHasSearched(false);
                              }}
                              disabled={employeeCount >= 50}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Tamu */}
                        <div className="flex flex-col gap-2 p-2 border rounded-lg bg-amber-50/30 dark:bg-amber-900/10">
                          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <UserPlus className="h-3.5 w-3.5" />
                            Tamu
                          </div>
                          <div className="flex items-center justify-between bg-background border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-r-none"
                              onClick={() => {
                                setGuestCount(Math.max(0, guestCount - 1));
                                setHasSearched(false);
                              }}
                              disabled={guestCount <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center">
                              {guestCount}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-l-none"
                              onClick={() => {
                                setGuestCount(Math.min(50, guestCount + 1));
                                setHasSearched(false);
                              }}
                              disabled={guestCount >= 50}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Room Config Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Kebutuhan Kamar
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1.5 font-normal"
                            >
                              Opsional
                            </Badge>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Spesifik tipe & jumlah kamar
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={addRequirement}
                          disabled={totalRoomRequested >= totalPeople}
                        >
                          <Plus className="h-3 w-3" />
                          Tambah
                        </Button>
                      </div>

                      {roomRequirements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-lg bg-muted/20 text-center">
                          <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Belum ada spesifikasi kamar. <br />
                            Sistem akan menampilkan semua opsi.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {roomRequirements.map((req, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 p-2 rounded-lg border bg-card"
                            >
                              <Select
                                value={req.type}
                                onValueChange={(v) =>
                                  updateRequirement(index, "type", v)
                                }
                              >
                                <SelectTrigger className="h-8 flex-1 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map((t) => (
                                    <SelectItem
                                      key={t.id}
                                      value={t.code}
                                      className="text-xs"
                                    >
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center border rounded-md bg-background">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-6 rounded-r-none"
                                  onClick={() =>
                                    updateRequirement(
                                      index,
                                      "count",
                                      Math.max(1, req.count - 1)
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-xs font-semibold">
                                  {req.count}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-6 rounded-l-none"
                                  onClick={() =>
                                    updateRequirement(
                                      index,
                                      "count",
                                      req.count + 1
                                    )
                                  }
                                  disabled={totalRoomRequested >= totalPeople}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeRequirement(index)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {totalRoomRequested > 0 && (
                        <div className="flex items-center justify-between text-xs p-2 bg-primary/5 rounded border border-primary/10 text-primary">
                          <span>Total Kamar Diminta:</span>
                          <span className="font-bold">
                            {totalRoomRequested} / {totalPeople} Max
                          </span>
                        </div>
                      )}

                      {totalRoomRequested >= totalPeople && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Maksimal jumlah kamar tercapai (1 orang/kamar)
                        </p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-3">
            {startDate && endDate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Badge variant="secondary" className="font-normal text-xs h-5">
                  {format(startDate, "dd MMM", { locale: localeId })} -{" "}
                  {format(endDate, "dd MMM", { locale: localeId })}
                </Badge>
                <span className="font-medium">{duration} mlm</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalPeople} org
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                Masukan area dan tanggal untuk mencari
              </div>
            )}

            <Button
              size="sm"
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
              className="w-full sm:w-auto gap-1.5 px-4 font-semibold h-8"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  Cari
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          {/* Results Header with Filter - Compact */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30 px-3 py-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pilih Kamar</span>
              <span className="text-xs text-muted-foreground">
                {areas.find((a) => a.id === selectedArea)?.name} • {totalPeople}{" "}
                org • {duration} mlm
              </span>
            </div>

            {/* Building Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background rounded border">
                <Building2 className="h-3 w-3 text-muted-foreground ml-2" />
                <Select
                  value={selectedBuilding}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger className="h-7 border-none bg-transparent shadow-none focus:ring-0 gap-1 text-xs min-w-[120px]">
                    <SelectValue placeholder="Semua Gedung" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="all" className="text-xs">
                      Semua Gedung
                    </SelectItem>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBuilding !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {/* Toggle to show all rooms */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={showAllRooms ? "secondary" : "ghost"}
                  size="sm"
                  onClick={async () => {
                    const newValue = !showAllRooms;
                    setShowAllRooms(newValue);
                    // Re-search with new value
                    if (startDate && endDate && selectedArea) {
                      setIsSearching(true);
                      await searchRooms({
                        areaId: selectedArea,
                        checkInDate: startDate,
                        checkOutDate: endDate,
                        includeFullRooms: newValue,
                      });
                      setIsSearching(false);
                    }
                  }}
                  className="h-7 px-2 text-xs gap-1.5"
                >
                  <Eye className="h-3 w-3" />
                  {showAllRooms ? "Semua" : "Tersedia"}
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline View with Selection Mode */}
          <RoomAvailabilityTimeline
            rooms={filteredRooms}
            startDate={startDate}
            endDate={endDate}
            onRoomSelect={handleRoomSelect}
            selectedBeds={selectedBeds}
            maxBedSelection={totalPeople}
            selectionMode={true}
          />
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl mb-6 border border-primary/20">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Mulai Pencarian Kamar
          </h3>
          <p className="max-w-md text-muted-foreground">
            Tentukan area lokasi, tanggal check-in/out, dan jumlah orang untuk
            melihat ketersediaan kamar secara real-time.
          </p>
        </div>
      )}

      {/* Room Detail Dialog for Bed Selection */}
      {startDate && endDate && (
        <RoomDetailDialog
          room={selectedRoom}
          open={roomDialogOpen}
          onOpenChange={setRoomDialogOpen}
          startDate={startDate}
          endDate={endDate}
          selectedBeds={selectedBeds}
          onBedSelect={handleBedSelection}
          maxSelection={totalPeople}
          totalSelectedBeds={selectedBeds.length}
        />
      )}

      {/* Selection Summary Bar - Fixed at bottom */}
      {hasSearched && (
        <SelectionSummaryBar
          selectedBeds={selectedBeds}
          totalPeople={totalPeople}
          onClearAll={handleClearAllBeds}
          onBookNow={handleBookNow}
          onRemoveBed={handleRemoveBed}
        />
      )}

      {/* Booking Request Sheet */}
      {bookingSheetOpen && startDate && endDate && (
        <BookingRequestSheet
          searchParams={{
            areaId: selectedArea!,
            startDate: startDate,
            endDate: endDate,
            totalPeople: totalPeople,
            roomRequirements: appliedRoomRequirements,
          }}
          availableRooms={filteredRooms}
          selectedBeds={selectedBeds}
          onClose={handleBookingSheetClose}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

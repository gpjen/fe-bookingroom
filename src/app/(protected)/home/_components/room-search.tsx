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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Search,
  Building2,
  Users,
  Calendar as CalendarIcon,
  Briefcase,
  UserPlus,
  SlidersHorizontal,
  Sparkles,
  Minus,
  Plus,
  X,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  BedDouble,
  Mars,
  Venus,
  User,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  AREAS,
  BUILDINGS,
  ROOM_TYPES,
  MOCK_ROOMS,
  filterRooms,
  type RoomType,
  type RoomAvailability,
} from "./mock-data";
import { RoomAvailabilityTimeline } from "./room-availability-timeline";
import { cn } from "@/lib/utils";
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
  maxDate,
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  label: string;
  minDate?: Date;
  maxDate?: Date;
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [employeeCount, setEmployeeCount] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [roomRequirements, setRoomRequirements] = useState<
    { type: string; count: number }[]
  >([]);

  const [appliedRoomRequirements, setAppliedRoomRequirements] = useState<
    { type: string; count: number }[]
  >([]);

  const [selectedRoom, setSelectedRoom] = useState<RoomAvailability | null>(
    null
  );

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

  const filteredBuildings = useMemo(() => {
    if (!selectedArea || selectedArea === "all") return [];
    return BUILDINGS.filter((b) => b.areaId === selectedArea);
  }, [selectedArea]);

  const filteredRooms = useMemo(() => {
    if (!hasSearched || !selectedArea) return [];

    let rooms = filterRooms(MOCK_ROOMS, {
      areaId: selectedArea,
      buildingId: selectedBuilding === "all" ? undefined : selectedBuilding,
      onlyAvailable: true,
    });

    // Filter by Room Requirements (Types) - using APPLIED requirements
    if (appliedRoomRequirements.length > 0) {
      const requiredTypes = new Set(appliedRoomRequirements.map((r) => r.type));
      rooms = rooms.filter((r) => requiredTypes.has(r.type));
    }

    rooms = rooms.sort((a, b) => b.availableBeds - a.availableBeds);
    return rooms;
  }, [hasSearched, selectedArea, selectedBuilding, appliedRoomRequirements]);

  const handleSearch = () => {
    if (!startDate || !endDate || totalPeople === 0 || !selectedArea) return;
    setAppliedRoomRequirements(roomRequirements); // Snapshot the requirements
    setHasSearched(true);
  };

  const canSearch =
    startDate &&
    endDate &&
    totalPeople > 0 &&
    duration > 0 &&
    duration <= 91 &&
    !!selectedArea;

  const activeFiltersCount = selectedBuilding !== "all" ? 1 : 0;

  const resetFilters = () => {
    setSelectedBuilding("all");
  };

  const addRequirement = () => {
    if (totalRoomRequested >= totalPeople) return;
    setRoomRequirements([...roomRequirements, { type: "standard", count: 1 }]);
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
      {/* Search Bar */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50" />
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            {/* Area Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Area Lokasi <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedArea}
                onValueChange={(v) => {
                  setSelectedArea(v);
                  setHasSearched(false);
                  setSelectedBuilding("all");
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih Area" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Check-in</Label>
              <DatePicker
                date={startDate}
                onSelect={handleStartDateChange}
                label="Pilih tanggal"
                minDate={tomorrow}
              />
            </div>

            {/* Check-out Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Check-out</Label>
              <DatePicker
                date={endDate}
                onSelect={handleEndDateChange}
                label="Pilih tanggal"
                minDate={startDate ? addDays(startDate, 1) : tomorrow}
                maxDate={startDate ? addDays(startDate, 90) : undefined}
              />
            </div>

            {/* People Count & Room Config */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Jumlah Orang & Kamar
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-start text-left font-normal"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span className="flex items-center gap-2 truncate">
                      <span>{totalPeople} Orang</span>
                      {totalRoomRequested > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            {totalRoomRequested} Kamar (
                            {roomRequirements.length} Tipe)
                          </span>
                        </>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="start">
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
                                  {ROOM_TYPES.map((t) => (
                                    <SelectItem
                                      key={t.value}
                                      value={t.value}
                                      className="text-xs"
                                    >
                                      {t.label}
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
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-4">
            {startDate && endDate ? (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary" className="font-normal">
                  {format(startDate, "dd MMM", { locale: localeId })} -{" "}
                  {format(endDate, "dd MMM", { locale: localeId })}
                </Badge>
                <span className="flex items-center gap-1 font-medium">
                  {duration} Malam
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {totalPeople} Orang
                </span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Masukan area dan tanggal untuk mencari
              </div>
            )}

            <Button
              size="lg"
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full md:w-auto gap-2 px-8 font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Search className="h-4 w-4" />
              Cari Kamar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Results Header with Filter */}
          {/* Results Header with Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  Hasil Ketersediaan
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Menampilkan status ketersediaan di{" "}
                  <span className="font-semibold text-foreground">
                    {AREAS.find((a) => a.id === selectedArea)?.name}
                  </span>
                </p>
              </div>

              {/* Building Filter Directly Here */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border">
                  <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
                  <Select
                    value={selectedBuilding}
                    onValueChange={setSelectedBuilding}
                  >
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 gap-2 min-w-[180px]">
                      <SelectValue placeholder="Semua Gedung" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="all">Semua Gedung</SelectItem>
                      {filteredBuildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
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
                    className="h-10 px-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" /> Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <RoomAvailabilityTimeline
            rooms={filteredRooms}
            startDate={startDate}
            endDate={endDate}
            onRoomDetail={setSelectedRoom}
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

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedRoom}
        onOpenChange={(open) => !open && setSelectedRoom(null)}
      >
        <DialogContent className="w-full md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Detail Ruangan
            </DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-6 py-4">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <div>
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      {selectedRoom.code}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium text-foreground">
                          {selectedRoom.buildingName}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium text-foreground">
                          {selectedRoom.areaName}
                        </span>
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-base font-semibold px-4 py-2 bg-background"
                  >
                    {ROOM_TYPES.find((t) => t.value === selectedRoom.type)
                      ?.label || selectedRoom.type}
                  </Badge>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Carousel */}
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-muted/20 border-2 shadow-lg">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {selectedRoom.images.map((img, idx) => (
                            <CarouselItem key={idx}>
                              <div className="p-1">
                                <img
                                  src={img}
                                  alt={`Room ${selectedRoom.code} - Image ${
                                    idx + 1
                                  }`}
                                  className="w-full aspect-video object-cover rounded-lg"
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-6">
                    {/* Category & Gender Badges */}
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Kategori Ruangan
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                          {selectedRoom.allocation === "employee" ? (
                            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="font-semibold text-sm">
                            {selectedRoom.allocation === "employee"
                              ? "Khusus Karyawan"
                              : "Khusus Tamu"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                          {selectedRoom.gender === "male" ? (
                            <Mars className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : selectedRoom.gender === "female" ? (
                            <Venus className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          ) : (
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="font-semibold text-sm">
                            {selectedRoom.gender === "male"
                              ? "Pria"
                              : selectedRoom.gender === "female"
                              ? "Wanita"
                              : "Campur"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        Fasilitas Tersedia
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.facilities.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className="bg-background px-3 py-1.5 text-sm font-medium border-2"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bed Status Section */}
                <div className="space-y-4 pt-4 border-t-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-primary" />
                      Status Ruangan Sekarang
                    </h3>
                    <Badge variant="secondary" className="text-sm">
                      {selectedRoom.availableBeds} / {selectedRoom.beds.length}{" "}
                      Tersedia
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedRoom.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className={cn(
                          "group relative p-4 rounded-xl border-2 text-sm flex flex-col gap-2 transition-all hover:shadow-lg",
                          bed.status === "available"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400"
                            : bed.status === "occupied"
                            ? "bg-slate-50 dark:bg-slate-950/30 border-slate-300 dark:border-slate-700"
                            : bed.status === "reserved"
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                            : "bg-gray-50 dark:bg-gray-950/30 border-gray-300 dark:border-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">
                            Bed {bed.code}
                          </span>
                          {bed.status === "available" ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : bed.status === "occupied" ? (
                            <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          ) : bed.status === "reserved" ? (
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              bed.status === "available"
                                ? "bg-emerald-500"
                                : bed.status === "occupied"
                                ? "bg-slate-500"
                                : bed.status === "reserved"
                                ? "bg-amber-500"
                                : "bg-gray-500"
                            )}
                          />
                          <span className="text-xs font-semibold">
                            {bed.status === "available"
                              ? "Tersedia"
                              : bed.status === "occupied"
                              ? "Terisi"
                              : bed.status === "reserved"
                              ? "Dipesan"
                              : "Maintenance"}
                          </span>
                        </div>

                        {bed.status === "occupied" && bed.occupantName && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div
                              className="text-sm font-bold truncate tracking-wide"
                              title={bed.occupantName}
                            >
                              {(() => {
                                if (!bed.occupantName) return "";
                                return bed.occupantName
                                  .split(" ")
                                  .map((part) => {
                                    if (part.length <= 2) return part;
                                    return (
                                      part[0] +
                                      "*".repeat(part.length - 2) +
                                      part[part.length - 1]
                                    );
                                  })
                                  .join(" ");
                              })()}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                              {bed.occupantCheckIn && (
                                <div className="flex items-center gap-1.5">
                                  <LogIn className="h-3 w-3 text-emerald-600" />
                                  <span>
                                    {format(bed.occupantCheckIn, "d MMM yyyy", {
                                      locale: localeId,
                                    })}
                                  </span>
                                </div>
                              )}
                              {bed.occupantCheckOut && (
                                <div className="flex items-center gap-1.5">
                                  <LogOut className="h-3 w-3 text-destructive" />
                                  <span>
                                    {format(
                                      bed.occupantCheckOut,
                                      "d MMM yyyy",
                                      { locale: localeId }
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

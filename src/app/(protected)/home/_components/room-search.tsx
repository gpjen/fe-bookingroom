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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Building2,
  MapPin,
  BedDouble,
  Users,
  Wifi,
  Tv,
  Wind,
  Bath,
  ChevronRight,
  ChevronDown,
  Crown,
  Star,
  Calendar as CalendarIcon,
  User,
  Clock,
  Briefcase,
  UserPlus,
  SlidersHorizontal,
  Sparkles,
  Minus,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
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
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays, isBefore, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Compact Counter Component
function CompactCounter({
  value,
  onChange,
  min = 0,
  max = 50,
  icon,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-r-none"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-semibold text-sm">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-l-none"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Date Picker Component (Single Date)
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
            "h-9 justify-start text-left font-normal px-3",
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

// Room Card Component
function RoomCard({
  room,
  totalPeople,
}: {
  room: RoomAvailability;
  totalPeople: number;
}) {
  const canFitAll = room.availableBeds >= totalPeople;

  const getRoomTypeStyle = (type: RoomType) => {
    const config = {
      vvip: { icon: <Crown className="h-4 w-4" />, bg: "bg-gradient-to-r from-amber-500 to-yellow-400", text: "text-white" },
      vip: { icon: <Star className="h-4 w-4" />, bg: "bg-gradient-to-r from-violet-500 to-purple-400", text: "text-white" },
      standard: { icon: null, bg: "bg-slate-200 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-200" },
    };
    return config[type];
  };

  const typeStyle = getRoomTypeStyle(room.type);

  const getBedStatusStyle = (status: string) => {
    const config = {
      available: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Kosong" },
      occupied: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/20", label: "Terisi" },
      reserved: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", label: "Dipesan" },
      maintenance: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/20", label: "Perbaikan" },
    };
    return config[status as keyof typeof config];
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      canFitAll && "ring-2 ring-emerald-500/50"
    )}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Room Info */}
          <div className="flex-1 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{room.code}</h3>
                  <Badge className={cn("gap-1", typeStyle.bg, typeStyle.text)}>
                    {typeStyle.icon}
                    {room.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {room.areaName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {room.buildingName}
                  </span>
                  <span>Lantai {room.floor}</span>
                </div>
              </div>
              <div className={cn(
                "text-center px-4 py-2 rounded-lg",
                canFitAll ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"
              )}>
                <p className={cn(
                  "text-2xl font-bold",
                  canFitAll ? "text-emerald-600" : "text-amber-600"
                )}>
                  {room.availableBeds}
                </p>
                <p className="text-xs text-muted-foreground">dari {room.capacity}</p>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">FASILITAS</p>
              <div className="flex flex-wrap gap-1.5">
                {room.facilities.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs font-normal gap-1">
                    {f === "AC" && <Wind className="h-3 w-3" />}
                    {f === "TV" && <Tv className="h-3 w-3" />}
                    {f === "WiFi" && <Wifi className="h-3 w-3" />}
                    {f === "Kamar Mandi Dalam" && <Bath className="h-3 w-3" />}
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bed Status */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">STATUS BED</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {room.beds.map((bed) => {
                  const style = getBedStatusStyle(bed.status);
                  return (
                    <div key={bed.id} className={cn("p-2 rounded-lg", style.bg)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{bed.code}</span>
                        <span className={cn("flex items-center gap-0.5 text-xs", style.color)}>
                          {style.icon}
                        </span>
                      </div>
                      {bed.status === "occupied" && bed.occupantName && (
                        <div className="text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1 truncate">
                            <User className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{bed.occupantName}</span>
                          </div>
                          {bed.occupantCheckOut && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              Out: {format(bed.occupantCheckOut, "dd/MM", { locale: localeId })}
                            </div>
                          )}
                        </div>
                      )}
                      {bed.status === "reserved" && bed.reservedFrom && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5 shrink-0" />
                          {format(bed.reservedFrom, "dd/MM", { locale: localeId })}
                          {bed.reservedTo && <>-{format(bed.reservedTo, "dd/MM", { locale: localeId })}</>}
                        </div>
                      )}
                      {bed.status === "available" && (
                        <p className="text-[10px] text-emerald-600 font-medium">Tersedia</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Action */}
          <div className={cn(
            "flex md:flex-col items-center justify-center gap-3 p-4 md:w-[120px] border-t md:border-t-0 md:border-l",
            canFitAll ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "bg-amber-50/50 dark:bg-amber-900/10"
          )}>
            <Button
              className={cn(
                "w-full gap-1",
                canFitAll ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              Pilih
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!canFitAll && (
              <p className="text-xs text-muted-foreground text-center">
                {room.availableBeds} dari {totalPeople} orang
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoomSearch() {
  // Search inputs
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [employeeCount, setEmployeeCount] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const totalPeople = employeeCount + guestCount;
  const tomorrow = addDays(startOfDay(new Date()), 1);
  
  const duration = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  // Auto-adjust end date when start date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setHasSearched(false);
    if (date && endDate && isBefore(endDate, date)) {
      setEndDate(addDays(date, 1));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && startDate) {
      // Limit max 31 days
      const days = differenceInDays(date, startDate);
      if (days > 30) {
        setEndDate(addDays(startDate, 30));
      } else {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
    }
    setHasSearched(false);
  };

  const filteredBuildings = useMemo(() => {
    if (selectedArea === "all") return BUILDINGS;
    return BUILDINGS.filter((b) => b.areaId === selectedArea);
  }, [selectedArea]);

  const filteredRooms = useMemo(() => {
    if (!hasSearched) return [];

    let rooms = filterRooms(MOCK_ROOMS, {
      areaId: selectedArea === "all" ? undefined : selectedArea,
      buildingId: selectedBuilding === "all" ? undefined : selectedBuilding,
      type: selectedType === "all" ? undefined : (selectedType as RoomType),
      onlyAvailable: true,
    });

    rooms = rooms.sort((a, b) => b.availableBeds - a.availableBeds);
    return rooms;
  }, [hasSearched, selectedArea, selectedBuilding, selectedType]);

  const stats = useMemo(() => {
    const total = filteredRooms.length;
    const totalAvailableBeds = filteredRooms.reduce((acc, r) => acc + r.availableBeds, 0);
    const canAccommodate = totalAvailableBeds >= totalPeople;
    return { total, totalAvailableBeds, canAccommodate };
  }, [filteredRooms, totalPeople]);

  const handleSearch = () => {
    if (!startDate || !endDate || totalPeople === 0) return;
    setHasSearched(true);
  };

  const canSearch = startDate && endDate && totalPeople > 0 && duration > 0 && duration <= 31;

  const activeFiltersCount = [
    selectedArea !== "all",
    selectedBuilding !== "all",
    selectedType !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Bar - Single Row */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Dates */}
            <div className="flex flex-1 items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Check-in</Label>
                <DatePicker
                  date={startDate}
                  onSelect={handleStartDateChange}
                  label="Pilih tanggal"
                  minDate={tomorrow}
                />
              </div>
              <span className="pb-2 text-muted-foreground">→</span>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Check-out</Label>
                <DatePicker
                  date={endDate}
                  onSelect={handleEndDateChange}
                  label="Pilih tanggal"
                  minDate={startDate ? addDays(startDate, 1) : tomorrow}
                  maxDate={startDate ? addDays(startDate, 30) : undefined}
                />
              </div>
            </div>

            {/* People Count */}
            <div className="flex items-end gap-4">
              <CompactCounter
                value={employeeCount}
                onChange={(v) => { setEmployeeCount(v); setHasSearched(false); }}
                icon={<Briefcase className="h-4 w-4 text-blue-500" />}
                label="Karyawan"
              />
              <CompactCounter
                value={guestCount}
                onChange={(v) => { setGuestCount(v); setHasSearched(false); }}
                icon={<UserPlus className="h-4 w-4 text-amber-500" />}
                label="Tamu"
              />
            </div>

            {/* Search Button */}
            <Button
              size="lg"
              onClick={handleSearch}
              disabled={!canSearch}
              className="gap-2 px-6"
            >
              <Search className="h-4 w-4" />
              Cari
            </Button>
          </div>

          {/* Duration Info */}
          {startDate && endDate && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span>
                <strong>{format(startDate, "dd MMM yyyy", { locale: localeId })}</strong> s/d{" "}
                <strong>{format(endDate, "dd MMM yyyy", { locale: localeId })}</strong>
              </span>
              <Badge variant="outline">{duration} malam</Badge>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <strong>{totalPeople}</strong> orang
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Hasil Pencarian
              </h3>
              <p className="text-sm text-muted-foreground">
                Ditemukan {stats.total} kamar dengan {stats.totalAvailableBeds} bed tersedia
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {stats.total} Kamar
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  stats.canAccommodate ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                <BedDouble className="h-3.5 w-3.5" />
                {stats.totalAvailableBeds} Bed
              </Badge>
            </div>
          </div>

          {/* Optional Filters */}
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge className="h-5 w-5 p-0 justify-center text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isFilterOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/30">
                <Select
                  value={selectedArea}
                  onValueChange={(v) => {
                    setSelectedArea(v);
                    setSelectedBuilding("all");
                  }}
                >
                  <SelectTrigger className="h-9">
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
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gedung</SelectItem>
                    {filteredBuildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Room List */}
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4 pr-4">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <RoomCard key={room.id} room={room} totalPeople={totalPeople} />
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium">Tidak ada kamar ditemukan</p>
                    <p className="text-sm text-muted-foreground">Coba ubah filter pencarian</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <BedDouble className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium">Mulai Pencarian Kamar</p>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
              Pilih tanggal check-in, check-out dan jumlah orang untuk mencari kamar yang tersedia
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Bed, DoorOpen } from "lucide-react";
import { MOCK_AREAS, MOCK_BUILDINGS } from "../constants";

interface LocationSectionProps {
  areaId: string;
  onAreaChange: (value: string) => void;
  errors?: Record<string, string>;
}

export function LocationSection({
  areaId,
  onAreaChange,
  errors,
}: LocationSectionProps) {
  const selectedArea = MOCK_AREAS.find((a) => a.id === areaId);
  const filteredBuildings = MOCK_BUILDINGS.filter((b) => b.areaId === areaId);

  // Calculate total available beds and room types for the area
  const totalAvailableBeds = filteredBuildings.reduce((sum, b) => sum + b.availableBeds, 0);
  const totalRooms = filteredBuildings.reduce((sum, b) => sum + b.totalRooms, 0);

  // Aggregate room types across all buildings in the area
  const aggregatedRoomTypes = filteredBuildings.reduce((acc, building) => {
    building.roomTypes.forEach((rt) => {
      const existing = acc.find((a) => a.type === rt.type);
      if (existing) {
        existing.total += rt.total;
        existing.available += rt.available;
        existing.occupied += rt.occupied;
      } else {
        acc.push({ ...rt });
      }
    });
    return acc;
  }, [] as { type: string; total: number; available: number; occupied: number }[]);

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Area Mess</h3>
            <p className="text-sm text-muted-foreground">
              Pilih area mess, gedung dapat dipilih per penghuni
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Area <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-xs">
                Wajib dipilih
              </Badge>
            </div>
            <Select value={areaId} onValueChange={onAreaChange}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Pilih Area Mess" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id} className="py-3">
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary font-medium text-xs">
                          {area.code}
                        </div>
                        <span>{area.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {area.availableBeds} bed tersedia
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.areaId && (
              <p className="text-sm text-destructive mt-2">{errors.areaId}</p>
            )}
          </div>

          {areaId && selectedArea && (
            <div className="space-y-3">
              {/* Area Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Gedung</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {filteredBuildings.length}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <DoorOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-muted-foreground">Kamar</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {totalRooms}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Bed className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Bed Tersedia</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {totalAvailableBeds}
                  </p>
                </div>
              </div>

              {/* Room Types Summary */}
              {aggregatedRoomTypes.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Ketersediaan per Tipe Kamar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aggregatedRoomTypes.map((rt) => (
                      <Badge
                        key={rt.type}
                        variant="outline"
                        className={`text-xs ${
                          rt.available > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700"
                            : "bg-gray-50 text-gray-500 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {rt.type}: {rt.available}/{rt.total} tersedia
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Buildings List */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Gedung di Area Ini
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredBuildings.map((building) => (
                    <div
                      key={building.id}
                      className="p-2 bg-background rounded-lg border text-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{building.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {building.code}
                        </Badge>
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {building.availableBeds} bed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Bed } from "lucide-react";
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
  const totalAvailableBeds = filteredBuildings.reduce((sum, b) => sum + b.availableBeds, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <Label className="font-medium">Area Mess <span className="text-destructive">*</span></Label>
      </div>
      
      <Select value={areaId} onValueChange={onAreaChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih area mess" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_AREAS.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{area.code}</span>
                <span className="text-muted-foreground">-</span>
                <span>{area.name}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {area.availableBeds} bed
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {errors?.areaId && (
        <p className="text-sm text-destructive">{errors.areaId}</p>
      )}

      {areaId && selectedArea && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            <span>{filteredBuildings.length} gedung</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bed className="h-3.5 w-3.5" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {totalAvailableBeds} bed tersedia
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

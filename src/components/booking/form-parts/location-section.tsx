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
import { MapPin, Building } from "lucide-react";
import { MOCK_AREAS, MOCK_BUILDINGS } from "../constants";

interface LocationSectionProps {
  areaId: string;
  buildingId: string;
  onAreaChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  errors?: Record<string, string>;
}

export function LocationSection({
  areaId,
  buildingId,
  onAreaChange,
  onBuildingChange,
  errors,
}: LocationSectionProps) {
  const filteredBuildings = MOCK_BUILDINGS.filter((b) => b.areaId === areaId);

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Lokasi Mess</h3>
            <p className="text-sm text-muted-foreground">
              Pilih area dan gedung mess
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Area <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-xs">
                Pilih satu
              </Badge>
            </div>
            <Select value={areaId} onValueChange={onAreaChange}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Pilih Area Mess" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_AREAS.map((area) => (
                  <SelectItem key={area.id} value={area.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary font-medium text-xs">
                        {area.code}
                      </div>
                      <span>{area.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.areaId && (
              <p className="text-sm text-destructive mt-2">{errors.areaId}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Gedung <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-xs">
                {filteredBuildings.length} tersedia
              </Badge>
            </div>
            <Select
              value={buildingId}
              onValueChange={onBuildingChange}
              disabled={!areaId}
            >
              <SelectTrigger className="w-full h-11">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Pilih Gedung Mess" />
              </SelectTrigger>
              <SelectContent>
                {filteredBuildings.map((building) => (
                  <SelectItem
                    key={building.id}
                    value={building.id}
                    className="py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {building.name} - {building.code}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.buildingId && (
              <p className="text-sm text-destructive mt-2">
                {errors.buildingId}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

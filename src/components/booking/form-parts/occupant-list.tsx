import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Pencil, Trash2, Plus, Building } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { BookingOccupant } from "@/app/(protected)/booking/request/_components/types";

interface OccupantListProps {
  occupants: BookingOccupant[];
  onEdit: (occupant: BookingOccupant) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  errors?: Record<string, string>;
}

export function OccupantList({
  occupants,
  onEdit,
  onDelete,
  onAdd,
  errors,
}: OccupantListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium">Penghuni</span>
          <Badge variant="secondary" className="text-xs">
            {occupants.length}
          </Badge>
        </div>
        <Button type="button" size="sm" onClick={onAdd} className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </Button>
      </div>

      {errors?.occupants && (
        <p className="text-sm text-destructive">{errors.occupants}</p>
      )}

      {occupants.length > 0 ? (
        <div className="space-y-2">
          {occupants.map((occupant) => (
            <div
              key={occupant.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{occupant.name}</span>
                    <Badge variant={occupant.type === "employee" ? "default" : "secondary"} className="text-xs h-5">
                      {occupant.type === "employee" ? "Karyawan" : "Tamu"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{occupant.identifier}</span>
                    {occupant.inDate && occupant.outDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(occupant.inDate, "dd/MM", { locale: localeId })} - {format(occupant.outDate, "dd/MM", { locale: localeId })}
                        <span className="text-primary font-medium">({occupant.duration}h)</span>
                      </span>
                    )}
                    {occupant.buildingName && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {occupant.buildingName}
                        {occupant.roomCode && ` / ${occupant.roomCode}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(occupant)}
                  className="h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(occupant.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada penghuni</p>
        </div>
      )}
    </div>
  );
}

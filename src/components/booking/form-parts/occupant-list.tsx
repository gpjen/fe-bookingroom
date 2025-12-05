import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { OccupantFormData } from "@/app/(protected)/booking/request/_components/types";

interface OccupantListProps {
  occupants: OccupantFormData[];
  onEdit: (occupant: OccupantFormData) => void;
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
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Daftar Penghuni</h3>
              <p className="text-sm text-muted-foreground">
                Tambah dan kelola penghuni mess
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {occupants.length} Penghuni
            </Badge>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAdd}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Penghuni
            </Button>
          </div>
        </div>

        {errors?.occupants && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive">
            <p className="text-sm text-destructive">{errors.occupants}</p>
          </div>
        )}

        {occupants.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Daftar Penghuni Aktif
              </Label>
              <Badge variant="outline" className="text-xs">
                Total: {occupants.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {occupants.map((occupant) => (
                <Card
                  key={occupant.id}
                  className="border hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{occupant.name}</h4>
                            <Badge
                              variant={
                                occupant.type === "employee"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {occupant.type === "employee"
                                ? "Karyawan"
                                : "Tamu"}
                            </Badge>
                            {occupant.companion && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              >
                                Pendamping: {occupant.companion.name}
                              </Badge>
                            )}
                            {occupant.buildingName && (
                              <Badge variant="outline" className="text-xs">
                                {occupant.buildingName}
                              </Badge>
                            )}
                            {occupant.roomCode && (
                              <Badge variant="outline" className="text-xs">
                                Kamar {occupant.roomCode}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {occupant.identifier} •{" "}
                            {occupant.gender === "L"
                              ? "Laki-laki"
                              : "Perempuan"}
                            {occupant.company && ` • ${occupant.company}`}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-primary">
                              {occupant.inDate && occupant.outDate && (
                                <>
                                  {format(occupant.inDate, "dd MMM yyyy", {
                                    locale: localeId,
                                  })}{" "}
                                  -{" "}
                                  {format(occupant.outDate, "dd MMM yyyy", {
                                    locale: localeId,
                                  })}
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {occupant.duration} hari
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(occupant)}
                          className="h-8 w-8"
                        >
                          <User className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(occupant.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Belum ada penghuni ditambahkan
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Klik "Tambah Penghuni" untuk mulai menambahkan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

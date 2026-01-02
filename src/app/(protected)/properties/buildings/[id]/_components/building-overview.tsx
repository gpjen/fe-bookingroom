"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, AlertCircle, Globe, Navigation } from "lucide-react";
import { getBuildingDetail } from "../_actions/building-detail.actions";
import { BuildingDetailData } from "../_actions/building-detail.schema";
import { formatDate } from "@/lib/utils";
import { MapPointInput } from "@/components/maps/map-point-input";

// ========================================
// LOADING STATE
// ========================================

function OverviewLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingOverview({ id }: { id: string }) {
  const [data, setData] = useState<BuildingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    async function fetchData() {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const result = await getBuildingDetail(id);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return <OverviewLoading />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const hasCoordinates = data.latitude && data.longitude;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Building Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informasi Gedung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">
                Kode Gedung
              </span>
              <span className="font-mono font-medium">{data.code}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Status</span>
              <Badge
                variant="outline"
                className={
                  data.status
                    ? "border-emerald-500 text-emerald-600"
                    : "border-slate-400 text-slate-600"
                }
              >
                {data.status ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Tipe Bangunan
              </span>
              <span className="font-medium">
                {data.buildingType?.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Total Ruangan
              </span>
              <span className="font-medium">{data._count.rooms}</span>
            </div>
          </div>

          {/* Area Info */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lokasi
            </h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Area</span>
                <span className="font-medium">
                  <span className="font-mono text-xs">{data.area.code}</span> -{" "}
                  {data.area.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">
                  Alamat Area
                </span>
                <span className="font-medium">{data.area.location || "-"}</span>
              </div>
              {data.address && (
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Alamat Gedung
                  </span>
                  <span className="font-medium">{data.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informasi Waktu
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Dibuat</span>
                <span className="font-medium">
                  {formatDate(data.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">
                  Diperbarui
                </span>
                <span className="font-medium">
                  {formatDate(data.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Lokasi di Peta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasCoordinates ? (
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <div className="h-[300px]">
                  <MapPointInput
                    value={{
                      lat: data.latitude!,
                      lng: data.longitude!,
                    }}
                    readOnly={true}
                    defaultZoom={15}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  <strong>Lat:</strong> {data.latitude?.toFixed(6)}
                </span>
                <span>
                  <strong>Lng:</strong> {data.longitude?.toFixed(6)}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] border rounded-lg flex flex-col items-center justify-center bg-muted/20">
              <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                Koordinat lokasi belum ditentukan.
                <br />
                <span className="text-xs">
                  Edit gedung untuk menambahkan lokasi.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

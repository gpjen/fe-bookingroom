"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  MoreVertical,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BuildingDetailData } from "../_actions/building-detail.schema";

// ========================================
// STATUS BADGE
// ========================================

const StatusBadge = ({ status }: { status: boolean }) => {
  const config = status
    ? {
        className:
          "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        label: "Aktif",
        icon: CheckCircle2,
      }
    : {
        className:
          "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        label: "Tidak Aktif",
        icon: AlertCircle,
      };

  const Icon = config.icon;

  return (
    <Badge className={cn("gap-1.5", config.className)} variant="outline">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};

// ========================================
// PROPS
// ========================================

interface BuildingHeaderProps {
  initialData: BuildingDetailData;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingHeader({ initialData: data }: BuildingHeaderProps) {
  // Export Logic
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Sedang menyiapkan laporan...", { duration: 2000 });

    try {
      const { exportBuildingData } = await import(
        "../_actions/export-building.actions"
      );
      const res = await exportBuildingData(data.id);

      if (res.success) {
        // Convert Base64 to Blob
        const byteCharacters = atob(res.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Trigger Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Laporan berhasil diunduh");
      } else {
        toast.error("Gagal mengunduh laporan", { description: res.error });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/properties/buildings">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span className="font-mono">{data.code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{data.area.name}</span>
          </div>
          {data.buildingType && (
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              <span>{data.buildingType.name}</span>
            </div>
          )}
        </div>
        {data.address && (
          <p className="text-sm text-muted-foreground mt-1">{data.address}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Export Excel
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi Lainnya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Gedung
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

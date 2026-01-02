"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Layers,
  Edit,
  MoreVertical,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" /> Edit
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

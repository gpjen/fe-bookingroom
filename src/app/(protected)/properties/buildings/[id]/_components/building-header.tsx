"use client";

import { useState, useEffect } from "react";
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
  Construction,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types
interface BuildingHeaderData {
  id: string;
  code: string;
  name: string;
  areal: string;
  status: "active" | "inactive" | "maintenance" | "development";
  totalFloors: number;
}

// Mock Data Fetcher
const fetchHeaderData = async (id: string): Promise<BuildingHeaderData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        code: "BLD-LQ-01",
        name: "Gedung A (Mess)",
        areal: "MESS LQ",
        status: "active",
        totalFloors: 3,
      });
    }, 1000); // Simulate 1s delay
  });
};

const StatusBadge = ({ status }: { status: BuildingHeaderData["status"] }) => {
  const variants = {
    active: {
      className:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
      label: "Aktif",
      icon: CheckCircle2,
    },
    inactive: {
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      label: "Tidak Aktif",
      icon: AlertCircle,
    },
    maintenance: {
      className:
        "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      label: "Perbaikan",
      icon: Construction,
    },
    development: {
      className:
        "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      label: "Pengembangan",
      icon: Construction,
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge className={cn("gap-1.5", config.className)} variant="outline">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};

export function BuildingHeader({ id }: { id: string }) {
  const [data, setData] = useState<BuildingHeaderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeaderData(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    );
  }

  if (!data) return null;

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
            <span>{data.code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{data.areal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{data.totalFloors} Lantai</span>
          </div>
        </div>
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

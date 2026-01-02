"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingsTable } from "./buildings-table";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  BuildingWithRelations,
  AreaOption,
  BuildingTypeOption,
} from "../_actions/buildings.schema";

// ========================================
// LOADING COMPONENT (exported for page.tsx if needed)
// ========================================

export function LoadingState() {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </Card>
  );
}

// ========================================
// ERROR COMPONENT
// ========================================

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Gagal Memuat Data</h3>
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </Button>
        )}
      </div>
    </Card>
  );
}

// ========================================
// CLIENT PAGE COMPONENT
// ========================================

interface BuildingsPageClientProps {
  initialBuildings: BuildingWithRelations[];
  initialAreas: AreaOption[];
  initialBuildingTypes: BuildingTypeOption[];
  initialError: string | null;
}

export function BuildingsPageClient({
  initialBuildings,
  initialAreas,
  initialBuildingTypes,
  initialError,
}: BuildingsPageClientProps) {
  // ✅ If there's an error on initial load, show error state
  if (initialError && initialBuildings.length === 0) {
    return <ErrorState message={initialError} />;
  }

  // ✅ Simply pass data to BuildingsTable - it handles all CRUD with optimistic updates
  return (
    <BuildingsTable
      initialData={initialBuildings}
      areas={initialAreas}
      buildingTypes={initialBuildingTypes}
    />
  );
}

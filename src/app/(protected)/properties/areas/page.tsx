"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAreas } from "./_actions/areas.actions";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AreasTable } from "./_components/areas-table";

// ========================================
// TYPES
// ========================================

type Area = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "DEVELOPMENT";
  description: string | null;
  polygon: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// LOADING COMPONENT
// ========================================

function LoadingState() {
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
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
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </Card>
  );
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use ref to prevent double fetch in Strict Mode
  const isFetching = useRef(false);

  // ✅ Fetch function with deduplication
  const fetchData = useCallback(async () => {
    // Skip if already fetching
    if (isFetching.current) return;
    isFetching.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAreas();

      if (result.success) {
        setAreas(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data");
      console.error(err);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

  // ✅ Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Callback untuk refresh data setelah CRUD
  const handleDataChange = useCallback(() => {
    // Re-fetch data after CRUD operation
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return <AreasTable initialData={areas} onDataChange={handleDataChange} />;
}

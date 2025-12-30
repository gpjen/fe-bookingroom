"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getRoomTypes } from "./_actions/room-types.actions";
import type { RoomType } from "./_actions/room-types.actions";
import { RoomTypesTable } from "./_components/room-types-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// ========================================
// LOADING STATE COMPONENT
// ========================================

function LoadingState() {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </Card>
  );
}

// ========================================
// ERROR STATE COMPONENT
// ========================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </Card>
  );
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deduplication: prevent double fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getRoomTypes();

      if (result.success) {
        setRoomTypes(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("[FETCH_ROOM_TYPES_ERROR]", err);
      setError("Gagal mengambil data tipe ruangan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchData();
    }
  }, [fetchData]);

  // Callback for child components to trigger refresh
  const handleDataChange = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={fetchData} />;
  }

  // Success state - render table
  return (
    <RoomTypesTable initialData={roomTypes} onDataChange={handleDataChange} />
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompaniesTable } from "./companies-table";
import { getCompanies } from "../_actions/companies.actions";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Company } from "@prisma/client";

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
// CLIENT PAGE COMPONENT
// ========================================

interface CompaniesPageClientProps {
  initialCompanies: Company[];
  initialError: string | null;
}

export function CompaniesPageClient({
  initialCompanies,
  initialError,
}: CompaniesPageClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  // Ref to prevent duplicate fetches
  const isFetching = useRef(false);

  // Refresh data function (for CRUD operations)
  const refreshData = useCallback(async (showLoading = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getCompanies();

      if (result.success) {
        setCompanies(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data");
      console.error(err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      isFetching.current = false;
    }
  }, []);

  // Handle data change (after CRUD)
  const handleDataChange = useCallback(() => {
    refreshData(false);
  }, [refreshData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refreshData(true);
  }, [refreshData]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && companies.length === 0) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  return (
    <CompaniesTable initialData={companies} onDataChange={handleDataChange} />
  );
}

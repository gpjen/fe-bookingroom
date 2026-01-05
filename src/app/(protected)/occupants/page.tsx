import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getOccupantsPageData } from "./_actions/occupants.actions";
import { OccupantsClient } from "./_components/occupants-client";

// ========================================
// LOADING SKELETON
// ========================================

function OccupantsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 max-w-sm" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table */}
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ========================================
// METADATA
// ========================================

export const metadata = {
  title: "Penghuni - E-Booking",
  description: "Kelola data penghuni dari semua bangunan",
};

// ========================================
// ASYNC DATA WRAPPER
// ========================================

async function OccupantsDataWrapper({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await search params
  const params = await searchParams;

  // Parse query params
  const query = {
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 20,
    search: params.search as string | undefined,
    status: params.status as string | undefined,
    occupantType: params.type as "EMPLOYEE" | "GUEST" | undefined,
    gender: params.gender as "MALE" | "FEMALE" | undefined,
    buildingId: params.building as string | undefined,
    areaId: params.area as string | undefined,
    hasBooking: params.booking as "true" | "false" | undefined,
    sortField: "createdAt" as const,
    sortDir: "desc" as const,
  };

  // Fetch all data in parallel
  const result = await getOccupantsPageData(query);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium">Gagal memuat data</p>
          <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <OccupantsClient
      initialData={result.data.occupants}
      initialStats={result.data.stats}
      filterOptions={result.data.filterOptions}
    />
  );
}

// ========================================
// PAGE COMPONENT (Server Component)
// ========================================

export default async function OccupantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<OccupantsLoadingSkeleton />}>
      <OccupantsDataWrapper searchParams={searchParams} />
    </Suspense>
  );
}

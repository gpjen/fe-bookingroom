"use client";

import { useState, useCallback, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingHeader } from "./building-header";
import { BuildingStats } from "./building-stats";
import { BuildingOverview } from "./building-overview";
import { BuildingPIC } from "./building-pic";
import { Layers, Info, Images, Users } from "lucide-react";
import { useBreadcrumbOverride } from "@/hooks/use-breadcrumb-override";
import {
  BuildingDetailData,
  BuildingStatsData,
  FloorWithRooms,
} from "../_actions/building-detail.schema";
import { RoomTypeOption } from "../_actions/room.types";
import { getRoomsGroupedByFloor } from "../_actions/building-detail.actions";

// Lazy load heavy components
const BuildingFloors = lazy(() =>
  import("./building-floors").then((mod) => ({ default: mod.BuildingFloors }))
);

const BuildingGallery = lazy(() =>
  import("./building-gallery").then((mod) => ({ default: mod.BuildingGallery }))
);

// ========================================
// LOADING SKELETONS
// ========================================

function FloorsLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================
// PROPS
// ========================================

interface BuildingDetailClientProps {
  id: string;
  code: string;
  initialDetail: BuildingDetailData;
  initialStats: BuildingStatsData;
  initialFloors: FloorWithRooms[];
  roomTypes: RoomTypeOption[];
}

// ========================================
// CLIENT COMPONENT
// ========================================

export function BuildingDetailClient({
  id,
  code,
  initialDetail,
  initialStats,
  initialFloors,
  roomTypes,
}: BuildingDetailClientProps) {
  const [activeTab, setActiveTab] = useState("floors");
  const router = useRouter();

  // Lazy loading states
  const [floorsData, setFloorsData] = useState<FloorWithRooms[]>(initialFloors);
  const [floorsLoading, setFloorsLoading] = useState(false);

  // Track which tabs have been visited for lazy loading
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set(["floors"])
  );

  // Override breadcrumb to show building code instead of ID
  useBreadcrumbOverride(id, code);

  // Handle tab change - lazy load data if needed
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  }, []);

  // Refresh floors data
  const refreshFloorsData = useCallback(async () => {
    setFloorsLoading(true);
    const result = await getRoomsGroupedByFloor(id);
    if (result.success) {
      setFloorsData(result.data);
    }
    setFloorsLoading(false);
  }, [id]);

  // Refresh page data after mutations
  const handleRefresh = useCallback(() => {
    router.refresh();
    refreshFloorsData();
  }, [router, refreshFloorsData]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header - receives initial data */}
      <BuildingHeader initialData={initialDetail} />

      {/* Stats Cards - receives initial data */}
      <BuildingStats initialData={initialStats} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex space-x-2">
          <TabsTrigger value="floors" className="flex-1 gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Lantai & Kamar</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex-1 gap-1.5">
            <Info className="w-4 h-4" />
            <span>Informasi</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex-1 gap-1.5">
            <Images className="w-4 h-4" />
            <span>Galeri</span>
          </TabsTrigger>
          <TabsTrigger value="pic" className="flex-1 gap-1.5">
            <Users className="w-4 h-4" />
            <span>PIC</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floors" className="space-y-4">
          <Suspense fallback={<FloorsLoadingSkeleton />}>
            {floorsLoading ? (
              <FloorsLoadingSkeleton />
            ) : (
              <BuildingFloors
                buildingId={id}
                initialData={floorsData}
                roomTypes={roomTypes}
                onRefresh={handleRefresh}
              />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <BuildingOverview initialData={initialDetail} />
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Suspense fallback={<GalleryLoadingSkeleton />}>
            {visitedTabs.has("gallery") && <BuildingGallery buildingId={id} />}
          </Suspense>
        </TabsContent>

        <TabsContent value="pic" className="space-y-4">
          <BuildingPIC id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

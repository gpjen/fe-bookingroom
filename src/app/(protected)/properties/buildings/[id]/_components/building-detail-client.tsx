"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingHeader } from "./building-header";
import { BuildingStats } from "./building-stats";
import { BuildingFloors } from "./building-floors";
import { BuildingOverview } from "./building-overview";
import { BuildingFacilities } from "./building-facilities";
import { BuildingPIC } from "./building-pic";
import { Grip, Info, Layers, Users } from "lucide-react";
import { useBreadcrumbOverride } from "@/hooks/use-breadcrumb-override";

// ========================================
// PROPS
// ========================================

interface BuildingDetailClientProps {
  id: string;
  code: string;
}

// ========================================
// CLIENT COMPONENT
// ========================================

export function BuildingDetailClient({ id, code }: BuildingDetailClientProps) {
  const [activeTab, setActiveTab] = useState("floors");

  // Override breadcrumb to show building code instead of ID
  useBreadcrumbOverride(id, code);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <BuildingHeader id={id} />

      {/* Stats Cards */}
      <BuildingStats id={id} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex space-x-2">
          <TabsTrigger value="floors" className="flex-1">
            <Layers className="w-4 h-4" />
            <span className="">Lantai & Kamar</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex-1">
            <Info className="w-4 h-4" />
            <span className="">Informasi</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex-1">
            <Grip className="w-4 h-4" />
            <span className="">Fasilitas</span>
          </TabsTrigger>
          <TabsTrigger value="pic" className="flex-1">
            <Users className="w-4 h-4" />
            <span className="">Penanggung Jawab</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floors" className="space-y-4">
          <BuildingFloors id={id} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <BuildingOverview id={id} />
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <BuildingFacilities id={id} />
        </TabsContent>

        <TabsContent value="pic" className="space-y-4">
          <BuildingPIC id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

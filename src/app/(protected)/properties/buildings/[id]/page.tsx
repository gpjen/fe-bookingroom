"use client";

import { useState, use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingHeader } from "./_components/building-header";
import { BuildingStats } from "./_components/building-stats";
import { BuildingFloors } from "./_components/building-floors";
import { BuildingOverview } from "./_components/building-overview";
import { BuildingFacilities } from "./_components/building-facilities";

export default function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("floors");

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <BuildingHeader id={id} />

      {/* Stats Cards */}
      <BuildingStats id={id} />

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="floors">Lantai & Kamar</TabsTrigger>
          <TabsTrigger value="overview">Informasi Umum</TabsTrigger>
          <TabsTrigger value="facilities">Fasilitas</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

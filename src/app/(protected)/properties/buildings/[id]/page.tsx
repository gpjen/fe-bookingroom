"use client";

import { useState, use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingHeader } from "./_components/building-header";
import { BuildingStats } from "./_components/building-stats";
import { BuildingFloors } from "./_components/building-floors";
import { BuildingOverview } from "./_components/building-overview";
import { BuildingFacilities } from "./_components/building-facilities";
import { BuildingPIC } from "./_components/building-pic";
import { Grip, Info, Layers, Users } from "lucide-react";

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
      >
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

"use client";

import { QuickRequestWidget } from "./_components/quick-request-widget";
import { RoomSearch } from "./_components/room-search";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Selamat Datang
        </h1>
        <p className="text-muted-foreground text-base">
          Portal booking mess perusahaan
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Room Search - Main Content */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <RoomSearch />
        </div>

        {/* Quick Request Widget - Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <QuickRequestWidget />
        </div>
      </div>
    </div>
  );
}

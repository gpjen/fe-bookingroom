"use client";

import { QuickRequestWidget } from "@/app/(protected)/home/_components/quick-request-widget";

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

      {/* Content Grid - Placeholder untuk konten yang akan ditentukan */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Request Widget */}
        <div className="lg:col-span-1">
          <QuickRequestWidget />
        </div>

        {/* Placeholder untuk konten lainnya */}
        <div className="lg:col-span-2">
          {/* Area untuk konten tambahan yang akan direview */}
        </div>
      </div>
    </div>
  );
}

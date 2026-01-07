"use client";

import { RoomSearch } from "./_components/room-search";
import { BookingGuideSheet } from "./_components/booking-guide";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header & Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Selamat Datang
          </h1>
          <p className="text-muted-foreground">
            Portal booking mess perusahaan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Booking Guide Sheet Trigger */}
          <BookingGuideSheet
            trigger={
              <Button
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Panduan</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Content - Full Height Room Search */}
      <div className="flex-1 min-h-0">
        <RoomSearch />
      </div>
    </div>
  );
}

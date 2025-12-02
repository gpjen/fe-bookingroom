"use client";

import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "./_components/settings-form";

export default function SettingsPage() {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" /> Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground">
            Kelola konfigurasi global aplikasi, aturan booking, dan preferensi
            notifikasi.
          </p>
        </div>

        <SettingsForm />
      </div>
    </Card>
  );
}

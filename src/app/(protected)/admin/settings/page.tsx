import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SettingsForm } from "./_components/settings-form";
import { getSystemSettings } from "./_actions/settings.actions";

export default async function SettingsPage() {
  const result = await getSystemSettings();

  if (!result.success) {
    return (
      <Card className="p-6 m-6 border-destructive/50 bg-destructive/5">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive">
            Gagal Memuat Pengaturan
          </h2>
          <p className="text-muted-foreground max-w-md">
            {result.error}. Pastikan database sudah di-seed dengan data awal.
          </p>
        </div>
      </Card>
    );
  }

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

        <SettingsForm initialData={result.data} />
      </div>
    </Card>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pemesanan Saya</h1>
        <p className="text-muted-foreground">
          Daftar pemesanan yang telah dilakukan oleh pengguna.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pemesanan Saya</CardTitle>
          <CardDescription>
            Daftar pemesanan yang telah dilakukan oleh pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"></CardContent>
      </Card>
    </div>
  );
}

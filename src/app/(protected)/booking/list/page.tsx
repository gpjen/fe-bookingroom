"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Booking</h1>
        <p className="text-muted-foreground">
          Daftar booking yang telah dilakukan oleh pengguna.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Booking</CardTitle>
          <CardDescription>
            Daftar booking yang telah dilakukan oleh pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"></CardContent>
      </Card>
    </div>
  );
}

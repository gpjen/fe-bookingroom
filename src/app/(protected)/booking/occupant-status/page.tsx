"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Penghuni</h1>
        <p className="text-muted-foreground">
          Daftar penghuni yang telah melakukan pemesanan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penghuni</CardTitle>
          <CardDescription>
            Daftar penghuni yang telah melakukan pemesanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"></CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ArrowLeft, Home } from "lucide-react";

export default function BuildingNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <Building2 className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gedung Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">
            Gedung yang Anda cari tidak ditemukan atau sudah dihapus.
          </p>
          <div className="flex gap-3">
            <Link href="/properties/buildings">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar
              </Button>
            </Link>
            <Link href="/home">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                Ke Beranda
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

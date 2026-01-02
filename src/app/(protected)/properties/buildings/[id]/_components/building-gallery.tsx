"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Images, Plus, Upload } from "lucide-react";

// ========================================
// PROPS
// ========================================

interface BuildingGalleryProps {
  buildingId: string;
}

// ========================================
// PLACEHOLDER COMPONENT
// ========================================

export function BuildingGallery({ buildingId }: BuildingGalleryProps) {
  // TODO: Implement actual gallery fetch and CRUD
  console.log("BuildingGallery for:", buildingId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Images className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Galeri Gedung</CardTitle>
              <p className="text-xs text-muted-foreground">
                Kelola foto dan gambar gedung
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Images className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Belum Ada Gambar</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Upload gambar gedung untuk memberikan informasi visual kepada
            pengguna.
          </p>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Gambar Pertama
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

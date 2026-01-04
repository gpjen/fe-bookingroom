"use client";

import { useState, useOptimistic, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Images,
  Plus,
  MoreVertical,
  Trash2,
  Star,
  Pencil,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { BuildingImage } from "../_actions/gallery.types";
import {
  uploadBuildingImage,
  deleteBuildingImage,
  setPrimaryImage,
  updateBuildingImage,
} from "../_actions/gallery.actions";

interface BuildingGalleryProps {
  buildingId: string;
  initialImages: BuildingImage[];
}

type OptimisticAction =
  | { type: "add"; data: BuildingImage }
  | { type: "delete"; id: string }
  | { type: "update"; data: BuildingImage }
  | { type: "setPrimary"; id: string };

export function BuildingGallery({
  buildingId,
  initialImages,
}: BuildingGalleryProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");

  const [, startTransition] = useTransition();

  // Optimistic State
  const [optimisticImages, dispatchOptimistic] = useOptimistic(
    initialImages,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case "add":
          // Add new image to top
          return [action.data, ...state];
        case "delete":
          return state.filter((img) => img.id !== action.id);
        case "update":
          return state.map((img) =>
            img.id === action.data.id ? action.data : img
          );
        case "setPrimary":
          // Set selected to true, others to false, and sort (primary first)
          return state
            .map((img) => ({
              ...img,
              isPrimary: img.id === action.id,
            }))
            .sort((a, b) =>
              a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
            );
        default:
          return state;
      }
    }
  );

  // Handlers
  const handleUpload = async () => {
    if (!imageUrl) return;
    setIsUploading(true);

    const tempId = `temp-${Date.now()}`;
    const newImage: BuildingImage = {
      id: tempId,
      buildingId,
      url: imageUrl,
      caption: caption || null,
      isPrimary: optimisticImages.length === 0, // First image is primary
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    startTransition(async () => {
      // 1. Optimistic Update
      dispatchOptimistic({ type: "add", data: newImage });
      setIsUploadOpen(false);
      setImageUrl("");
      setCaption("");

      // 2. Server Action
      const result = await uploadBuildingImage({
        buildingId,
        url: newImage.url,
        caption: newImage.caption,
        isPrimary: newImage.isPrimary,
        order: newImage.order,
      });

      setIsUploading(false);

      if (!result.success) {
        toast.error(result.error);
        // Rollback is tricky with optimistic, usually we'd reload or revert
        // For now, simpler error handling
      } else {
        toast.success("Gambar berhasil diupload");
      }
    });
  };

  const handleDelete = (image: BuildingImage) => {
    toast.promise(
      async () => {
        startTransition(() => {
          dispatchOptimistic({ type: "delete", id: image.id });
        });
        const result = await deleteBuildingImage(image.id);
        if (!result.success) throw new Error(result.error);
      },
      {
        loading: "Menghapus gambar...",
        success: "Gambar dihapus",
        error: "Gagal menghapus gambar",
      }
    );
  };

  const handleSetPrimary = (image: BuildingImage) => {
    if (image.isPrimary) return;

    startTransition(async () => {
      dispatchOptimistic({ type: "setPrimary", id: image.id });
      const result = await setPrimaryImage(image.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Gambar ditetapkan sebagai utama");
      }
    });
  };

  const handleEditCaption = (image: BuildingImage) => {
    // TODO: Implement dedicated edit dialog if needed
    // For now, prompt prompt is simple (not ideal for prod but quick for prototype)
    const newCaption = window.prompt("Edit Caption", image.caption || "");
    if (newCaption === null) return;

    startTransition(async () => {
      const updatedImage = { ...image, caption: newCaption };
      dispatchOptimistic({ type: "update", data: updatedImage });

      const result = await updateBuildingImage(image.id, {
        caption: newCaption,
      });
      if (!result.success) toast.error(result.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Galeri Gedung</h3>
          <p className="text-sm text-muted-foreground">
            Total {optimisticImages.length} foto tersedia
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Foto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Foto Gedung</DialogTitle>
              <DialogDescription>
                Masukkan URL gambar (misal dari Google Drive public link atau
                hosting gambar).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>URL Gambar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={imageUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Caption (Opsional)</Label>
                <Input
                  placeholder="Tampak depan..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
              {/* Preview */}
              {imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={isUploading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!imageUrl || isUploading}
              >
                {isUploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {optimisticImages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Images className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Belum Ada Gambar</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Upload gambar untuk memberikan visualisasi gedung ini.
            </p>
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
              Upload Gambar Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimisticImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={image.url}
                  alt={image.caption || "Building Image"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />

                {/* Badges / Overlay */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {image.isPrimary && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Utama
                    </Badge>
                  )}
                </div>

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSetPrimary(image)}
                        disabled={image.isPrimary}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Jadikan Utama
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditCaption(image)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Ubah Caption
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(image)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Gambar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Caption Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-sm font-medium truncate">
                    {image.caption || "Tanpa caption"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useOptimistic, useTransition, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Images,
  Plus,
  MoreVertical,
  Trash2,
  Star,
  Pencil,
  Loader2,
  Upload,
  X,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import { BuildingImage, IMAGE_UPLOAD_CONFIG } from "../_actions/gallery.types";
import {
  uploadBuildingImage,
  deleteBuildingImage,
  setPrimaryImage,
  updateBuildingImage,
} from "../_actions/gallery.actions";
import { cn } from "@/lib/utils";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const [, startTransition] = useTransition();

  // Optimistic State
  const [optimisticImages, dispatchOptimistic] = useOptimistic(
    initialImages,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case "add":
          return [action.data, ...state];
        case "delete":
          return state.filter((img) => img.id !== action.id);
        case "update":
          return state.map((img) =>
            img.id === action.data.id ? action.data : img
          );
        case "setPrimary":
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!IMAGE_UPLOAD_CONFIG.acceptedTypes.includes(file.type)) {
      toast.error("Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP");
      return;
    }

    // Validate file size
    if (file.size > IMAGE_UPLOAD_CONFIG.maxFileSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);

    // Create temp optimistic image
    const tempId = `temp-${Date.now()}`;
    const tempImage: BuildingImage = {
      id: tempId,
      buildingId,
      fileName: selectedFile.name,
      filePath: previewUrl || "",
      fileSize: selectedFile.size,
      mimeType: "image/webp",
      width: null,
      height: null,
      caption: caption || null,
      isPrimary: optimisticImages.length === 0,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    startTransition(async () => {
      // Optimistic update
      dispatchOptimistic({ type: "add", data: tempImage });
      setUploadProgress(30);

      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("buildingId", buildingId);
      formData.append("caption", caption || "");
      formData.append("isPrimary", String(optimisticImages.length === 0));

      setUploadProgress(50);

      // Call server action
      const result = await uploadBuildingImage(formData);

      setUploadProgress(100);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Gambar berhasil diupload");
      }

      // Cleanup
      setIsUploading(false);
      setUploadProgress(0);
      setIsUploadOpen(false);
      clearFileSelection();
      setCaption("");
    });
  };

  // Handle delete
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

  // Handle set primary
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

  // Handle edit caption
  const handleEditCaption = (image: BuildingImage) => {
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Foto Gedung</DialogTitle>
              <DialogDescription>
                Pilih file gambar (JPG, PNG, GIF, WebP). Maksimal 10MB. Gambar
                akan dikompresi ke format WebP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* File Input Area */}
              {!selectedFile ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">
                    Klik untuk pilih foto atau drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF, atau WebP (Maks. 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    {previewUrl && (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearFileSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <Label>Caption (Opsional)</Label>
                <Input
                  placeholder="Tampak depan gedung..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Mengupload dan mengkompresi gambar...
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadOpen(false);
                  clearFileSelection();
                  setCaption("");
                }}
                disabled={isUploading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
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

      {/* Empty State */}
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
              <Upload className="mr-2 h-4 w-4" />
              Upload Gambar Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimisticImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={image.filePath}
                  alt={image.caption || image.fileName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={image.id.startsWith("temp-")}
                />

                {/* Primary Badge */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {image.isPrimary && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Utama
                    </Badge>
                  )}
                </div>

                {/* Actions */}
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
                    {image.caption || image.fileName}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {formatFileSize(image.fileSize)}
                    {image.width && image.height && (
                      <span>
                        {" "}
                        · {image.width}×{image.height}
                      </span>
                    )}
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

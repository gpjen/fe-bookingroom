"use client";

import {
  useState,
  useOptimistic,
  useTransition,
  useRef,
  useEffect,
} from "react";
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
import { RoomImage, IMAGE_UPLOAD_CONFIG } from "../_actions/gallery.types";
import {
  getRoomImages,
  uploadRoomImage,
  deleteRoomImage,
  setRoomPrimaryImage,
  updateRoomImage,
} from "../_actions/room-gallery.actions";
import { cn } from "@/lib/utils";

// ========================================
// TYPES
// ========================================

interface RoomGalleryProps {
  roomId: string;
  className?: string;
}

type OptimisticAction =
  | { type: "add"; data: RoomImage }
  | { type: "delete"; id: string }
  | { type: "update"; data: RoomImage }
  | { type: "setPrimary"; id: string }
  | { type: "setAll"; data: RoomImage[] };

// ========================================
// COMPONENT
// ========================================

export function RoomGallery({ roomId, className }: RoomGalleryProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const [, startTransition] = useTransition();

  // Image state - start with empty, load on mount
  const [images, setImages] = useState<RoomImage[]>([]);

  // Optimistic State
  const [optimisticImages, dispatchOptimistic] = useOptimistic(
    images,
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
        case "setAll":
          return action.data;
        default:
          return state;
      }
    }
  );

  // Fetch images on mount
  useEffect(() => {
    async function fetchImages() {
      setIsLoading(true);
      const result = await getRoomImages(roomId);
      if (result.success) {
        setImages(result.data);
      }
      setIsLoading(false);
    }
    fetchImages();
  }, [roomId]);

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
    const tempImage: RoomImage = {
      id: tempId,
      roomId,
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
      formData.append("roomId", roomId);
      formData.append("caption", caption || "");
      formData.append("isPrimary", String(optimisticImages.length === 0));

      setUploadProgress(50);

      // Call server action
      const result = await uploadRoomImage(formData);

      setUploadProgress(100);

      if (!result.success) {
        toast.error(result.error);
        // Refresh to get correct state
        const refreshResult = await getRoomImages(roomId);
        if (refreshResult.success) {
          setImages(refreshResult.data);
        }
      } else {
        toast.success("Gambar berhasil diupload");
        // Add the real image to state
        setImages((prev) => [
          result.data,
          ...prev.filter((img) => !img.id.startsWith("temp-")),
        ]);
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
  const handleDelete = (image: RoomImage) => {
    toast.promise(
      async () => {
        startTransition(() => {
          dispatchOptimistic({ type: "delete", id: image.id });
        });
        const result = await deleteRoomImage(image.id);
        if (!result.success) throw new Error(result.error);
        // Update local state
        setImages((prev) => prev.filter((img) => img.id !== image.id));
      },
      {
        loading: "Menghapus gambar...",
        success: "Gambar dihapus",
        error: "Gagal menghapus gambar",
      }
    );
  };

  // Handle set primary
  const handleSetPrimary = (image: RoomImage) => {
    if (image.isPrimary) return;

    startTransition(async () => {
      dispatchOptimistic({ type: "setPrimary", id: image.id });
      const result = await setRoomPrimaryImage(image.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Gambar ditetapkan sebagai utama");
        // Update local state
        setImages((prev) =>
          prev
            .map((img) => ({ ...img, isPrimary: img.id === image.id }))
            .sort((a, b) =>
              a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
            )
        );
      }
    });
  };

  // Handle edit caption
  const handleEditCaption = (image: RoomImage) => {
    const newCaption = window.prompt("Edit Caption", image.caption || "");
    if (newCaption === null) return;

    startTransition(async () => {
      const updatedImage = { ...image, caption: newCaption };
      dispatchOptimistic({ type: "update", data: updatedImage });

      const result = await updateRoomImage(image.id, {
        caption: newCaption,
      });
      if (!result.success) {
        toast.error(result.error);
      } else {
        // Update local state
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, caption: newCaption } : img
          )
        );
      }
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Galeri Ruangan</h4>
          <p className="text-sm text-muted-foreground">
            {optimisticImages.length} foto tersedia
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Foto Ruangan</DialogTitle>
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
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
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
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Klik untuk pilih foto</p>
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
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={clearFileSelection}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center gap-3 p-2.5 bg-muted rounded-lg">
                    <FileImage className="h-6 w-6 text-muted-foreground" />
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
                  placeholder="Contoh: Tampak kamar dari pintu masuk..."
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
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Images className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-sm mb-1">Belum Ada Gambar</h4>
            <p className="text-xs text-muted-foreground text-center max-w-xs mb-3">
              Upload gambar untuk memberikan visualisasi ruangan ini.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Gambar Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-2 gap-3">
          {optimisticImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={image.filePath}
                  alt={image.caption || image.fileName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 200px"
                  unoptimized={image.id.startsWith("temp-")}
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] h-5 gap-0.5 px-1.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Utama
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full shadow-md"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
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
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-white text-xs font-medium truncate">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

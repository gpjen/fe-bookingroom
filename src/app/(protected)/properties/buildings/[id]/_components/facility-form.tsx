"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, UploadCloud } from "lucide-react";
import Image from "next/image";

const formSchema = z.object({
  title: z.string().min(1, "Nama fasilitas wajib diisi"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type FacilityFormData = z.infer<typeof formSchema>;

interface FacilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FacilityFormData) => void;
  initialData?: FacilityFormData;
  mode: "create" | "edit";
}

export function FacilityForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: FacilityFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
        setPreviewUrl(initialData.imageUrl || null);
      } else {
        form.reset({
          title: "",
          description: "",
          imageUrl: "",
        });
        setPreviewUrl(null);
      }
    }
  }, [isOpen, initialData, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      form.setValue("imageUrl", url); // In a real app, this would be the uploaded URL
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    form.setValue("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (data: FacilityFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Fasilitas" : "Edit Fasilitas"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan fasilitas baru untuk gedung ini."
              : "Perbarui informasi fasilitas gedung."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <FormLabel>Foto Fasilitas</FormLabel>
              <div className="flex flex-col gap-3">
                {previewUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center gap-2 aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-3 rounded-full bg-muted">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Fasilitas <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Gym, Kolam Renang" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan detail fasilitas ini..."
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">Simpan Fasilitas</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapInput } from "@/components/maps/map-input";
import { createArea, updateArea } from "../_actions/areas.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ========================================
// TYPES
// ========================================

type Area = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "DEVELOPMENT";
  description: string | null;
  polygon: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// VALIDATION SCHEMA
// ========================================

const areaFormSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(20, { message: "Kode maksimal 20 karakter" })
    .regex(/^[A-Z0-9-]+$/, {
      message: "Kode hanya boleh huruf kapital, angka, dan dash",
    }),
  name: z
    .string()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  location: z
    .string()
    .min(3, { message: "Lokasi minimal 3 karakter" })
    .max(200, { message: "Lokasi maksimal 200 karakter" }),
  status: z.enum(["ACTIVE", "INACTIVE", "DEVELOPMENT"]),
  description: z
    .string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional()
    .nullable(),
  polygon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

type AreaFormInput = z.infer<typeof areaFormSchema>;

// ========================================
// COMPONENT PROPS
// ========================================

interface AreasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: Area | null;
  allAreas?: Area[];
  onSuccess?: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function AreasForm({
  open,
  onOpenChange,
  area,
  allAreas = [],
  onSuccess,
}: AreasFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!area;

  const form = useForm<AreaFormInput>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      code: "",
      name: "",
      location: "",
      status: "ACTIVE",
      description: "",
      polygon: "",
      parentId: "none",
    },
  });

  // Reset form when dialog opens/closes or area changes
  useEffect(() => {
    // Only reset when dialog is OPENING, NOT when closing
    if (!open) {
      return;
    }

    if (area) {
      form.reset({
        code: area.code,
        name: area.name,
        location: area.location,
        status: area.status,
        description: area.description || "",
        polygon: area.polygon || "",
        parentId: area.parentId || "none",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        location: "",
        status: "ACTIVE",
        description: "",
        polygon: "",
        parentId: "none",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, area?.id]);

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: AreaFormInput) => {
    startTransition(async () => {
      try {
        // ✅ Convert "none" to null for parentId
        const submitData = {
          ...values,
          parentId:
            values.parentId === "none" || !values.parentId
              ? null
              : values.parentId,
        };

        let result;

        if (isEditing) {
          result = await updateArea(area.id, submitData);
        } else {
          result = await createArea(submitData);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Area berhasil diperbarui"
            : "Area berhasil ditambahkan";

          toast.success(successMessage);

          // Close dialog
          onOpenChange(false);

          // Reset form
          form.reset();

          // ✅ Call onSuccess callback to refresh data
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("[AREA_FORM_ERROR]", error);
        toast.error("Terjadi kesalahan saat menyimpan data");
      }
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full md:max-w-[650px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Area" : "Tambah Area Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi area di bawah ini. Field dengan tanda (*) wajib
            diisi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-0 md:py-4"
          >
            {/* KODE AREA */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kode Area <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: HL-01"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NAMA AREA */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Area <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Mess LQ"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* LOKASI */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Lokasi <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Desa, Kecamatan, Kabupaten"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STATUS */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="DEVELOPMENT">Pengembangan</SelectItem>
                      <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PARENT AREA */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Area (Opsional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "none"}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih parent area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada parent</SelectItem>
                      {allAreas
                        .filter((a) => a.id !== area?.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KOORDINAT & PEMETAAN */}
            <FormField
              control={form.control}
              name="polygon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Koordinat & Pemetaan</FormLabel>
                  <div className="rounded-lg border border-muted-foreground/30 bg-muted/20 p-1">
                    <MapInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      readOnly={isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gunakan tools di pojok kanan atas peta untuk menggambar area
                    (polygon).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESKRIPSI */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi tambahan tentang area..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Area"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

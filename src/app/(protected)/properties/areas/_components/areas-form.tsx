"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, MapPin, Globe, Layers } from "lucide-react";
import { Area } from "@prisma/client";
import { AreaFormInput, areaFormSchema } from "../_actions/areas.schema";

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

  // Reset form ketika modal dibuka/tutup
  useEffect(() => {
    if (!open) {
      form.reset({
        code: "",
        name: "",
        location: "",
        status: "ACTIVE",
        description: "",
        polygon: "",
        parentId: "none",
      });
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
  }, [open, area, form]);

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: AreaFormInput) => {
    startTransition(async () => {
      try {
        // Convert "none" to null for parentId
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

          onOpenChange(false);

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full lg:max-w-2xl xl:max-w-2xl flex flex-col p-0"
        side="right"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-semibold">
                {isEditing ? "Edit Area" : "Tambah Area Baru"}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Lengkapi informasi area di bawah ini. Field dengan tanda (*)
                wajib diisi.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-8">
              {/* INFORMASI DASAR */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Informasi Dasar
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Data identitas dan lokasi area
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* KODE AREA */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Kode Area <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: HL-01, AREA-A"
                            {...field}
                            disabled={isPending || isEditing}
                            className="h-10 font-mono"
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* NAMA AREA */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Nama Area <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Mess LQ, Area Kantor"
                            {...field}
                            disabled={isPending}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* LOKASI */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="space-y-2 md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Lokasi <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Desa, Kecamatan, Kabupaten, Provinsi"
                            {...field}
                            disabled={isPending}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* STATUS */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih status area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value="ACTIVE"
                              className="text-emerald-600"
                            >
                              <span className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            </SelectItem>
                            <SelectItem
                              value="DEVELOPMENT"
                              className="text-amber-600"
                            >
                              <span className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                Pengembangan
                              </span>
                            </SelectItem>
                            <SelectItem
                              value="INACTIVE"
                              className="text-slate-500"
                            >
                              <span className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                Tidak Aktif
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* PARENT AREA */}
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Parent Area (Opsional)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih parent area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Tidak ada parent
                            </SelectItem>
                            {allAreas
                              .filter((a) => a.id !== area?.id)
                              .map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="font-mono text-xs">
                                    {a.code}
                                  </span>{" "}
                                  - {a.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Deskripsi Area
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Informasi tambahan tentang area
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi tambahan tentang area, fasilitas, atau keterangan khusus..."
                          rows={4}
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          className="min-h-[120px] resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* KOORDINAT & PEMETAAN */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Koordinat & Pemetaan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tentukan batas area dengan menggambar polygon di peta
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="polygon"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="border rounded-lg overflow-hidden bg-muted/10">
                        <div className="h-[400px]">
                          <MapInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            readOnly={isPending}
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                          <MapPin className="h-2 w-2 text-primary" />
                        </div>
                        <p>
                          Gunakan tools di pojok kanan atas peta untuk
                          menggambar area (polygon). Klik untuk menambahkan
                          titik, klik dua kali untuk menyelesaikan polygon.
                        </p>
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="sticky bottom-0 bg-background border-t p-6 shrink-0">
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  size="lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="min-w-[140px]"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Simpan Perubahan" : "Tambah Area"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

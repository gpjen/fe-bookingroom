/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useTransition, useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  createBuildingType,
  updateBuildingType,
} from "../_actions/building-types.actions";
import { toast } from "sonner";
import { Loader2, X, Building, Layers, ListPlus } from "lucide-react";
import { BuildingType } from "@prisma/client";
import {
  buildingTypeFormSchema,
  BuildingTypeInput,
} from "../_actions/building-types.schema";

// ========================================
// COMPONENT PROPS
// ========================================

interface BuildingTypesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingType?: BuildingType | null;
  onSuccess?: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function BuildingTypesForm({
  open,
  onOpenChange,
  buildingType,
  onSuccess,
}: BuildingTypesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [facilityInput, setFacilityInput] = useState("");
  const isEditing = !!buildingType;

  const form = useForm<BuildingTypeInput>({
    resolver: zodResolver(buildingTypeFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      defaultMaxFloors: 5,
      defaultFacilities: [],
      icon: "",
      status: true,
    },
  });

  // Reset form when sheet opens/closes or buildingType changes
  useEffect(() => {
    if (!open) {
      form.reset({
        code: "",
        name: "",
        description: "",
        defaultMaxFloors: 5,
        defaultFacilities: [],
        icon: "",
        status: true,
      });
      setFacilityInput("");
      return;
    }

    if (buildingType) {
      form.reset({
        code: buildingType.code,
        name: buildingType.name,
        description: buildingType.description || "",
        defaultMaxFloors: buildingType.defaultMaxFloors,
        defaultFacilities: buildingType.defaultFacilities || [],
        icon: buildingType.icon || "",
        status: buildingType.status,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        defaultMaxFloors: 5,
        defaultFacilities: [],
        icon: "",
        status: true,
      });
    }
    setFacilityInput("");
  }, [open, buildingType, form]);

  // ========================================
  // FACILITIES MANAGEMENT
  // ========================================

  const addFacility = () => {
    const trimmed = facilityInput.trim();
    if (!trimmed) return;

    const currentFacilities = form.getValues("defaultFacilities") || [];
    if (currentFacilities.includes(trimmed)) {
      toast.error("Fasilitas sudah ditambahkan");
      return;
    }

    form.setValue("defaultFacilities", [...currentFacilities, trimmed], {
      shouldValidate: true,
    });
    setFacilityInput("");
  };

  const removeFacility = (index: number) => {
    const currentFacilities = form.getValues("defaultFacilities") || [];
    form.setValue(
      "defaultFacilities",
      currentFacilities.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: BuildingTypeInput) => {
    startTransition(async () => {
      try {
        const submitData = {
          ...values,
          description: values.description || undefined,
          icon: values.icon || undefined,
        };

        let result;

        if (isEditing) {
          result = await updateBuildingType(buildingType.id, submitData);
        } else {
          result = await createBuildingType(submitData);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Tipe bangunan berhasil diperbarui"
            : "Tipe bangunan berhasil ditambahkan";

          toast.success(successMessage);

          onOpenChange(false);

          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("[BUILDING_TYPE_FORM_ERROR]", error);
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
        className="w-full lg:max-w-lg xl:max-w-xl flex flex-col p-0"
        side="right"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-semibold">
                {isEditing ? "Edit Tipe Bangunan" : "Tambah Tipe Bangunan"}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Lengkapi informasi tipe bangunan. Field dengan (*) wajib diisi.
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
                  <h3 className="text-base font-semibold text-foreground">
                    Informasi Dasar
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Data identitas tipe bangunan
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* CODE */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Kode <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: MESS, HOTEL"
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

                  {/* DEFAULT MAX FLOORS */}
                  <FormField
                    control={form.control}
                    name="defaultMaxFloors"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Maksimal Lantai{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            {...field}
                            value={field.value || 5}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 5 : value);
                            }}
                            disabled={isPending}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* NAME */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2 md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Nama Tipe Bangunan{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Mess Karyawan, Gedung Perkantoran"
                            {...field}
                            disabled={isPending}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* FASILITAS DEFAULT */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <ListPlus className="h-4 w-4" />
                        Fasilitas Default
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tambahkan fasilitas standar untuk tipe bangunan ini
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(form.watch("defaultFacilities") || []).length} fasilitas
                    </Badge>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="defaultFacilities"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              placeholder="Contoh: WiFi, Laundry, Parkir"
                              value={facilityInput}
                              onChange={(e) => setFacilityInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addFacility();
                                }
                              }}
                              disabled={isPending}
                              className="h-10 pl-9"
                            />
                          </FormControl>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Layers className="h-4 w-4" />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addFacility}
                          disabled={isPending || !facilityInput.trim()}
                          className="h-10 px-4"
                        >
                          Tambah
                        </Button>
                      </div>

                      {(field.value || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20 min-h-[60px]">
                          {(field.value || []).map((facility, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="gap-1 pr-1.5 pl-2.5 py-1.5 text-sm font-medium"
                            >
                              {facility}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-transparent hover:text-destructive"
                                onClick={() => removeFacility(index)}
                                disabled={isPending}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {(field.value || []).length === 0 && (
                        <div className="p-6 text-center border rounded-lg bg-muted/10">
                          <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Belum ada fasilitas. Tambahkan fasilitas standar
                            untuk tipe bangunan ini.
                          </p>
                        </div>
                      )}

                      <FormDescription className="text-xs">
                        Tekan Enter atau klik Tambah untuk menambah fasilitas
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Deskripsi
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Informasi tambahan tentang tipe bangunan
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi tentang karakteristik, fungsi, atau spesifikasi tipe bangunan ini..."
                          rows={4}
                          {...field}
                          disabled={isPending}
                          className="min-h-[120px] resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* STATUS */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Status
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan atau nonaktifkan tipe bangunan
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-card">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Status Aktif
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Tipe bangunan aktif dapat digunakan untuk bangunan
                          baru
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="sticky bottom-0 bg-background border-t p-4 shrink-0">
              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  size="sm"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} size="sm">
                  {isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {isEditing ? "Simpan Perubahan" : "Tambah Tipe"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

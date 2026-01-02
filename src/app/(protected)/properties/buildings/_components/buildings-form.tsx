/* eslint-disable react-hooks/incompatible-library */
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
import { Loader2, Building2, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { createBuilding, updateBuilding } from "../_actions/buildings.actions";
import {
  buildingFormSchema,
  BuildingFormInput,
  BuildingWithRelations,
  AreaOption,
  BuildingTypeOption,
} from "../_actions/buildings.schema";
import { MapPointInput, LatLng } from "@/components/maps/map-point-input";

// ========================================
// COMPONENT PROPS
// ========================================

interface BuildingsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: BuildingWithRelations | null;
  areas: AreaOption[];
  buildingTypes: BuildingTypeOption[];
  onSuccess?: (data: BuildingWithRelations, mode: "create" | "update") => void;
}

// ========================================
// FORM COMPONENT
// ========================================

export function BuildingsForm({
  open,
  onOpenChange,
  building,
  areas,
  buildingTypes,
  onSuccess,
}: BuildingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!building;

  const form = useForm<BuildingFormInput>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      code: "",
      name: "",
      areaId: "",
      buildingTypeId: "",
      status: true,
      address: "",
      latitude: null,
      longitude: null,
    },
    mode: "onChange",
  });

  // Watch latitude/longitude for map display
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");

  // Derive mapLocation from form values (no separate state needed)
  const mapLocation: LatLng | null =
    typeof latitude === "number" && typeof longitude === "number"
      ? { lat: latitude, lng: longitude }
      : null;

  // Reset form when modal opens/closes or building changes
  useEffect(() => {
    if (!open) {
      form.reset({
        code: "",
        name: "",
        areaId: "",
        buildingTypeId: "",
        status: true,
        address: "",
        latitude: null,
        longitude: null,
      });
      return;
    }

    if (building) {
      form.reset({
        code: building.code,
        name: building.name,
        areaId: building.areaId,
        buildingTypeId: building.buildingTypeId || "",
        status: building.status,
        address: building.address || "",
        latitude: building.latitude,
        longitude: building.longitude,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        areaId: "",
        buildingTypeId: "",
        status: true,
        address: "",
        latitude: null,
        longitude: null,
      });
    }
  }, [open, building, form]);

  // Handle map location change - only update form values
  const handleMapLocationChange = (latlng: LatLng | null) => {
    if (latlng) {
      form.setValue("latitude", latlng.lat);
      form.setValue("longitude", latlng.lng);
    } else {
      form.setValue("latitude", null);
      form.setValue("longitude", null);
    }
  };

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: BuildingFormInput) => {
    startTransition(async () => {
      try {
        let result;
        const mode: "create" | "update" = isEditing ? "update" : "create";

        if (isEditing && building) {
          result = await updateBuilding(building.id, values);
        } else {
          result = await createBuilding(values);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Bangunan berhasil diperbarui"
            : "Bangunan berhasil ditambahkan";

          toast.success(successMessage);

          // Build optimistic data for immediate UI update
          const selectedArea = areas.find((a) => a.id === values.areaId);
          const selectedType = buildingTypes.find(
            (t) => t.id === values.buildingTypeId
          );

          const optimisticData: BuildingWithRelations = {
            id: result.data.id,
            code: result.data.code,
            name: result.data.name,
            areaId: values.areaId,
            buildingTypeId: values.buildingTypeId || null,
            status: values.status,
            address: values.address || null,
            latitude: values.latitude || null,
            longitude: values.longitude || null,
            createdAt: building?.createdAt || new Date(),
            updatedAt: new Date(),
            area: {
              id: selectedArea?.id || values.areaId,
              name: selectedArea?.name || "",
            },
            buildingType: selectedType
              ? {
                  id: selectedType.id,
                  name: selectedType.name,
                }
              : null,
            _count: {
              rooms: building?._count.rooms || 0,
            },
          };

          if (onSuccess) {
            onSuccess(optimisticData, mode);
          }

          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("[BUILDING_FORM_ERROR]", error);
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
        className="w-full lg:max-w-2xl flex flex-col p-0"
        side="right"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-semibold">
                {isEditing ? "Edit Bangunan" : "Tambah Bangunan Baru"}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Lengkapi informasi bangunan di bawah ini. Field dengan tanda (*)
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
                    Data identitas bangunan
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* CODE FIELD */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Kode Bangunan{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: BLD-LQ-01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase());
                            }}
                            disabled={isPending || isEditing}
                            className="h-10 font-mono"
                          />
                        </FormControl>
                        {isEditing && (
                          <p className="text-xs text-muted-foreground">
                            Kode bangunan tidak dapat diubah
                          </p>
                        )}
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* NAME FIELD */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Nama Bangunan{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Gedung A (Mess)"
                            {...field}
                            disabled={isPending}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* AREA FIELD */}
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Area / Lokasi{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                <span className="font-mono text-xs">
                                  {area.code}
                                </span>{" "}
                                - {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* BUILDING TYPE FIELD */}
                  <FormField
                    control={form.control}
                    name="buildingTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Tipe Bangunan
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih tipe (opsional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildingTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* STATUS FIELD */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Status <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={field.value.toString()}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">
                              <span className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            </SelectItem>
                            <SelectItem value="false">
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
                </div>
              </div>

              {/* LOKASI & KOORDINAT */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasi & Koordinat
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tentukan lokasi bangunan pada peta
                  </p>
                </div>

                {/* ADDRESS FIELD */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Alamat Lengkap
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jl. Contoh No. 123, Desa, Kecamatan, Kabupaten"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* MAP POINT INPUT */}
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden bg-muted/10">
                    <div className="h-[350px]">
                      <MapPointInput
                        value={mapLocation}
                        onChange={handleMapLocationChange}
                        readOnly={isPending}
                        defaultCenter={{ lat: -2.5, lng: 118 }}
                        defaultZoom={5}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <MapPin className="h-2 w-2 text-primary" />
                    </div>
                    <p>
                      Klik pada peta untuk menentukan lokasi bangunan. Anda juga
                      bisa menggeser marker untuk mengubah posisi.
                    </p>
                  </div>

                  {/* Coordinate Display */}
                  {mapLocation && (
                    <div className="flex gap-4 text-xs bg-muted/50 rounded-md p-2">
                      <span>
                        <strong>Lat:</strong> {mapLocation.lat.toFixed(6)}
                      </span>
                      <span>
                        <strong>Lng:</strong> {mapLocation.lng.toFixed(6)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleMapLocationChange(null)}
                      >
                        Hapus Koordinat
                      </Button>
                    </div>
                  )}
                </div>
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
                  {isEditing ? "Simpan Perubahan" : "Tambah Bangunan"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

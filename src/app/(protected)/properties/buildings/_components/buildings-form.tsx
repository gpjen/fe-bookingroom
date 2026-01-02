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
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createBuilding, updateBuilding } from "../_actions/buildings.actions";
import {
  buildingFormSchema,
  BuildingFormInput,
  BuildingWithRelations,
  AreaOption,
  BuildingTypeOption,
} from "../_actions/buildings.schema";

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
      description: "",
    },
    mode: "onChange",
  });

  // Reset form when modal opens/closes or building changes
  useEffect(() => {
    if (!open) {
      form.reset({
        code: "",
        name: "",
        areaId: "",
        buildingTypeId: "",
        status: true,
        description: "",
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
        description: "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        areaId: "",
        buildingTypeId: "",
        status: true,
        description: "",
      });
    }
  }, [open, building, form]);

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
        className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0"
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
            <div className="p-6 space-y-5">
              {/* CODE FIELD - Full width */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Kode Bangunan <span className="text-destructive">*</span>
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

              {/* NAME FIELD - Full width */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Nama Bangunan <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Gedung A (Mess Karyawan)"
                        {...field}
                        disabled={isPending}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* AREA FIELD - Full width */}
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Area / Lokasi <span className="text-destructive">*</span>
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
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* BUILDING TYPE FIELD - Full width */}
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

              {/* STATUS FIELD - Full width */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
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
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* DESCRIPTION FIELD - Full width */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Deskripsi
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan atau deskripsi bangunan (opsional)"
                        className="resize-none min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
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

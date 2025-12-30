"use client";

import { useEffect, useTransition, useState } from "react";
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
import type { BuildingType } from "../_actions/building-types.actions";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

// ========================================
// VALIDATION SCHEMA
// ========================================

const buildingTypeFormSchema = z.object({
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
  description: z
    .string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional(),
  defaultMaxFloors: z
    .number()
    .int()
    .min(1, { message: "Minimal 1 lantai" })
    .max(100, { message: "Maksimal 100 lantai" }),
  defaultFacilities: z.array(z.string()),
  icon: z.string().optional(),
  status: z.boolean(),
});

type BuildingTypeFormInput = z.infer<typeof buildingTypeFormSchema>;

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

  const form = useForm<BuildingTypeFormInput>({
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

  // Reset form when dialog opens/closes or buildingType changes
  useEffect(() => {
    if (!open) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, buildingType?.id]);

  // ========================================
  // FACILITIES MANAGEMENT
  // ========================================

  const addFacility = () => {
    const trimmed = facilityInput.trim();
    if (!trimmed) return;

    const currentFacilities = form.getValues("defaultFacilities");
    if (currentFacilities.includes(trimmed)) {
      toast.error("Fasilitas sudah ditambahkan");
      return;
    }

    form.setValue("defaultFacilities", [...currentFacilities, trimmed]);
    setFacilityInput("");
  };

  const removeFacility = (index: number) => {
    const currentFacilities = form.getValues("defaultFacilities");
    form.setValue(
      "defaultFacilities",
      currentFacilities.filter((_, i) => i !== index)
    );
  };

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: BuildingTypeFormInput) => {
    startTransition(async () => {
      try {
        const submitData = {
          ...values,
          description: values.description || null,
          icon: values.icon || null,
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
          form.reset();

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full md:max-w-[550px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Tipe Bangunan" : "Tambah Tipe Bangunan"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi tipe bangunan. Field dengan (*) wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 py-4"
          >
            {/* CODE */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kode <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: MESS, HOTEL"
                      {...field}
                      disabled={isPending}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Tipe <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Mess Karyawan"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DEFAULT MAX FLOORS */}
            <FormField
              control={form.control}
              name="defaultMaxFloors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Maksimal Lantai Default{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      {...field}
                      value={field.value || 5}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 5 : value);
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Jumlah maksimal lantai untuk tipe bangunan ini
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DEFAULT FACILITIES */}
            <FormField
              control={form.control}
              name="defaultFacilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasilitas Default</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Contoh: WiFi, Laundry"
                        value={facilityInput}
                        onChange={(e) => setFacilityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addFacility();
                          }
                        }}
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addFacility}
                        disabled={isPending}
                      >
                        Tambah
                      </Button>
                    </div>

                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((facility, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {facility}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 hover:bg-transparent"
                              onClick={() => removeFacility(index)}
                              disabled={isPending}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Tekan Enter atau klik Tambah untuk menambah fasilitas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi tipe bangunan..."
                      rows={3}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Status Aktif</FormLabel>
                    <FormDescription>
                      Tipe bangunan aktif dapat digunakan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
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
                {isEditing ? "Simpan Perubahan" : "Tambah Tipe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

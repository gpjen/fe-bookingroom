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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createRoomType, updateRoomType } from "../_actions/room-types.actions";
import type { RoomType } from "../_actions/room-types.actions";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

// ========================================
// VALIDATION SCHEMA
// ========================================

const roomTypeFormSchema = z.object({
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
  bedsPerRoom: z
    .number()
    .int()
    .min(1, { message: "Minimal 1 bed" })
    .max(10, { message: "Maksimal 10 bed" }),
  defaultBedType: z.string().min(1, { message: "Tipe bed wajib dipilih" }),
  defaultAmenities: z.array(z.string()),
  priceMultiplier: z
    .number()
    .min(0.1, { message: "Minimal 0.1" })
    .max(10, { message: "Maksimal 10" }),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.boolean(),
});

type RoomTypeFormInput = z.infer<typeof roomTypeFormSchema>;

// ========================================
// BED TYPE OPTIONS
// ========================================

const BED_TYPE_OPTIONS = [
  "Single Bed",
  "Double Bed",
  "Queen Bed",
  "King Bed",
  "Bunk Bed",
  "Sofa Bed",
];

// ========================================
// COMPONENT PROPS
// ========================================

interface RoomTypesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomType?: RoomType | null;
  onSuccess?: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function RoomTypesForm({
  open,
  onOpenChange,
  roomType,
  onSuccess,
}: RoomTypesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [amenityInput, setAmenityInput] = useState("");
  const isEditing = !!roomType;

  const form = useForm<RoomTypeFormInput>({
    resolver: zodResolver(roomTypeFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      bedsPerRoom: 1,
      defaultBedType: "",
      defaultAmenities: [],
      priceMultiplier: 1.0,
      icon: "",
      imageUrl: "",
      status: true,
    },
  });

  // Reset form when dialog opens/closes or roomType changes
  useEffect(() => {
    if (!open) {
      return;
    }

    if (roomType) {
      form.reset({
        code: roomType.code,
        name: roomType.name,
        description: roomType.description || "",
        bedsPerRoom: roomType.bedsPerRoom,
        defaultBedType: roomType.defaultBedType,
        defaultAmenities: roomType.defaultAmenities || [],
        priceMultiplier: roomType.priceMultiplier,
        icon: roomType.icon || "",
        imageUrl: roomType.imageUrl || "",
        status: roomType.status,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        bedsPerRoom: 1,
        defaultBedType: "",
        defaultAmenities: [],
        priceMultiplier: 1.0,
        icon: "",
        imageUrl: "",
        status: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roomType?.id]);

  // ========================================
  // AMENITIES MANAGEMENT
  // ========================================

  const addAmenity = () => {
    const trimmed = amenityInput.trim();
    if (!trimmed) return;

    const currentAmenities = form.getValues("defaultAmenities");
    if (currentAmenities.includes(trimmed)) {
      toast.error("Fasilitas sudah ditambahkan");
      return;
    }

    form.setValue("defaultAmenities", [...currentAmenities, trimmed]);
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    const currentAmenities = form.getValues("defaultAmenities");
    form.setValue(
      "defaultAmenities",
      currentAmenities.filter((_, i) => i !== index)
    );
  };

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: RoomTypeFormInput) => {
    startTransition(async () => {
      try {
        const submitData = {
          ...values,
          description: values.description || null,
          icon: values.icon || null,
          imageUrl: values.imageUrl || null,
        };

        let result;

        if (isEditing) {
          result = await updateRoomType(roomType.id, submitData);
        } else {
          result = await createRoomType(submitData);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Tipe ruangan berhasil diperbarui"
            : "Tipe ruangan berhasil ditambahkan";

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
        console.error("[ROOM_TYPE_FORM_ERROR]", error);
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
        className="w-full md:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Tipe Ruangan" : "Tambah Tipe Ruangan"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi tipe ruangan dan konfigurasi bed. Field dengan
            (*) wajib diisi.
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
                      placeholder="Contoh: STD, DLX, SUT"
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
                      placeholder="Contoh: Standard Room"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEDS PER ROOM */}
              <FormField
                control={form.control}
                name="bedsPerRoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Jumlah Bed <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        value={field.value || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 1 : value);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DEFAULT BED TYPE */}
              <FormField
                control={form.control}
                name="defaultBedType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipe Bed <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe bed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BED_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PRICE MULTIPLIER */}
            <FormField
              control={form.control}
              name="priceMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Price Multiplier <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      {...field}
                      value={field.value || 1.0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 1.0 : value);
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Pengali harga untuk tipe ruangan ini (1.0 = normal, 1.5 =
                    50% lebih mahal)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DEFAULT AMENITIES */}
            <FormField
              control={form.control}
              name="defaultAmenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasilitas Kamar</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Contoh: AC, TV, WiFi"
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAmenity();
                          }
                        }}
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addAmenity}
                        disabled={isPending}
                      >
                        Tambah
                      </Button>
                    </div>

                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((amenity, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {amenity}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 hover:bg-transparent"
                              onClick={() => removeAmenity(index)}
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
                      placeholder="Deskripsi tipe ruangan..."
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
                      Tipe ruangan aktif dapat digunakan
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

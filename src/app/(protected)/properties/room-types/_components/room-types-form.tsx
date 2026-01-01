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
import {
  roomTypeFormSchema,
  RoomTypeFormInput,
} from "../_actions/room-types.schema";
import { toast } from "sonner";
import { Loader2, X, DoorOpen } from "lucide-react";

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
      // Reset form on close
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
  }, [open, roomType, form]);

  // ========================================
  // AMENITIES MANAGEMENT
  // ========================================

  const addAmenity = () => {
    const trimmed = amenityInput.trim();
    if (!trimmed) return;

    const currentAmenities = form.getValues("defaultAmenities") || [];
    if (currentAmenities.includes(trimmed)) {
      toast.error("Fasilitas sudah ditambahkan");
      return;
    }

    form.setValue("defaultAmenities", [...currentAmenities, trimmed]);
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    const currentAmenities = form.getValues("defaultAmenities") || [];
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

        if (isEditing && roomType) {
          result = await updateRoomType(roomType.id, submitData);
        } else {
          result = await createRoomType(submitData);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Tipe ruangan berhasil diperbarui"
            : "Tipe ruangan berhasil ditambahkan";

          toast.success(successMessage);

          if (onSuccess) {
            onSuccess();
          }

          onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md md:max-w-xl flex flex-col p-0"
        side="right"
        aria-describedby="room-type-form-desc"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-semibold">
                {isEditing ? "Edit Tipe Ruangan" : "Tambah Tipe Ruangan"}
              </SheetTitle>
              <SheetDescription id="room-type-form-desc" className="text-sm">
                Lengkapi informasi tipe ruangan dan konfigurasi bed. Field
                dengan tanda (*) wajib diisi.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
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
                        disabled={isPending || isEditing}
                        className="uppercase h-10 font-mono"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Kode tipe ruangan tidak dapat diubah
                      </p>
                    )}
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
                        className="h-10"
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
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                          disabled={isPending}
                          className="h-10"
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
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
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
                      Price Multiplier{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 1.0 : value);
                        }}
                        disabled={isPending}
                        className="h-10"
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
                          className="h-10"
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

                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20">
                          {field.value.map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="gap-1 pr-1 pl-2 h-7"
                            >
                              {amenity}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 hover:bg-transparent hover:text-destructive"
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
                        value={field.value || ""}
                        disabled={isPending}
                        className="resize-none"
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormDescription>
                        Tipe ruangan aktif dapat digunakan untuk kamar
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

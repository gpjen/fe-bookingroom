/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Schema Validation
const formSchema = z.object({
  code: z.string().min(1, "Kode kamar wajib diisi"),
  floorId: z.string().min(1, "Lantai wajib dipilih"),
  roomTypeId: z.string().min(1, "Tipe kamar wajib dipilih"),
  capacity: z.number().min(1, "Kapasitas minimal 1"),
  price: z.number().min(0, "Harga tidak boleh negatif").optional(),
  status: z.enum(["active", "inactive", "maintenance"]),
  isMixGender: z.boolean(),
  isBookable: z.boolean(),
  description: z.string().optional(),
  bedCodes: z.array(z.string().min(1, "Kode bed wajib diisi")),
});

export type RoomFormData = z.infer<typeof formSchema>;

// Mock Data for Room Types
const MOCK_ROOM_TYPES = [
  {
    id: "rt-1",
    name: "Standard (2 Bed)",
    price: 0,
    metadata: { maxOccupancy: 2 },
  },
  {
    id: "rt-2",
    name: "VIP (1 Bed)",
    price: 500000,
    metadata: { maxOccupancy: 1 },
  },
  {
    id: "rt-3",
    name: "VVIP (Suite)",
    price: 1000000,
    metadata: { maxOccupancy: 1 },
  },
  {
    id: "rt-4",
    name: "Dormitory (4 Bed)",
    price: 0,
    metadata: { maxOccupancy: 4 },
  },
  {
    id: "rt-5",
    name: "Dormitory (8 Bed)",
    price: 0,
    metadata: { maxOccupancy: 8 },
  },
];

interface FormRoomProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  floors: { id: string; name: string }[];
  initialFloorId?: string;
}

export function FormRoom({
  isOpen,
  onClose,
  onSubmit,
  floors,
  initialFloorId,
}: FormRoomProps) {
  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      floorId: initialFloorId || "",
      roomTypeId: "",
      capacity: 1,
      price: 0,
      status: "active",
      isMixGender: false,
      isBookable: true,
      description: "",
      bedCodes: [""],
    },
  });

  // Reset form when dialog opens or initialFloorId changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        code: "",
        floorId: initialFloorId || "",
        roomTypeId: "",
        capacity: 1,
        price: 0,
        status: "active",
        isMixGender: false,
        isBookable: true,
        description: "",
        bedCodes: [""],
      });
    }
  }, [isOpen, initialFloorId, form]);

  // Auto-fill capacity and price when Room Type changes
  const handleRoomTypeChange = (value: string) => {
    const selectedType = MOCK_ROOM_TYPES.find((t) => t.id === value);
    if (selectedType) {
      form.setValue("roomTypeId", value);
      form.setValue("capacity", selectedType.metadata.maxOccupancy);
      form.setValue("price", selectedType.price);

      // Reset bed codes based on new capacity
      const newBedCodes = Array(selectedType.metadata.maxOccupancy).fill("");
      form.setValue("bedCodes", newBedCodes);
    }
  };

  const handleSubmit = (data: RoomFormData) => {
    onSubmit(data);
    onClose();
  };

  const bedCodes = form.watch("bedCodes");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Kamar Baru</DialogTitle>
          <DialogDescription>
            Isi formulir berikut untuk menambahkan kamar baru ke dalam sistem.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 pt-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Kamar</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: R-01112" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lantai</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih lantai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {floors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Operasional</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Kamar</FormLabel>
                    <Select
                      onValueChange={handleRoomTypeChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_ROOM_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dynamic Bed Codes */}
            {bedCodes.length > 0 && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                <h3 className="text-sm font-medium">Konfigurasi Bed</h3>
                <div className="grid grid-cols-2 gap-4">
                  {bedCodes.map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`bedCodes.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Kode Bed {index + 1}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Contoh: B-${index + 1}`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga / Rate (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => {
                        const val = e.target.valueAsNumber;
                        field.onChange(isNaN(val) ? 0 : val);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Kosongkan atau isi 0 jika tidak ada biaya (gratis).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <FormField
                control={form.control}
                name="isMixGender"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mix Gender</FormLabel>
                      <FormDescription>
                        Izinkan penghuni campur pria & wanita
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isBookable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available Booking</FormLabel>
                      <FormDescription>
                        Dapat dipesan secara online
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan khusus untuk kamar ini"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">Simpan Kamar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

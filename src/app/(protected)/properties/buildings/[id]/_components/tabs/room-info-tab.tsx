/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Form Schema
const formSchema = z.object({
  code: z.string().min(1, "Kode kamar wajib diisi"),
  roomTypeId: z.string().min(1, "Tipe kamar wajib dipilih"),
  capacity: z.number().min(1, "Kapasitas minimal 1"),
  price: z.number().min(0, "Harga tidak boleh negatif").optional(),
  status: z.enum(["active", "inactive", "maintenance"]),
  isMixGender: z.boolean(),
  isBookable: z.boolean(),
  description: z.string().optional(),
  bedCodes: z.array(z.string().min(1, "Kode bed wajib diisi")),
});

type RoomFormData = z.infer<typeof formSchema>;

// Mock Data for Room Types (Duplicated from FormRoom for now)
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

interface RoomInfoTabProps {
  roomId: string;
  isOccupied: boolean;
  initialData: {
    id: string;
    code: string;
    name: string;
    type: string;
    capacity: number;
    status: string;
    price: number;
    isMixGender: boolean;
    isBookable: boolean;
    description: string;
  };
  floors: { id: string; name: string }[];
}

export function RoomInfoTab({
  roomId,
  isOccupied,
  initialData,
  floors,
}: RoomInfoTabProps) {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
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

  useEffect(() => {
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock matching room type based on capacity/name
      const matchedType =
        MOCK_ROOM_TYPES.find(
          (t) => t.metadata.maxOccupancy === initialData.capacity
        ) || MOCK_ROOM_TYPES[0];

      // Mock bed codes based on capacity
      const mockBedCodes = Array.from({ length: initialData.capacity }).map(
        (_, i) => `B-${i + 1}`
      );

      form.reset({
        code: initialData.code,
        roomTypeId: matchedType.id,
        capacity: initialData.capacity,
        price: initialData.price,
        status:
          initialData.status === "available"
            ? "active"
            : (initialData.status as "active" | "inactive" | "maintenance"),
        isMixGender: initialData.isMixGender,
        isBookable: initialData.isBookable,
        description: initialData.description,
        bedCodes: mockBedCodes,
      });

      setIsLoading(false);
    };

    fetchRoomDetails();
  }, [roomId, initialData, form, floors]);

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

  const handleSaveRoom = (data: RoomFormData) => {
    toast.success("Perubahan Disimpan", {
      description: "Informasi kamar berhasil diperbarui.",
    });
    console.log("Updated Room Data:", data);
  };

  const bedCodes = form.watch("bedCodes");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOccupied && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          {/* <AlertTitle>Mode Baca Saja</AlertTitle> */}
          <AlertDescription>
            Informasi kamar tidak dapat diubah karena sedang terisi oleh
            penghuni.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveRoom)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Kamar</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isOccupied} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isOccupied}
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
                    disabled={isOccupied}
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
                            disabled={isOccupied}
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
                <FormLabel>Harga / Malam</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    disabled={isOccupied}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
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
                      disabled={isOccupied}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mix Gender</FormLabel>
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
                      disabled={isOccupied}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Available Booking</FormLabel>
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
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isOccupied}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isOccupied && (
            <>
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </Button>
              <Button type="button" className="w-full" variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Hapus Kamar
              </Button>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}

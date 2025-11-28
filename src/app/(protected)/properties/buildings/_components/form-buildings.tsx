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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  code: z.string().min(1, "Kode bangunan wajib diisi"),
  name: z.string().min(1, "Nama bangunan wajib diisi"),
  arealId: z.string().min(1, "Areal wajib dipilih"),
  buildingTypeId: z.string().min(1, "Tipe bangunan wajib dipilih"),
  totalFloors: z.number().min(1, "Jumlah lantai minimal 1"),
  status: z.enum(["active", "inactive", "maintenance", "development"]),
  description: z.string().optional(),
});

export type BuildingFormData = z.infer<typeof formSchema>;

export interface Building extends BuildingFormData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  arealName?: string; // For display purposes
  buildingTypeName?: string; // For display purposes
}

interface FormBuildingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BuildingFormData, id?: string) => void;
  initialData?: Building | null;
  areals: { id: string; name: string }[];
  buildingTypes: { id: string; name: string }[];
}

export function FormBuildings({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  areals,
  buildingTypes,
}: FormBuildingsProps) {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      arealId: "",
      buildingTypeId: "",
      totalFloors: 1,
      status: "active",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          code: initialData.code,
          name: initialData.name,
          arealId: initialData.arealId,
          buildingTypeId: initialData.buildingTypeId,
          totalFloors: initialData.totalFloors,
          status: initialData.status,
          description: initialData.description || "",
        });
      } else {
        form.reset({
          code: "",
          name: "",
          arealId: "",
          buildingTypeId: "",
          totalFloors: 1,
          status: "active",
          description: "",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: BuildingFormData) => {
    onSubmit(data, initialData?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Bangunan" : "Tambah Bangunan Baru"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Bangunan</FormLabel>
                    <FormControl className="w-full">
                      <Input placeholder="Contoh: BLD-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        <SelectItem value="maintenance">Perbaikan</SelectItem>
                        <SelectItem value="development">Pengembangan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Bangunan</FormLabel>
                  <FormControl className="w-full">
                    <Input placeholder="Masukkan nama bangunan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="arealId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areal / Lokasi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih areal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areals.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
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
                name="buildingTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Bangunan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="totalFloors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Lantai</FormLabel>
                  <FormControl className="w-full">
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl className="w-full">
                    <Textarea
                      placeholder="Tambahkan catatan atau deskripsi bangunan"
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
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

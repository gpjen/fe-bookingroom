"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const formSchema = z.object({
  nik: z.string().min(1, "NIK wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  role: z.enum([
    "Building Manager",
    "Cleaning Service",
    "Security",
    "Technician",
    "Admin",
  ]),
  phoneNumber: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"]),
});

export type PICFormData = z.infer<typeof formSchema>;

interface PICFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PICFormData) => void;
  initialData?: PICFormData;
  mode: "create" | "edit";
}

export function PICForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: PICFormProps) {
  const form = useForm<PICFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: "",
      name: "",
      role: "Building Manager",
      phoneNumber: "",
      email: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({
          nik: "",
          name: "",
          role: "Building Manager",
          phoneNumber: "",
          email: "",
          status: "Active",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: PICFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah PIC" : "Edit PIC"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan penanggung jawab baru untuk gedung ini."
              : "Perbarui informasi penanggung jawab."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK / ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 2023001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama PIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role / Jabatan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Building Manager">Building Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Cleaning Service">Cleaning Service</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Technician">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Telepon (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="0812..." {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opsional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
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

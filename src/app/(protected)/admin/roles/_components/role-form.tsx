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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PermissionList } from "./permission-list";
import { Permission, Role } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "Nama role wajib diisi"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Minimal pilih satu permission"),
});

export type RoleFormData = z.infer<typeof formSchema>;

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => void;
  initialData?: Role;
  permissions: Permission[];
  mode: "create" | "edit";
}

export function RoleForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  permissions,
  mode,
}: RoleFormProps) {
  const form = useForm<RoleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || "",
          permissions: initialData.permissions,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          permissions: [],
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: RoleFormData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Role Baru" : "Edit Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Buat role baru dan tetapkan permission yang sesuai."
              : "Perbarui detail role dan permission."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden gap-4">
            <div className="grid gap-4 shrink-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Manager, Staff" {...field} />
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
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi singkat tentang role ini..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 border rounded-md">
              <div className="bg-muted/50 p-3 border-b">
                <FormLabel>Permissions</FormLabel>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih hak akses yang akan diberikan kepada role ini.
                </p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PermissionList
                          permissions={permissions}
                          selectedPermissions={field.value}
                          onSelectionChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ScrollArea>
            </div>

            <DialogFooter className="shrink-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">Simpan Role</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

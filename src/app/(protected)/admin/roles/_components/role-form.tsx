/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// TYPES (Inline - no separate types.ts)
// ========================================

type Permission = {
  id: string;
  key: string;
  description: string | null;
  category: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystemRole: boolean;
};

// ========================================
// FORM SCHEMA
// ========================================

const formSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Minimal pilih 1 permission"),
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
  const [permissionSearch, setPermissionSearch] = useState("");

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
      setPermissionSearch("");
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: RoleFormData) => {
    onSubmit(data);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filter permissions by search
  const filteredGrouped = Object.entries(groupedPermissions).reduce(
    (acc, [category, perms]) => {
      const filtered = perms.filter(
        (p) =>
          p.key.toLowerCase().includes(permissionSearch.toLowerCase()) ||
          p.description?.toLowerCase().includes(permissionSearch.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const selectedCount = form.watch("permissions").length;
  const totalPermissions = permissions.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {mode === "create" ? "Tambah Role" : "Edit Role"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {mode === "create"
                  ? "Buat role baru dan atur permissions"
                  : "Ubah role dan permissions"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80">
                  Informasi Role
                </h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Role <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Manager" {...field} />
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
                          placeholder="Deskripsi role (opsional)"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/80">
                    Permissions
                  </h3>
                  <Badge variant="secondary">
                    {selectedCount}/{totalPermissions} dipilih
                  </Badge>
                </div>

                <div className="flex flex-col rounded-lg bg-muted/30 h-[400px]">
                  {/* Search Header */}
                  <div className="p-3 flex-shrink-0 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari permission..."
                        className="pl-9 h-9 bg-background"
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                      />
                    </div>
                    {permissionSearch && (
                      <p className="text-xs text-muted-foreground">
                        Menampilkan hasil pencarian untuk &quot;
                        {permissionSearch}&quot;
                      </p>
                    )}
                  </div>

                  {/* Scrollable Permissions */}
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-3 pb-3 space-y-4">
                      <FormField
                        control={form.control}
                        name="permissions"
                        render={() => (
                          <>
                            {Object.entries(filteredGrouped).map(
                              ([category, perms]) => (
                                <div key={category} className="space-y-2">
                                  <div className="sticky top-0 bg-muted/30 py-2 z-10">
                                    <h4 className="text-sm font-semibold text-primary">
                                      {category}
                                    </h4>
                                  </div>
                                  <div className="space-y-1.5">
                                    {perms.map((perm) => (
                                      <FormField
                                        key={perm.id}
                                        control={form.control}
                                        name="permissions"
                                        render={({ field }) => {
                                          const isChecked =
                                            field.value?.includes(perm.id);
                                          return (
                                            <FormItem
                                              className={cn(
                                                "flex items-start space-x-2 space-y-0 rounded-md p-2.5 transition-all cursor-pointer",
                                                isChecked
                                                  ? "bg-primary/10"
                                                  : "hover:bg-background/80"
                                              )}
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={isChecked}
                                                  onCheckedChange={(
                                                    checked
                                                  ) => {
                                                    return checked
                                                      ? field.onChange([
                                                          ...field.value,
                                                          perm.id,
                                                        ])
                                                      : field.onChange(
                                                          field.value?.filter(
                                                            (value) =>
                                                              value !== perm.id
                                                          )
                                                        );
                                                  }}
                                                  className="mt-0.5"
                                                />
                                              </FormControl>
                                              <div className="flex-1 cursor-pointer">
                                                <FormLabel className="font-mono text-xs font-medium cursor-pointer !mt-0">
                                                  {perm.key}
                                                </FormLabel>
                                                {perm.description && (
                                                  <p className="text-xs text-muted-foreground mt-0.5">
                                                    {perm.description}
                                                  </p>
                                                )}
                                              </div>
                                            </FormItem>
                                          );
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )
                            )}

                            {Object.keys(filteredGrouped).length === 0 && (
                              <div className="text-center py-12">
                                <p className="text-sm text-muted-foreground">
                                  {permissionSearch
                                    ? "Tidak ada permission yang cocok"
                                    : "Tidak ada permission tersedia"}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </ScrollArea>
                </div>
                <FormDescription className="text-xs">
                  Pilih permissions yang akan diberikan ke role ini
                </FormDescription>
                <FormMessage />
              </div>
            </div>

            <DialogFooter className="shrink-0 px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">
                {mode === "create" ? "Tambah Role" : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

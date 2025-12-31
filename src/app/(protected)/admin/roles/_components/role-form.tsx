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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {mode === "create" ? "Tambah Role" : "Edit Role"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Kelola informasi role dan permission.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 p-6"
          >
            {/* 1. INFORMASI ROLE */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2 text-muted-foreground">
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

            {/* 2. PERMISSIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Hak Akses (Permissions){" "}
                  <span className="text-destructive">*</span>
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedCount}/{totalPermissions} dipilih
                </Badge>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Cari permission..."
                  className="pl-9 bg-muted/5 border-muted/20 focus-visible:bg-background transition-colors"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                />
              </div>

              {/* Permission List - Natural Flow, no inner scroll */}
              <div className="border rounded-md divide-y overflow-hidden">
                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <div className="bg-muted/5">
                      {Object.entries(filteredGrouped).length > 0 ? (
                        Object.entries(filteredGrouped).map(
                          ([category, perms]) => (
                            <div key={category}>
                              {/* Category Header */}
                              <div className="px-4 py-2 bg-muted/20 border-b flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-primary tracking-wider">
                                  {category}
                                </span>
                                <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                                  {perms.length} items
                                </span>
                              </div>
                              {/* Permission Items */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/50">
                                {perms.map((perm) => (
                                  <FormField
                                    key={perm.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => {
                                      const isChecked = field.value?.includes(
                                        perm.id
                                      );
                                      return (
                                        <FormItem
                                          className={cn(
                                            "flex items-start space-x-3 space-y-0 p-3 bg-background transition-all hover:bg-muted/30 cursor-pointer",
                                            isChecked && "bg-primary/5"
                                          )}
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  field.onChange([
                                                    ...field.value,
                                                    perm.id,
                                                  ]);
                                                } else {
                                                  field.onChange(
                                                    field.value?.filter(
                                                      (v) => v !== perm.id
                                                    )
                                                  );
                                                }
                                              }}
                                              className="mt-0.5"
                                            />
                                          </FormControl>
                                          <div className="space-y-0.5 flex-1">
                                            <FormLabel className="text-sm font-medium cursor-pointer block text-foreground/90">
                                              {perm.key}
                                            </FormLabel>
                                            {perm.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-2">
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
                        )
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">
                            Tidak ada permission yang cocok dengan pencarian
                            Anda.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
              <FormMessage />
            </div>

            <DialogFooter className="gap-2 pt-2">
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

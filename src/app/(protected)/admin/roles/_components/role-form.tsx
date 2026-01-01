/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// z removed

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// TYPES (Inline - no separate types.ts)
// ========================================

import { roleFormSchema, type RoleFormInput } from "../_actions/roles.schema";

// ========================================
// TYPES
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

// ========================================
// FORM SCHEMA
// ========================================

// Schema imported from roles.schema.ts

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormInput) => void;
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
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const form = useForm<RoleFormInput>({
    resolver: zodResolver(roleFormSchema),
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

      // Initialize expanded categories
      const categories = permissions.reduce((acc, perm) => {
        const category = perm.category || "Other";
        acc[category] = true; // Expand all by default
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedCategories(categories);
    }
  }, [isOpen, initialData, form, permissions]);

  const handleSubmit = (data: RoleFormInput) => {
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

  // Handle category select all
  const handleCategorySelectAll = (category: string, perms: Permission[]) => {
    const currentPermissions = form.getValues("permissions");
    const categoryPermIds = perms.map((p) => p.id);

    const allSelected = categoryPermIds.every((id) =>
      currentPermissions.includes(id)
    );

    if (allSelected) {
      // Deselect all
      form.setValue(
        "permissions",
        currentPermissions.filter((id) => !categoryPermIds.includes(id))
      );
    } else {
      // Select all
      const newPermissions = [...currentPermissions];
      categoryPermIds.forEach((id) => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
      form.setValue("permissions", newPermissions);
    }
  };

  // Check if category is fully selected
  const isCategoryFullySelected = (category: string, perms: Permission[]) => {
    const currentPermissions = form.getValues("permissions");
    const categoryPermIds = perms.map((p) => p.id);
    return categoryPermIds.every((id) => currentPermissions.includes(id));
  };

  // Check if category is partially selected
  const isCategoryPartiallySelected = (
    category: string,
    perms: Permission[]
  ) => {
    const currentPermissions = form.getValues("permissions");
    const categoryPermIds = perms.map((p) => p.id);
    const selectedInCategory = categoryPermIds.filter((id) =>
      currentPermissions.includes(id)
    );
    return (
      selectedInCategory.length > 0 &&
      selectedInCategory.length < categoryPermIds.length
    );
  };

  // Get selected count per category
  const getSelectedCountInCategory = (
    category: string,
    perms: Permission[]
  ) => {
    const currentPermissions = form.getValues("permissions");
    const categoryPermIds = perms.map((p) => p.id);
    return categoryPermIds.filter((id) => currentPermissions.includes(id))
      .length;
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    const allExpanded = Object.values(expandedCategories).every((val) => val);
    const newExpandedState = Object.keys(groupedPermissions).reduce(
      (acc, category) => {
        acc[category] = !allExpanded;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setExpandedCategories(newExpandedState);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-full lg:max-w-2xl xl:max-w-2xl flex flex-col p-0"
        side="right"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl">
                {mode === "create" ? "Tambah Role Baru" : "Edit Role"}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Kelola informasi role dan permission yang akan diberikan.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Main content area - scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* 1. INFORMASI ROLE */}
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Informasi Role
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Isi detail informasi dasar role
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Nama Role{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Manager, Supervisor, Admin"
                              {...field}
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Deskripsi (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Deskripsi tentang fungsi dan tanggung jawab role ini..."
                              className="resize-none min-h-[100px]"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 2. PERMISSIONS */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Hak Akses (Permissions)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Pilih permission yang akan diberikan ke role ini
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllCategories}
                        className="text-xs h-7"
                      >
                        {Object.values(expandedCategories).every((val) => val)
                          ? "Tutup Semua"
                          : "Buka Semua"}
                      </Button>
                      <Badge variant="outline" className="text-xs font-medium">
                        <span className="text-destructive">*</span> Wajib
                        dipilih
                      </Badge>
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="flex items-center justify-between px-3 py-2 border rounded-md bg-muted/10">
                    <span className="text-sm font-medium">
                      Permission Dipilih
                    </span>
                    <Badge variant="secondary" className="font-mono font-bold">
                      {selectedCount}/{totalPermissions}
                    </Badge>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="Cari permission berdasarkan kata kunci atau deskripsi..."
                      className="pl-9 h-10 bg-muted/5 border-muted/20 focus-visible:bg-background"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                    />
                  </div>

                  {/* Permission List */}
                  <div className="border rounded-lg overflow-hidden">
                    <FormField
                      control={form.control}
                      name="permissions"
                      render={() => (
                        <div className="divide-y max-h-[500px] overflow-y-auto">
                          {Object.entries(filteredGrouped).length > 0 ? (
                            Object.entries(filteredGrouped).map(
                              ([category, perms]) => (
                                <div key={category} className="last:border-b-0">
                                  {/* Category Header */}
                                  <div
                                    className="px-4 py-3 bg-muted/10 border-b flex items-center gap-3  top-0 z-10 cursor-pointer hover:bg-muted/20"
                                    onClick={() =>
                                      setExpandedCategories((prev) => ({
                                        ...prev,
                                        [category]: !prev[category],
                                      }))
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCategorySelectAll(
                                          category,
                                          perms
                                        );
                                      }}
                                      className={cn(
                                        "flex items-center justify-center w-5 h-5 rounded border shrink-0",
                                        isCategoryFullySelected(category, perms)
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : isCategoryPartiallySelected(
                                              category,
                                              perms
                                            )
                                          ? "bg-primary/20 border-primary/40"
                                          : "bg-background border-muted-foreground/30"
                                      )}
                                    >
                                      {isCategoryFullySelected(
                                        category,
                                        perms
                                      ) && <Check className="h-3 w-3" />}
                                      {isCategoryPartiallySelected(
                                        category,
                                        perms
                                      ) && (
                                        <div className="h-1 w-2 bg-primary rounded-full" />
                                      )}
                                    </button>

                                    <div className="flex-1 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {expandedCategories[category] ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="text-sm font-semibold text-foreground">
                                          {category}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs py-0 px-1.5"
                                        >
                                          {perms.length}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {getSelectedCountInCategory(
                                          category,
                                          perms
                                        )}
                                        /{perms.length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Permission Items - 2 columns */}
                                  {expandedCategories[category] && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-background">
                                      {perms.map((perm) => (
                                        <FormField
                                          key={perm.id}
                                          control={form.control}
                                          name="permissions"
                                          render={({ field }) => {
                                            const isChecked =
                                              field.value?.includes(perm.id);
                                            return (
                                              <FormItem>
                                                <div
                                                  className={cn(
                                                    "flex items-start gap-3 p-3 border-b border-r hover:bg-muted/30 cursor-pointer group",
                                                    isChecked && "bg-primary/5"
                                                  )}
                                                  onClick={() => {
                                                    if (isChecked) {
                                                      field.onChange(
                                                        field.value?.filter(
                                                          (v) => v !== perm.id
                                                        )
                                                      );
                                                    } else {
                                                      field.onChange([
                                                        ...field.value,
                                                        perm.id,
                                                      ]);
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
                                                    <div
                                                      className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center",
                                                        isChecked
                                                          ? "bg-primary border-primary"
                                                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                                      )}
                                                    >
                                                      {isChecked && (
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <FormLabel className="text-sm font-medium cursor-pointer block truncate">
                                                        {perm.key}
                                                      </FormLabel>
                                                    </div>
                                                    {perm.description && (
                                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {perm.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </FormItem>
                                            );
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            )
                          ) : (
                            <div className="p-8 text-center">
                              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                              <p className="text-sm font-medium text-foreground mb-1">
                                Permission tidak ditemukan
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Coba gunakan kata kunci pencarian yang berbeda
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <FormMessage className="text-xs" />
                </div>
              </div>
            </div>

            <SheetFooter className="sticky bottom-0 bg-background border-t p-4 shrink-0">
              <div className="flex w-full items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {selectedCount}
                  </span>{" "}
                  dari {totalPermissions} permission dipilih
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    size="sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={selectedCount === 0}
                  >
                    {mode === "create" ? "Simpan Role" : "Simpan Perubahan"}
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

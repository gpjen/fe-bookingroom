/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { User, Role, Company, Building } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[A-Z0-9]+$/i, "Username hanya boleh huruf dan angka"),
  displayName: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().optional(),
  email: z.string().email("Email tidak valid"),
  roleIds: z.array(z.string()).min(1, "Minimal pilih satu role"),
  companyIds: z.array(z.string()),
  buildingIds: z.array(z.string()),
  status: z.boolean(),
});

export type UserFormData = z.infer<typeof formSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: User | null;
  roles: Role[];
  companies: Company[];
  buildings: Building[];
  mode: "create" | "edit";
}

export function UserForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  roles,
  companies,
  buildings,
  mode,
}: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      displayName: "",
      nik: "",
      email: "",
      roleIds: [],
      companyIds: [],
      buildingIds: [],
      status: true,
    },
  });

  const [companySearch, setCompanySearch] = useState("");
  const [buildingSearch, setBuildingSearch] = useState("");

  const isEditing = mode === "edit";

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          username: initialData.username,
          displayName: initialData.displayName,
          nik: initialData.nik || "",
          email: initialData.email,
          roleIds: initialData.userRoles.map((ur) => ur.roleId),
          companyIds: initialData.userCompanies.map((uc) => uc.companyId),
          buildingIds: initialData.userBuildings.map((ub) => ub.buildingId),
          status: initialData.status,
        });
      } else {
        form.reset({
          username: "",
          displayName: "",
          nik: "",
          email: "",
          roleIds: [],
          companyIds: [],
          buildingIds: [],
          status: true,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: UserFormData) => {
    onSubmit(data);
    onClose();
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi pengguna di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* 1. INFORMASI UTAMA - Vertical Stack like CompaniesForm */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2 text-muted-foreground">
                Informasi Utama
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Username <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: USER001"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          disabled={isEditing}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIK</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 2024001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Lengkap <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nama@perusahaan.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status using Select like CompaniesForm */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. HAK AKSES (ROLES) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2 text-muted-foreground">
                Hak Akses (Role) <span className="text-destructive">*</span>
              </h3>

              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(role.id);
                          return (
                            <FormItem className="flex items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, role.id]);
                                    } else {
                                      field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.id
                                        )
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <Label className="font-normal text-sm cursor-pointer leading-none pt-0.5">
                                {role.name}
                              </Label>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </div>
                )}
              />
            </div>

            {/* 3. CAKUPAN DATA */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2 text-muted-foreground">
                Cakupan Data
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Companies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Akses Perusahaan</Label>
                    <div className="relative w-40">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="h-3 w-3" />
                      </div>
                      <Input
                        className="h-7 pl-7 text-xs"
                        placeholder="Cari..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-md h-[250px] overflow-y-auto p-2 bg-muted/5">
                    <div className="space-y-1">
                      {filteredCompanies.map((company) => (
                        <FormField
                          key={company.id}
                          control={form.control}
                          name="companyIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 py-1 px-1 hover:bg-muted/50 rounded">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(company.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...field.value,
                                        company.id,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value?.filter(
                                          (v) => v !== company.id
                                        )
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                {company.name}
                              </Label>
                            </FormItem>
                          )}
                        />
                      ))}
                      {filteredCompanies.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          Tidak ada data
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buildings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Akses Gedung</Label>
                    <div className="relative w-40">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="h-3 w-3" />
                      </div>
                      <Input
                        className="h-7 pl-7 text-xs"
                        placeholder="Cari..."
                        value={buildingSearch}
                        onChange={(e) => setBuildingSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-md h-[250px] overflow-y-auto p-2 bg-muted/5">
                    <div className="space-y-1">
                      {filteredBuildings.map((building) => (
                        <FormField
                          key={building.id}
                          control={form.control}
                          name="buildingIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 py-1 px-1 hover:bg-muted/50 rounded">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(building.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...field.value,
                                        building.id,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value?.filter(
                                          (v) => v !== building.id
                                        )
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                {building.name}
                              </Label>
                            </FormItem>
                          )}
                        />
                      ))}
                      {filteredBuildings.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          Tidak ada data
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">
                {isEditing ? "Simpan Perubahan" : "Simpan User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
import { User } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  email: z.string().email("Email tidak valid"),
  roles: z.array(z.string()).min(1, "Minimal pilih satu role"),
  companyAccess: z.array(z.string()),
  buildingAccess: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
});

export type UserFormData = z.infer<typeof formSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: User;
  roles: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  buildings: { id: string; name: string }[];
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
      name: "",
      nik: "",
      email: "",
      roles: [],
      companyAccess: [],
      buildingAccess: [],
      status: "active",
    },
  });

  const [companySearch, setCompanySearch] = useState("");
  const [buildingSearch, setBuildingSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          nik: initialData.nik,
          email: initialData.email,
          roles: initialData.roles,
          companyAccess: initialData.companyAccess,
          buildingAccess: initialData.buildingAccess,
          status: initialData.status,
        });
      } else {
        form.reset({
          name: "",
          nik: "",
          email: "",
          roles: [],
          companyAccess: [],
          buildingAccess: [],
          status: "active",
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
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Pengguna Baru" : "Edit Pengguna"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Isi formulir berikut untuk menambahkan pengguna baru ke sistem."
              : "Perbarui informasi pengguna dan hak akses."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden gap-4"
          >
            <Tabs
              defaultValue="profile"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profil & Akun</TabsTrigger>
                <TabsTrigger value="access">Hak Akses</TabsTrigger>
              </TabsList>

              <TabsContent
                value="profile"
                className="flex-1 overflow-y-auto p-1 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nama lengkap pengguna"
                            {...field}
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
                          <Input
                            placeholder="Nomor Induk Karyawan"
                            {...field}
                          />
                        </FormControl>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@perusahaan.com"
                          {...field}
                        />
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
                      <FormLabel>Status Akun</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Non-aktif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Pengguna non-aktif tidak dapat login ke sistem.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="access"
                className="flex-1 overflow-hidden flex flex-col gap-4"
              >
                {/* Roles */}
                <div className="space-y-2">
                  <FormLabel>Roles</FormLabel>
                  <div className="border rounded-md p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="roles"
                        render={() => (
                          <>
                            {roles.map((role) => (
                              <FormField
                                key={role.id}
                                control={form.control}
                                name="roles"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={role.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            role.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  role.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== role.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {role.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </>
                        )}
                      />
                    </div>
                    <FormMessage className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                  {/* Company Access */}
                  <div className="flex flex-col border rounded-md overflow-hidden">
                    <div className="p-3 bg-muted/50 border-b">
                      <FormLabel>Akses Perusahaan</FormLabel>
                      <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Cari perusahaan..."
                          className="h-8 pl-8 text-xs"
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="companyAccess"
                          render={() => (
                            <>
                              {filteredCompanies.map((company) => (
                                <FormField
                                  key={company.id}
                                  control={form.control}
                                  name="companyAccess"
                                  render={({ field }) => (
                                    <FormItem
                                      key={company.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            company.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  company.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== company.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <Label className="font-normal cursor-pointer text-sm">
                                        {company.name}
                                      </Label>
                                    </FormItem>
                                  )}
                                />
                              ))}
                              {filteredCompanies.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  Tidak ditemukan.
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Building Access */}
                  <div className="flex flex-col border rounded-md overflow-hidden">
                    <div className="p-3 bg-muted/50 border-b">
                      <FormLabel>Akses Gedung</FormLabel>
                      <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Cari gedung..."
                          className="h-8 pl-8 text-xs"
                          value={buildingSearch}
                          onChange={(e) => setBuildingSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="buildingAccess"
                          render={() => (
                            <>
                              {filteredBuildings.map((building) => (
                                <FormField
                                  key={building.id}
                                  control={form.control}
                                  name="buildingAccess"
                                  render={({ field }) => (
                                    <FormItem
                                      key={building.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            building.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  building.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== building.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <Label className="font-normal cursor-pointer text-sm">
                                        {building.name}
                                      </Label>
                                    </FormItem>
                                  )}
                                />
                              ))}
                              {filteredBuildings.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  Tidak ditemukan.
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="shrink-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">Simpan Pengguna</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

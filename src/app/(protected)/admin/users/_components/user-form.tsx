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
import { User } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  UserCircle,
  Shield,
  Building2,
  Mail,
  IdCard,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState("profile");

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
      setActiveTab("profile");
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

  const selectedRolesCount = form.watch("roles").length;
  const selectedCompaniesCount = form.watch("companyAccess").length;
  const selectedBuildingsCount = form.watch("buildingAccess").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {mode === "create" ? "Tambah Pengguna Baru" : "Edit Pengguna"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {mode === "create"
                  ? "Isi formulir berikut untuk menambahkan pengguna baru"
                  : "Perbarui informasi pengguna dan hak akses"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-6 pt-3 pb-2 border-b bg-background">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                  <TabsTrigger value="profile" className="gap-2 text-xs">
                    <UserCircle className="h-3.5 w-3.5" />
                    Profil & Akun
                  </TabsTrigger>
                  <TabsTrigger value="access" className="gap-2 text-xs">
                    <Shield className="h-3.5 w-3.5" />
                    Hak Akses
                    {(selectedRolesCount > 0 ||
                      selectedCompaniesCount > 0 ||
                      selectedBuildingsCount > 0) && (
                      <Badge
                        variant="secondary"
                        className="h-4 text-[10px] px-1 ml-1"
                      >
                        {selectedRolesCount +
                          selectedCompaniesCount +
                          selectedBuildingsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="profile"
                className="flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-0"
              >
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Informasi Dasar</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            NIK
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: EMP001"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Nama Lengkap
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nama lengkap pengguna"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="email@perusahaan.com"
                              className="h-9 pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Status Akun</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Aktif</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                <span>Non-aktif</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Pengguna non-aktif tidak dapat login ke sistem
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent
                value="access"
                className="flex-1 overflow-hidden flex flex-col gap-4 px-6 py-4 mt-0"
              >
                {/* Roles Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Roles</h3>
                    </div>
                    {selectedRolesCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedRolesCount} dipilih
                      </Badge>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/30">
                    <FormField
                      control={form.control}
                      name="roles"
                      render={() => (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {roles.map((role) => (
                            <FormField
                              key={role.id}
                              control={form.control}
                              name="roles"
                              render={({ field }) => {
                                const isChecked = field.value?.includes(
                                  role.id
                                );
                                return (
                                  <FormItem
                                    key={role.id}
                                    className={cn(
                                      "flex items-center space-x-2 space-y-0 rounded-md border p-3 transition-colors",
                                      isChecked
                                        ? "bg-primary/5 border-primary"
                                        : "hover:bg-muted/50"
                                    )}
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
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
                                    <FormLabel className="font-normal cursor-pointer text-sm !mt-0">
                                      {role.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      )}
                    />
                    <FormMessage className="text-xs mt-2" />
                  </div>
                </div>

                {/* Access Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                  {/* Company Access */}
                  <div className="flex flex-col border rounded-lg overflow-hidden bg-card">
                    <div className="p-3 bg-muted/50 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-xs font-semibold !m-0">
                            Akses Perusahaan
                          </FormLabel>
                        </div>
                        {selectedCompaniesCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-[10px] px-1.5"
                          >
                            {selectedCompaniesCount}
                          </Badge>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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
                                  render={({ field }) => {
                                    const isChecked = field.value?.includes(
                                      company.id
                                    );
                                    return (
                                      <FormItem
                                        key={company.id}
                                        className={cn(
                                          "flex items-center space-x-2 space-y-0 rounded-md border p-2 transition-colors",
                                          isChecked
                                            ? "bg-primary/5 border-primary"
                                            : "hover:bg-muted/50"
                                        )}
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={isChecked}
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
                                        <Label className="font-normal cursor-pointer text-xs flex-1 !mt-0">
                                          {company.name}
                                        </Label>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                              {filteredCompanies.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                  Tidak ada perusahaan ditemukan
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Building Access */}
                  <div className="flex flex-col border rounded-lg overflow-hidden bg-card">
                    <div className="p-3 bg-muted/50 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-xs font-semibold !m-0">
                            Akses Gedung
                          </FormLabel>
                        </div>
                        {selectedBuildingsCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-[10px] px-1.5"
                          >
                            {selectedBuildingsCount}
                          </Badge>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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
                                  render={({ field }) => {
                                    const isChecked = field.value?.includes(
                                      building.id
                                    );
                                    return (
                                      <FormItem
                                        key={building.id}
                                        className={cn(
                                          "flex items-center space-x-2 space-y-0 rounded-md border p-2 transition-colors",
                                          isChecked
                                            ? "bg-primary/5 border-primary"
                                            : "hover:bg-muted/50"
                                        )}
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={isChecked}
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
                                        <Label className="font-normal cursor-pointer text-xs flex-1 !mt-0">
                                          {building.name}
                                        </Label>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                              {filteredBuildings.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                  Tidak ada gedung ditemukan
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

            <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit">
                {mode === "create" ? "Tambah Pengguna" : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createCompany, updateCompany } from "../_actions/companies.actions";
import {
  companyFormSchema,
  CompanyFormInput,
} from "../_actions/companies.schema";

// ========================================
// COMPONENT PROPS
// ========================================

interface CompaniesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: {
    id: string;
    code: string;
    name: string;
    status: boolean;
  } | null;
  onSuccess?: () => void;
}

// ========================================
// FORM COMPONENT
// ========================================

export function CompaniesForm({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompaniesFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!company;

  const form = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      status: true,
    },
    mode: "onChange",
  });

  // Reset form ketika modal dibuka/tutup atau company berubah
  useEffect(() => {
    if (!open) {
      // Reset form saat modal ditutup
      form.reset({
        code: "",
        name: "",
        status: true,
      });
      return;
    }

    // Saat modal dibuka, set nilai form
    if (company) {
      form.reset({
        code: company.code,
        name: company.name,
        status: company.status,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        status: true,
      });
    }
  }, [open, company, form]); // ✅ Semua dependencies termasuk

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: CompanyFormInput) => {
    startTransition(async () => {
      try {
        let result;

        if (isEditing && company) {
          result = await updateCompany(company.id, values);
        } else {
          result = await createCompany(values);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Perusahaan berhasil diperbarui"
            : "Perusahaan berhasil ditambahkan";

          toast.success(successMessage);

          if (onSuccess) {
            onSuccess();
          }

          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("[COMPANY_FORM_ERROR]", error);
        toast.error("Terjadi kesalahan saat menyimpan data");
      }
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0"
        side="right"
        aria-describedby="company-form-desc"
      >
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-semibold">
                {isEditing ? "Edit Perusahaan" : "Tambah Perusahaan Baru"}
              </SheetTitle>
              <SheetDescription id="company-form-desc" className="text-sm">
                Lengkapi informasi perusahaan di bawah ini. Field dengan tanda
                (*) wajib diisi.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* CODE FIELD */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Kode <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: DCM"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                        disabled={isPending || isEditing}
                        className="h-10 font-mono"
                      />
                    </FormControl>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Kode perusahaan tidak dapat diubah
                      </p>
                    )}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* NAME FIELD */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Nama Perusahaan{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: PT. Dharma Cipta Mulia"
                        {...field}
                        disabled={isPending}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* STATUS FIELD */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={field.value.toString()}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Pilih status perusahaan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="sticky bottom-0 bg-background border-t p-4 shrink-0">
              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  size="sm"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} size="sm">
                  {isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {isEditing ? "Simpan Perubahan" : "Tambah Perusahaan"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

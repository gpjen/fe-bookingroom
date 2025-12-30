"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCompany,
  updateCompany,
  type CompanyInput,
} from "../_actions/companies.actions";

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
  onSuccess?: () => void; // ✅ Callback after successful CRUD
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

  const form = useForm<CompanyInput>({
    resolver: zodResolver(
      z.object({
        code: z
          .string()
          .min(2, { message: "Kode minimal 2 karakter" })
          .max(10, { message: "Kode maksimal 10 karakter" })
          .regex(/^[A-Z0-9-]+$/, {
            message: "Kode hanya boleh huruf kapital, angka, dan dash",
          }),
        name: z
          .string()
          .min(3, { message: "Nama minimal 3 karakter" })
          .max(100, { message: "Nama maksimal 100 karakter" }),
        status: z.boolean(),
      })
    ),
    defaultValues: {
      code: "",
      name: "",
      status: true,
    },
    mode: "onChange",
  });

  // Reset form when dialog opens/closes or company changes
  useEffect(() => {
    // Only reset when dialog is OPENING, NOT when closing
    if (!open) {
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?.id]); // ✅ Only watch company.id, not the entire object

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const onSubmit = async (values: CompanyInput) => {
    startTransition(async () => {
      try {
        let result;

        if (isEditing) {
          result = await updateCompany(company.id, values);
        } else {
          result = await createCompany(values);
        }

        if (result.success) {
          const successMessage = isEditing
            ? "Perusahaan berhasil diperbarui"
            : "Perusahaan berhasil ditambahkan";

          toast.success(successMessage);

          // Close dialog
          onOpenChange(false);

          // Reset form
          form.reset();

          // ✅ Call onSuccess callback to refresh data
          if (onSuccess) {
            onSuccess();
          }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Perusahaan" : "Tambah Perusahaan Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi perusahaan di bawah ini. Field dengan tanda (*)
            wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* CODE FIELD */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kode <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: DCM"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NAME FIELD */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Perusahaan <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: PT. Dharma Cipta Mulia"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STATUS FIELD */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    value={field.value.toString()}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status perusahaan" />
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

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Perusahaan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

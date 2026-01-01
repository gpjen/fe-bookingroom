"use client";

import { useState, useTransition, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { CompaniesForm } from "./companies-form";
import { deleteCompany } from "../_actions/companies.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Company } from "@prisma/client";

// ========================================
// STATUS BADGE COMPONENT
// ========================================

const StatusBadge = ({ status }: { status: boolean }) => {
  return (
    <Badge
      className={
        status
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
      }
      variant="outline"
    >
      {status ? "Aktif" : "Tidak Aktif"}
    </Badge>
  );
};

// ========================================
// MAIN TABLE COMPONENT
// ========================================

interface CompaniesTableProps {
  initialData: Company[];
  onDataChange?: () => void; // ✅ Callback to refresh data after CRUD
}

export function CompaniesTable({
  initialData,
  onDataChange,
}: CompaniesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    company: Company | null;
  }>({ open: false, company: null });

  // ✅ Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => initialData, [initialData]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleAdd = () => {
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.company) return;

    const companyToDelete = deleteDialog.company;

    startTransition(async () => {
      const result = await deleteCompany(companyToDelete.id);

      if (result.success) {
        toast.success(`Perusahaan "${companyToDelete.name}" berhasil dihapus`);
        setDeleteDialog({ open: false, company: null });

        // ✅ Call onDataChange to refresh data
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const openDeleteDialog = (company: Company) => {
    setDeleteDialog({ open: true, company });
  };

  // ========================================
  // COLUMNS DEFINITION
  // ========================================

  const columns: ColumnDef<Company>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-semibold">NO</div>,
      cell: ({ row, table }) => {
        const paginatedRows = table.getPaginationRowModel().rows;
        const indexInPage = paginatedRows.findIndex((r) => r.id === row.id);
        const { pageIndex, pageSize } = table.getState().pagination;
        const number = pageIndex * pageSize + indexInPage + 1;
        return <div className="text-center">{number}.</div>;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kode" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)));
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Terakhir Update" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(date)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const company = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEdit(company)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => openDeleteDialog(company)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground/90 dark:text-zinc-50">
                <Building2 className="size-6" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Perusahaan
                </h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola data perusahaan
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Perusahaan
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={memoizedData}
            searchKey="name"
            searchPlaceholder="Cari kode atau nama perusahaan..."
            pageSizeOptions={[20, 50, 100, 250]}
            emptyMessage="Belum ada data perusahaan."
            enableGlobalFilter={true}
            globalFilterFn={(row, filterValue) => {
              // ✅ Multi-column case-insensitive search
              const searchValue = filterValue.toLowerCase().trim();
              if (!searchValue) return true;

              const code = (row.code || "").toLowerCase();
              const name = (row.name || "").toLowerCase();

              return code.includes(searchValue) || name.includes(searchValue);
            }}
            renderToolbar={(table) => (
              <Select
                value={
                  (table.getColumn("status")?.getFilterValue() as string) ||
                  "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("status")
                    ?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <CompaniesForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingCompany(null);
          }
        }}
        company={editingCompany}
        onSuccess={() => {
          // ✅ Refresh data after create/update
          if (onDataChange) {
            onDataChange();
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !isPending && setDeleteDialog({ open, company: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus perusahaan{" "}
              <span className="font-semibold">
                {deleteDialog.company?.name}
              </span>
              ? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

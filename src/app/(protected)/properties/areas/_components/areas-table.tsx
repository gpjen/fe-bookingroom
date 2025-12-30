"use client";

import { useState, useTransition } from "react";
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
  MapPinned,
  Loader2,
  MapPin,
  Layers,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { deleteArea } from "../_actions/areas.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AreasForm } from "./areas-form";

// ========================================
// TYPES
// ========================================

type Area = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "DEVELOPMENT";
  description: string | null;
  polygon: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// STATUS BADGE COMPONENT
// ========================================

const StatusBadge = ({ status }: { status: Area["status"] }) => {
  const variants = {
    ACTIVE: {
      className:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
      label: "Aktif",
    },
    INACTIVE: {
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
      label: "Tidak Aktif",
    },
    DEVELOPMENT: {
      className:
        "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
      label: "Pengembangan",
    },
  };

  return (
    <Badge className={variants[status].className} variant="outline">
      {variants[status].label}
    </Badge>
  );
};

// ========================================
// MAIN TABLE COMPONENT
// ========================================

interface AreasTableProps {
  initialData: Area[];
  onDataChange?: () => void;
}

export function AreasTable({ initialData, onDataChange }: AreasTableProps) {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    area: Area | null;
  }>({ open: false, area: null });

  // ========================================
  // HANDLERS
  // ========================================

  const handleAdd = () => {
    setEditingArea(null);
    setIsFormOpen(true);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.area) return;

    const areaToDelete = deleteDialog.area;

    startTransition(async () => {
      const result = await deleteArea(areaToDelete.id);

      if (result.success) {
        toast.success(`Area "${areaToDelete.name}" berhasil dihapus`);
        setDeleteDialog({ open: false, area: null });

        // ✅ Call onDataChange to refresh data
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const openDeleteDialog = (area: Area) => {
    setDeleteDialog({ open: true, area });
  };

  // ========================================
  // COLUMN DEFINITIONS
  // ========================================

  const columns: ColumnDef<Area>[] = [
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
        <DataTableColumnHeader column={column} title="Nama Area" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lokasi" />
      ),
      cell: ({ row }) => (
        <div className="flex items-start gap-2 max-w-[200px]">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm truncate">{row.getValue("location")}</span>
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
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "parentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parent" />
      ),
      cell: ({ row }) => {
        const parentId = row.getValue("parentId");
        const parentArea = initialData.find((a) => a.id === parentId);

        return parentArea ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>{parentArea.code}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Terakhir Update" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(row.getValue("updatedAt"))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const area = row.original;

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
                <DropdownMenuItem onClick={() => handleEdit(area)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => openDeleteDialog(area)}
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
                <MapPinned className="size-6" />
                <h2 className="text-3xl font-bold tracking-tight">Area</h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola data area atau kawasan
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Area
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={initialData}
            searchKey="name"
            searchPlaceholder="Cari kode, nama, atau lokasi area..."
            pageSizeOptions={[20, 50, 100, 250]}
            emptyMessage="Belum ada data area."
            enableGlobalFilter={true}
            globalFilterFn={(row, filterValue) => {
              // ✅ Multi-column case-insensitive search
              const searchValue = filterValue.toLowerCase().trim();
              if (!searchValue) return true;

              const code = (row.code || "").toLowerCase();
              const name = (row.name || "").toLowerCase();
              const location = (row.location || "").toLowerCase();

              return (
                code.includes(searchValue) ||
                name.includes(searchValue) ||
                location.includes(searchValue)
              );
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
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="DEVELOPMENT">Pengembangan</SelectItem>
                  <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <AreasForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingArea(null);
          }
        }}
        area={editingArea}
        allAreas={initialData}
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
          !isPending && setDeleteDialog({ open, area: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus area{" "}
              <span className="font-semibold">{deleteDialog.area?.name}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
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

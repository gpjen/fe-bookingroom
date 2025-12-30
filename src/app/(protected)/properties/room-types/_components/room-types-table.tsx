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
  Loader2,
  DoorOpen,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { deleteRoomType } from "../_actions/room-types.actions";
import type { RoomType } from "../_actions/room-types.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RoomTypesForm } from "./room-types-form";

// ========================================
// TYPES
// ========================================

interface RoomTypesTableProps {
  initialData: RoomType[];
  onDataChange?: () => void;
}

// ========================================
// MAIN TABLE COMPONENT
// ========================================

export function RoomTypesTable({
  initialData,
  onDataChange,
}: RoomTypesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: RoomType | null;
  }>({ open: false, type: null });

  // ========================================
  // HANDLERS
  // ========================================

  const handleAdd = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (type: RoomType) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.type) return;

    const typeToDelete = deleteDialog.type;

    startTransition(async () => {
      const result = await deleteRoomType(typeToDelete.id);

      if (result.success) {
        toast.success(`Tipe "${typeToDelete.name}" berhasil dihapus`);
        setDeleteDialog({ open: false, type: null });

        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const openDeleteDialog = (type: RoomType) => {
    setDeleteDialog({ open: true, type });
  };

  // ========================================
  // COLUMN DEFINITIONS
  // ========================================

  const columns: ColumnDef<RoomType>[] = [
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
        <DataTableColumnHeader column={column} title="Nama Tipe" />
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
      accessorKey: "bedsPerRoom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jumlah Bed" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.getValue("bedsPerRoom")} Bed
        </Badge>
      ),
    },
    {
      accessorKey: "defaultBedType",
      header: "Tipe Bed",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue("defaultBedType")}
        </Badge>
      ),
    },
    {
      accessorKey: "priceMultiplier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Multiplier" />
      ),
      cell: ({ row }) => {
        const multiplier = row.getValue("priceMultiplier") as number;
        return (
          <span className="font-mono text-sm">{multiplier.toFixed(1)}x</span>
        );
      },
    },
    {
      accessorKey: "defaultAmenities",
      header: "Fasilitas",
      cell: ({ row }) => {
        const amenities = row.getValue("defaultAmenities") as string[];
        if (!amenities || amenities.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 2).map((amenity, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{amenities.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as boolean;
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
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Terakhir Update" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(row.getValue("updatedAt"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const type = row.original;

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
                <DropdownMenuItem onClick={() => handleEdit(type)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => openDeleteDialog(type)}
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
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-foreground/90 dark:text-zinc-50">
                <DoorOpen className="size-6" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Tipe Ruangan
                </h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola tipe/kategori ruangan dan konfigurasi bed
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Tipe
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={initialData}
            searchKey="name"
            searchPlaceholder="Cari kode atau nama tipe..."
            pageSizeOptions={[10, 20, 50, 100]}
            emptyMessage="Belum ada data tipe ruangan."
            enableGlobalFilter={true}
            globalFilterFn={(row, filterValue) => {
              const searchValue = filterValue.toLowerCase().trim();
              if (!searchValue) return true;

              const code = (row.code || "").toLowerCase();
              const name = (row.name || "").toLowerCase();

              return code.includes(searchValue) || name.includes(searchValue);
            }}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <RoomTypesForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingType(null);
          }
        }}
        roomType={editingType}
        onSuccess={() => {
          if (onDataChange) {
            onDataChange();
          }
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !isPending && setDeleteDialog({ open, type: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tipe{" "}
              <span className="font-semibold">{deleteDialog.type?.name}</span>?
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

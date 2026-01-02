"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
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
  MapPin,
  Eye,
  Layers,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { BuildingsForm } from "./buildings-form";
import { deleteBuilding } from "../_actions/buildings.actions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  BuildingWithRelations,
  AreaOption,
  BuildingTypeOption,
} from "../_actions/buildings.schema";
import Link from "next/link";

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

interface BuildingsTableProps {
  initialData: BuildingWithRelations[];
  areas: AreaOption[];
  buildingTypes: BuildingTypeOption[];
}

export function BuildingsTable({
  initialData,
  areas,
  buildingTypes,
}: BuildingsTableProps) {
  // ✅ Local state for optimistic updates - no parent callback needed
  const [buildings, setBuildings] =
    useState<BuildingWithRelations[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] =
    useState<BuildingWithRelations | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    building: BuildingWithRelations | null;
  }>({ open: false, building: null });

  // ✅ Memoize columns to prevent re-renders
  const memoizedData = useMemo(() => buildings, [buildings]);

  // ========================================
  // OPTIMISTIC UPDATE HANDLERS
  // ========================================

  // ✅ Handle optimistic create
  const handleOptimisticCreate = useCallback(
    (newBuilding: BuildingWithRelations) => {
      setBuildings((prev) => [newBuilding, ...prev]);
    },
    []
  );

  // ✅ Handle optimistic update
  const handleOptimisticUpdate = useCallback(
    (updatedBuilding: BuildingWithRelations) => {
      setBuildings((prev) =>
        prev.map((b) => (b.id === updatedBuilding.id ? updatedBuilding : b))
      );
    },
    []
  );

  // ✅ Handle optimistic delete
  const handleOptimisticDelete = useCallback((id: string) => {
    setBuildings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ✅ Rollback on error
  const handleRollback = useCallback(
    (previousData: BuildingWithRelations[]) => {
      setBuildings(previousData);
    },
    []
  );

  // ========================================
  // CRUD HANDLERS
  // ========================================

  const handleAdd = () => {
    setEditingBuilding(null);
    setIsFormOpen(true);
  };

  const handleEdit = (building: BuildingWithRelations) => {
    setEditingBuilding(building);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.building) return;

    const buildingToDelete = deleteDialog.building;
    const previousData = [...buildings]; // Save for rollback

    // ✅ Optimistic delete - UI updates instantly
    handleOptimisticDelete(buildingToDelete.id);
    setDeleteDialog({ open: false, building: null });
    toast.success(`Bangunan "${buildingToDelete.name}" berhasil dihapus`);

    // ✅ Sync with server in background
    startTransition(async () => {
      const result = await deleteBuilding(buildingToDelete.id);

      if (!result.success) {
        // Rollback on error
        handleRollback(previousData);
        toast.error(result.error);
      }
    });
  };

  const openDeleteDialog = (building: BuildingWithRelations) => {
    setDeleteDialog({ open: true, building });
  };

  // ✅ Handle form success with optimistic data
  const handleFormSuccess = useCallback(
    (data: BuildingWithRelations, mode: "create" | "update") => {
      if (mode === "create") {
        handleOptimisticCreate(data);
      } else {
        handleOptimisticUpdate(data);
      }
    },
    [handleOptimisticCreate, handleOptimisticUpdate]
  );

  // ========================================
  // COLUMNS DEFINITION
  // ========================================

  const columns: ColumnDef<BuildingWithRelations>[] = useMemo(
    () => [
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
          <DataTableColumnHeader column={column} title="Nama Bangunan" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        ),
      },
      {
        accessorKey: "area.name",
        id: "areaName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Area" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.original.area.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "buildingType.name",
        id: "buildingTypeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipe" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.buildingType?.name || "-"}
          </Badge>
        ),
      },
      {
        accessorKey: "_count.rooms",
        id: "roomCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ruangan" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{row.original._count.rooms} Ruangan</span>
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
          const building = row.original;

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
                  <Link href={`/properties/buildings/${building.id}`}>
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => handleEdit(building)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => openDeleteDialog(building)}
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
    ],
    []
  );

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
                <h2 className="text-3xl font-bold tracking-tight">Buildings</h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola data bangunan dan gedung
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Bangunan
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={memoizedData}
            searchKey="name"
            searchPlaceholder="Cari kode atau nama bangunan..."
            pageSizeOptions={[10, 20, 50, 100]}
            emptyMessage="Belum ada data bangunan."
            enableGlobalFilter={true}
            globalFilterFn={(row, filterValue) => {
              const searchValue = filterValue.toLowerCase().trim();
              if (!searchValue) return true;

              const code = (row.code || "").toLowerCase();
              const name = (row.name || "").toLowerCase();
              const areaName = (row.area?.name || "").toLowerCase();

              return (
                code.includes(searchValue) ||
                name.includes(searchValue) ||
                areaName.includes(searchValue)
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
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <BuildingsForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingBuilding(null);
          }
        }}
        building={editingBuilding}
        areas={areas}
        buildingTypes={buildingTypes}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !isPending && setDeleteDialog({ open, building: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus bangunan{" "}
              <span className="font-semibold">
                {deleteDialog.building?.name}
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

"use client";

import { useState, useMemo } from "react";
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
import { MoreVertical, Edit, Trash2, Users, Shield, Lock } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { type RoleWithPermissions } from "../_actions/roles.actions";

// ========================================
// TYPES
// ========================================

interface RolesTableProps {
  roles: RoleWithPermissions[];
  onEdit: (role: RoleWithPermissions) => void;
  onDelete: (role: RoleWithPermissions) => void;
  onDataChange?: () => void;
}

// ========================================
// MAIN TABLE COMPONENT
// ========================================

//

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  // ✅ Memoize data
  const memoizedRoles = useMemo(() => roles, [roles]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    role: RoleWithPermissions | null;
  }>({ open: false, role: null });

  const handleDeleteClick = (role: RoleWithPermissions) => {
    if (role.isSystemRole) {
      return; // Handled by button disabled state
    }
    setDeleteDialog({ open: true, role });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.role) {
      onDelete(deleteDialog.role);
      setDeleteDialog({ open: false, role: null });
    }
  };

  // ========================================
  // COLUMN DEFINITIONS
  // ========================================

  const columns: ColumnDef<RoleWithPermissions>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.isSystemRole && (
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  System Role
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("description") || "-"}
        </span>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const count = row.original.rolePermissions.length;
        const firstFive = row.original.rolePermissions.slice(0, 3);

        return (
          <div className="flex flex-wrap gap-1">
            {firstFive.map((rp) => (
              <Badge
                key={rp.permission.id}
                variant="secondary"
                className="text-xs"
              >
                {rp.permission.key}
              </Badge>
            ))}
            {count > 3 && (
              <Badge variant="outline" className="text-xs">
                +{count - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "userCount",
      header: "Users",
      cell: ({ row }) => {
        const count = row.original.userRoles.length;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{count}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const role = row.original;

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
                <DropdownMenuItem onClick={() => onEdit(role)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {!role.isSystemRole && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteClick(role)}
                    disabled={role.userRoles.length > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                )}
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
      <DataTable
        columns={columns}
        data={memoizedRoles}
        searchKey="name"
        searchPlaceholder="Cari role..."
        pageSizeOptions={[10, 20, 50]}
        emptyMessage="Belum ada data role."
      />

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open, role: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus role{" "}
              <span className="font-semibold">{deleteDialog.role?.name}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

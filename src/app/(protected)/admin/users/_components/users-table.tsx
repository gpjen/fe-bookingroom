"use client";

import { useState } from "react";
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
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  Key,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { User } from "./types";
import { formatDate } from "@/lib/utils";
import { UserDetailModal } from "./user-detail-modal";
import { UserPermissionModal } from "./user-permission-modal";

// ========================================
// TYPES
// ========================================

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onDataChange?: () => void;
}

// ========================================
// MAIN TABLE COMPONENT
// ========================================

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onDataChange,
}: UsersTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const [permissionModal, setPermissionModal] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.user) {
      onDelete(deleteDialog.user);
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleDetailClick = (user: User) => {
    setDetailModal({ open: true, user });
  };

  const handlePermissionClick = (user: User) => {
    setPermissionModal({ open: true, user });
  };

  // ========================================
  // COLUMN DEFINITIONS
  // ========================================

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Username (NIK)" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.getValue("username")}
        </span>
      ),
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama Lengkap" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.getValue("displayName")}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "userRoles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.original.userRoles;
        if (!roles || roles.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 2).map((ur) => (
              <Badge
                key={ur.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                {ur.role.name}
              </Badge>
            ))}
            {roles.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{roles.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "userCompanies",
      header: "Akses Perusahaan",
      cell: ({ row }) => {
        const companies = row.original.userCompanies;
        if (!companies || companies.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {companies.slice(0, 2).map((uc) => (
              <Badge
                key={uc.id}
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Building2 className="h-3 w-3" />
                {uc.company.code}
              </Badge>
            ))}
            {companies.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{companies.length - 2}
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
        return status ? (
          <Badge
            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 flex items-center gap-1 w-fit"
            variant="outline"
          >
            <CheckCircle2 className="h-3 w-3" />
            Aktif
          </Badge>
        ) : (
          <Badge
            className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 flex items-center gap-1 w-fit"
            variant="outline"
          >
            <XCircle className="h-3 w-3" />
            Non-Aktif
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dibuat" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(row.getValue("createdAt"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleDetailClick(user)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Detail
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handlePermissionClick(user)}>
                  <Key className="mr-2 h-4 w-4" />
                  Set Permission
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteClick(user)}
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
      <DataTable
        columns={columns}
        data={users}
        searchKey="displayName"
        searchPlaceholder="Cari nama, username, atau email..."
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="Belum ada data pengguna."
        enableGlobalFilter={true}
        globalFilterFn={(user, filterValue) => {
          // Search across multiple fields (removed NIK since username IS NIK)
          const searchValue = filterValue.toLowerCase();
          const username = user.username?.toLowerCase() || "";
          const displayName = user.displayName?.toLowerCase() || "";
          const email = user.email?.toLowerCase() || "";

          return (
            username.includes(searchValue) ||
            displayName.includes(searchValue) ||
            email.includes(searchValue)
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteDialog.user?.displayName}&quot;
              </span>
              ?
              <br />
              <br />
              Data akan di-soft delete dan bisa dikembalikan nanti.
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

      {/* User Detail Modal */}
      {detailModal.user && (
        <UserDetailModal
          open={detailModal.open}
          onOpenChange={(open) =>
            !open && setDetailModal({ open: false, user: null })
          }
          user={detailModal.user}
        />
      )}

      {/* User Permission Modal */}
      {permissionModal.user && (
        <UserPermissionModal
          open={permissionModal.open}
          onOpenChange={(open) =>
            !open && setPermissionModal({ open: false, user: null })
          }
          user={permissionModal.user}
          onSuccess={() => onDataChange?.()}
        />
      )}
    </>
  );
}

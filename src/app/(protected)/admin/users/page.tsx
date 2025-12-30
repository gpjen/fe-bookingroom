"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UserForm } from "./_components/user-form";
import { User, Role, Company, Building } from "./_components/types";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
  assignCompanies,
  assignBuildings,
} from "./_actions/users.actions";
import { getMasterDataForUsers } from "./_actions/master-data.actions";
import { UsersTable } from "./_components/users-table";

// ========================================
// LOADING STATE COMPONENT
// ========================================

function LoadingState() {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </Card>
  );
}

// ========================================
// ERROR STATE COMPONENT
// ========================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </Card>
  );
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Prevent double fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch users and master data in parallel
      const [usersResult, masterData] = await Promise.all([
        getUsers(),
        getMasterDataForUsers(),
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
        setRoles(masterData.roles);
        setCompanies(masterData.companies);
        setBuildings(masterData.buildings);
      } else {
        setError(usersResult.error);
      }
    } catch (err) {
      console.error("[FETCH_USERS_ERROR]", err);
      setError("Gagal mengambil data pengguna");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchData();
    }
  }, [fetchData]);

  const handleAdd = () => {
    setFormMode("create");
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setFormMode("edit");
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    username: string;
    displayName: string;
    email: string;
    nik?: string;
    status: boolean;
    roleIds: string[];
    companyIds: string[];
    buildingIds: string[];
  }) => {
    try {
      let result;

      if (formMode === "create") {
        // Create user
        result = await createUser({
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          nik: data.nik || null,
          avatarUrl: null,
          status: data.status,
        });

        if (result.success) {
          const userId = result.data.id;

          // Assign roles
          if (data.roleIds.length > 0) {
            await assignRoles({
              userId,
              roles: data.roleIds.map((roleId) => ({
                roleId,
                companyId: null,
              })),
            });
          }

          // Assign companies
          if (data.companyIds.length > 0) {
            await assignCompanies({
              userId,
              companyIds: data.companyIds,
            });
          }

          // Assign buildings
          if (data.buildingIds.length > 0) {
            await assignBuildings({
              userId,
              buildingIds: data.buildingIds,
            });
          }

          toast.success("Pengguna berhasil dibuat");
        } else {
          toast.error(result.error);
          return;
        }
      } else {
        // Update user
        if (!selectedUser) return;

        result = await updateUser(selectedUser.id, {
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          nik: data.nik || null,
          avatarUrl: null,
          status: data.status,
        });

        if (result.success) {
          const userId = selectedUser.id;

          // Update roles
          await assignRoles({
            userId,
            roles: data.roleIds.map((roleId) => ({ roleId, companyId: null })),
          });

          // Update companies
          await assignCompanies({
            userId,
            companyIds: data.companyIds,
          });

          // Update buildings
          await assignBuildings({
            userId,
            buildingIds: data.buildingIds,
          });

          toast.success("Pengguna berhasil diperbarui");
        } else {
          toast.error(result.error);
          return;
        }
      }

      // Refresh data
      await fetchData();
      setIsFormOpen(false);
    } catch (err) {
      console.error("[FORM_SUBMIT_ERROR]", err);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleDelete = async (user: User) => {
    const result = await deleteUser(user.id);

    if (result.success) {
      toast.success(`Pengguna "${user.displayName}" berhasil dihapus`);
      await fetchData();
    } else {
      toast.error(result.error);
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={fetchData} />;
  }

  // Success state - render table
  return (
    <>
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-foreground/90">
                <Users className="size-6" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Manajemen Pengguna
                </h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola data pengguna, hak akses, dan status akun
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Pengguna
            </Button>
          </div>

          {/* Data Table */}
          <UsersTable
            users={users}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDataChange={fetchData}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedUser ?? undefined}
        roles={roles}
        companies={companies}
        buildings={buildings}
        mode={formMode}
      />
    </>
  );
}

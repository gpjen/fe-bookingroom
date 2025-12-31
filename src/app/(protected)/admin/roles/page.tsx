"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RoleForm, type RoleFormData } from "./_components/role-form";
import {
  createRole,
  updateRole,
  deleteRole,
  getDataForRolesPage,
  type RoleWithPermissions,
} from "./_actions/roles.actions";
import { RolesTable } from "./_components/roles-table";

// ========================================
// TYPES (Inline - consistent with Companies pattern)
// ========================================

type Permission = {
  id: string;
  key: string;
  description: string | null;
  category: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystemRole: boolean;
};

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
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
// HELPER: Convert RoleWithPermissions to Role
// ========================================

function mapToRole(role: RoleWithPermissions): Role {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.rolePermissions.map((rp) => rp.permissionId),
    userCount: role.userRoles.length,
    isSystemRole: role.isSystemRole,
  };
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Prevent double fetch in React Strict Mode
  const hasFetchedRef = useRef(false);
  const isFetching = useRef(false);

  // ✅ Fetch function with deduplication
  const fetchData = useCallback(async () => {
    // Skip if already fetching
    if (isFetching.current) return;
    isFetching.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Single server action request
      const result = await getDataForRolesPage();

      if (result.success && result.data) {
        setRoles(result.data.roles);
        setPermissions(result.data.permissions);
      } else {
        setError(result.error || "Gagal mengambil data");
      }
    } catch (err) {
      console.error("[FETCH_ROLES_ERROR]", err);
      setError("Gagal mengambil data roles");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const handleAdd = () => {
    setFormMode("create");
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: RoleWithPermissions) => {
    setFormMode("edit");
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: RoleFormData) => {
    try {
      let result;

      if (formMode === "create") {
        result = await createRole({
          name: data.name,
          description: data.description,
          permissionIds: data.permissions,
        });

        if (result.success) {
          toast.success("Role berhasil dibuat");
        } else {
          toast.error(result.error);
          return;
        }
      } else {
        if (!selectedRole) return;

        result = await updateRole(selectedRole.id, {
          name: data.name,
          description: data.description,
          permissionIds: data.permissions,
        });

        if (result.success) {
          toast.success("Role berhasil diperbarui");
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

  const handleDelete = async (role: RoleWithPermissions) => {
    const result = await deleteRole(role.id);

    if (result.success) {
      toast.success(`Role "${role.name}" berhasil dihapus`);
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
                <ShieldCheck className="size-6" />
                <h2 className="text-3xl font-bold tracking-tight">
                  Roles & Permissions
                </h2>
              </div>
              <p className="text-muted-foreground mt-1.5">
                Kelola role pengguna dan hak akses sistem
              </p>
            </div>

            <Button onClick={handleAdd} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Buat Role Baru
            </Button>
          </div>

          {/* Data Table */}
          <RolesTable
            roles={roles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDataChange={fetchData}
          />
        </div>
      </Card>

      {/* Form Dialog */}
      <RoleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedRole ? mapToRole(selectedRole) : undefined}
        permissions={permissions}
        mode={formMode}
      />
    </>
  );
}

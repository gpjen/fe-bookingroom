"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Pencil, Trash2, Users, Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { RoleForm, RoleFormData } from "./_components/role-form";
import { Permission, Role } from "./_components/types";

// Mock Permissions Data
const MOCK_PERMISSIONS: Permission[] = [
  // Administration
  { id: "admin:read", name: "admin:read", group: "Administration", guard_name: "web", description: "View admin dashboard" },
  { id: "admin-users:read", name: "admin-users:read", group: "Administration", guard_name: "web", description: "View users list" },
  { id: "admin-users:create", name: "admin-users:create", group: "Administration", guard_name: "web", description: "Create new users" },
  { id: "admin-users:edit", name: "admin-users:edit", group: "Administration", guard_name: "web", description: "Edit existing users" },
  { id: "admin-users:delete", name: "admin-users:delete", group: "Administration", guard_name: "web", description: "Delete users" },
  { id: "admin-roles:read", name: "admin-roles:read", group: "Administration", guard_name: "web", description: "View roles" },
  { id: "admin-roles:create", name: "admin-roles:create", group: "Administration", guard_name: "web", description: "Create new roles" },
  { id: "admin-roles:edit", name: "admin-roles:edit", group: "Administration", guard_name: "web", description: "Edit roles" },
  { id: "admin-roles:delete", name: "admin-roles:delete", group: "Administration", guard_name: "web", description: "Delete roles" },
  
  // Booking
  { id: "booking:read", name: "booking:read", group: "Booking", guard_name: "web", description: "View bookings" },
  { id: "booking:create", name: "booking:create", group: "Booking", guard_name: "web", description: "Create bookings" },
  { id: "booking:approve", name: "booking:approve", group: "Booking", guard_name: "web", description: "Approve bookings" },
  { id: "booking:reject", name: "booking:reject", group: "Booking", guard_name: "web", description: "Reject bookings" },
  
  // Property
  { id: "property:read", name: "property:read", group: "Property", guard_name: "web", description: "View properties" },
  { id: "property:create", name: "property:create", group: "Property", guard_name: "web", description: "Create properties" },
  { id: "property:edit", name: "property:edit", group: "Property", guard_name: "web", description: "Edit properties" },
  { id: "property:delete", name: "property:delete", group: "Property", guard_name: "web", description: "Delete properties" },
];

// Mock Roles Data
const MOCK_ROLES: Role[] = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full access to all system features.",
    permissions: MOCK_PERMISSIONS.map(p => p.id),
    userCount: 2,
    isSystem: true,
    guard_name: "web",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Building Manager",
    description: "Can manage properties and bookings.",
    permissions: [
      "booking:read", "booking:create", "booking:approve", "booking:reject",
      "property:read", "property:edit"
    ],
    userCount: 5,
    isSystem: false,
    guard_name: "web",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Staff",
    description: "Can view bookings and properties.",
    permissions: ["booking:read", "property:read"],
    userCount: 12,
    isSystem: false,
    guard_name: "web",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRoles(MOCK_ROLES);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAdd = () => {
    setFormMode("create");
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setFormMode("edit");
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    if (role.isSystem) {
      toast.error("System role cannot be deleted.");
      return;
    }
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: RoleFormData) => {
    if (formMode === "create") {
      const newRole: Role = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        userCount: 0,
        isSystem: false,
        guard_name: "web",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRoles([...roles, newRole]);
      toast.success("Role berhasil dibuat");
    } else {
      if (!selectedRole) return;
      const updatedRoles = roles.map((r) =>
        r.id === selectedRole.id ? { ...r, ...data, updated_at: new Date().toISOString() } : r
      );
      setRoles(updatedRoles);
      toast.success("Role berhasil diperbarui");
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedRole) return;
    const updatedRoles = roles.filter((r) => r.id !== selectedRole.id);
    setRoles(updatedRoles);
    setIsDeleteOpen(false);
    toast.success("Role berhasil dihapus");
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
        <Card className="p-3 md:p-6 lg:p-8">
            <div className="py-6 space-y-6">
                <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
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



  return (
    <Card className="p-3 md:p-6 lg:p-8">
        <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" /> Roles & Permissions
            </h1>
            <p className="text-muted-foreground mt-1">
                Kelola role pengguna dan hak akses sistem.
            </p>
            </div>
            <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Buat Role Baru
            </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Cari role..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
            <Card key={role.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{role.userCount} Users</span>
                        {role.isSystem && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                            <Lock className="h-3 w-3" /> System
                        </Badge>
                        )}
                    </div>
                    </div>
                </div>
                <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                    {role.description || "Tidak ada deskripsi."}
                </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-4">
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Akses ({role.permissions.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((permId) => {
                        const perm = MOCK_PERMISSIONS.find(p => p.id === permId);
                        return (
                        <Badge key={permId} variant="outline" className="text-[10px] font-normal">
                            {perm?.name || permId}
                        </Badge>
                        );
                    })}
                    {role.permissions.length > 5 && (
                        <Badge variant="outline" className="text-[10px] font-normal bg-muted/50">
                        +{role.permissions.length - 5} lainnya
                        </Badge>
                    )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t mt-auto">
                    <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => handleEdit(role)}
                    >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {!role.isSystem && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(role)}
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                    )}
                </div>
                </CardContent>
            </Card>
            ))}
        </div>

        <RoleForm 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleFormSubmit}
            initialData={selectedRole || undefined}
            permissions={MOCK_PERMISSIONS}
            mode={formMode}
        />

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Role?</AlertDialogTitle>
                <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus role <b>{selectedRole?.name}</b>? 
                Tindakan ini tidak dapat dibatalkan dan mungkin mempengaruhi pengguna yang memiliki role ini.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Hapus
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </div>
    </Card>
  );
}

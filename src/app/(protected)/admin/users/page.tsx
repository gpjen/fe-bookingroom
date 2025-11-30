"use client";

import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
import { UserForm, UserFormData } from "./_components/user-form";
import { User } from "./_components/types";
import { getColumns } from "./_components/columns";

// Mock Data
const MOCK_ROLES = [
  { id: "1", name: "Super Admin" },
  { id: "2", name: "Building Manager" },
  { id: "3", name: "Staff" },
  { id: "4", name: "Viewer" },
];

const MOCK_COMPANIES = [
  { id: "c1", name: "PT. Teknologi Maju" },
  { id: "c2", name: "PT. Sinergi Abadi" },
  { id: "c3", name: "CV. Kreatif Digital" },
  { id: "c4", name: "PT. Global Solusi" },
  { id: "c5", name: "Yayasan Harapan Bangsa" },
];

const MOCK_BUILDINGS = [
  { id: "b1", name: "Gedung Utama" },
  { id: "b2", name: "Gedung Annex" },
  { id: "b3", name: "Menara Kembar A" },
  { id: "b4", name: "Menara Kembar B" },
  { id: "b5", name: "Gedung Parkir" },
];

const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Budi Santoso",
    nik: "EMP001",
    email: "budi@example.com",
    roles: ["1"],
    companyAccess: ["c1", "c2", "c3", "c4", "c5"],
    buildingAccess: ["b1", "b2", "b3", "b4", "b5"],
    status: "active",
    lastLogin: new Date().toISOString(),
  },
  {
    id: "u2",
    name: "Siti Aminah",
    nik: "EMP002",
    email: "siti@example.com",
    roles: ["2"],
    companyAccess: ["c1"],
    buildingAccess: ["b1", "b2"],
    status: "active",
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "u3",
    name: "Andi Wijaya",
    nik: "EMP003",
    email: "andi@example.com",
    roles: ["3"],
    companyAccess: ["c2"],
    buildingAccess: ["b3"],
    status: "inactive",
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 1000);
  }, []);

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

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: UserFormData) => {
    if (formMode === "create") {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
      };
      setUsers([...users, newUser]);
      toast.success("Pengguna berhasil dibuat");
    } else {
      if (!selectedUser) return;
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id ? { ...u, ...data } : u
      );
      setUsers(updatedUsers);
      toast.success("Pengguna berhasil diperbarui");
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    const updatedUsers = users.filter((u) => u.id !== selectedUser.id);
    setUsers(updatedUsers);
    setIsDeleteOpen(false);
    toast.success("Pengguna berhasil dihapus");
  };

  // Maps for displaying names in columns
  const roleMap = MOCK_ROLES.reduce(
    (acc, r) => ({ ...acc, [r.id]: r.name }),
    {}
  );
  const companyMap = MOCK_COMPANIES.reduce(
    (acc, c) => ({ ...acc, [c.id]: c.name }),
    {}
  );
  const buildingMap = MOCK_BUILDINGS.reduce(
    (acc, b) => ({ ...acc, [b.id]: b.name }),
    {}
  );

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    roleMap,
    companyMap,
    buildingMap,
  });

  if (loading) {
    return (
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" /> Manajemen Pengguna
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola data pengguna, hak akses, dan status akun.
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Cari nama pengguna..."
        />

        <UserForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={selectedUser || undefined}
          roles={MOCK_ROLES}
          companies={MOCK_COMPANIES}
          buildings={MOCK_BUILDINGS}
          mode={formMode}
        />

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus pengguna{" "}
                <b>{selectedUser?.name}</b>? Tindakan ini tidak dapat
                dibatalkan.
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
      </div>
    </Card>
  );
}

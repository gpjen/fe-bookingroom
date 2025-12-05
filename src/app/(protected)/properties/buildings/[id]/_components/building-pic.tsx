"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, User, Phone, Mail, Shield, Wrench, Briefcase, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { toast } from "sonner";
import { PICForm, PICFormData } from "./pic-form";

// Types
interface BuildingPIC {
  id: string;
  nik: string;
  name: string;
  role: "Building Manager" | "Cleaning Service" | "Security" | "Technician" | "Admin";
  phoneNumber?: string;
  email?: string;
  status: "Active" | "Inactive";
  avatar?: string;
}

// Mock Data Fetcher
const fetchPICData = async (_id: string): Promise<BuildingPIC[]> => {
  void _id; // Will be used when fetching real data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { 
          id: "1", 
          nik: "2023001", 
          name: "Budi Santoso", 
          role: "Building Manager", 
          phoneNumber: "081234567890", 
          email: "budi@example.com", 
          status: "Active",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi"
        },
        { 
          id: "2", 
          nik: "2023002", 
          name: "Siti Aminah", 
          role: "Admin", 
          phoneNumber: "081234567891", 
          email: "siti@example.com", 
          status: "Active",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti"
        },
        { 
          id: "3", 
          nik: "2023003", 
          name: "Agus Setiawan", 
          role: "Technician", 
          phoneNumber: "081234567892", 
          status: "Active",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agus"
        },
        { 
          id: "4", 
          nik: "2023004", 
          name: "Rudi Hartono", 
          role: "Security", 
          phoneNumber: "081234567893", 
          status: "Active",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rudi"
        },
      ]);
    }, 1200);
  });
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "Building Manager": return <Briefcase className="h-4 w-4" />;
    case "Security": return <Shield className="h-4 w-4" />;
    case "Technician": return <Wrench className="h-4 w-4" />;
    case "Admin": return <UserCog className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "Building Manager": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Security": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    case "Technician": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "Admin": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
};

export function BuildingPIC({ id }: { id: string }) {
  const [pics, setPics] = useState<BuildingPIC[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPIC, setSelectedPIC] = useState<BuildingPIC | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    fetchPICData(id).then((res) => {
      setPics(res);
      setLoading(false);
    });
  }, [id]);

  const handleAdd = () => {
    setFormMode("create");
    setSelectedPIC(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pic: BuildingPIC) => {
    setFormMode("edit");
    setSelectedPIC(pic);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (pic: BuildingPIC) => {
    setSelectedPIC(pic);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: PICFormData) => {
    if (formMode === "create") {
      const newPIC: BuildingPIC = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      };
      setPics([newPIC, ...pics]);
      toast.success("PIC berhasil ditambahkan");
    } else {
      if (!selectedPIC) return;
      const updatedPics = pics.map((p) =>
        p.id === selectedPIC.id ? { ...p, ...data } : p
      );
      setPics(updatedPics);
      toast.success("PIC berhasil diperbarui");
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedPIC) return;
    const updatedPics = pics.filter((p) => p.id !== selectedPIC.id);
    setPics(updatedPics);
    setIsDeleteOpen(false);
    toast.success("PIC berhasil dihapus");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daftar Penanggung Jawab</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola personel yang bertanggung jawab atas gedung ini.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Tambah PIC
        </Button>
      </CardHeader>
      <CardContent>
        {pics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pics.map((pic) => (
              <div
                key={pic.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors relative group"
              >
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={pic.avatar} />
                  <AvatarFallback>{pic.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate pr-6">{pic.name}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(pic)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(pic)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] h-5 gap-1 px-1.5 font-normal ${getRoleColor(pic.role)}`}>
                      {getRoleIcon(pic.role)}
                      {pic.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">L{pic.nik}</span>
                  </div>

                  <div className="pt-2 mt-2 border-t space-y-1">
                    {pic.phoneNumber && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{pic.phoneNumber}</span>
                      </div>
                    )}
                    {pic.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{pic.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Belum ada PIC yang ditambahkan.</p>
            <Button variant="link" onClick={handleAdd} className="mt-2 text-primary">
              + Tambah PIC
            </Button>
          </div>
        )}
      </CardContent>

      <PICForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPIC ? {
          nik: selectedPIC.nik,
          name: selectedPIC.name,
          role: selectedPIC.role,
          phoneNumber: selectedPIC.phoneNumber || "",
          email: selectedPIC.email || "",
          status: selectedPIC.status,
        } : undefined}
        mode={formMode}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus PIC?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <b>{selectedPIC?.name}</b> dari daftar PIC?
              Tindakan ini tidak dapat dibatalkan.
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
    </Card>
  );
}

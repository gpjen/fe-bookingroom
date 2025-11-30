"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MoreVertical, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { FacilityForm, FacilityFormData } from "./facility-form";
import Image from "next/image";

// Types
interface Facility {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

// Mock Data Fetcher
const fetchFacilitiesData = async (id: string): Promise<Facility[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { 
          id: "1", 
          title: "Gym & Fitness", 
          description: "Peralatan lengkap cardio dan weight training, buka 24 jam untuk penghuni.", 
          imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" 
        },
        { 
          id: "2", 
          title: "Swimming Pool", 
          description: "Kolam renang outdoor dengan pemandangan kota, tersedia area berjemur.", 
          imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1470&auto=format&fit=crop" 
        },
        { 
          id: "3", 
          title: "Co-working Space", 
          description: "Area kerja nyaman dengan WiFi kecepatan tinggi dan kopi gratis.", 
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1469&auto=format&fit=crop" 
        },
        { 
          id: "4", 
          title: "Mini Market", 
          description: "Menyediakan kebutuhan sehari-hari, buka pukul 07:00 - 22:00.", 
          imageUrl: "" 
        },
        { 
          id: "5", 
          title: "Laundry Room", 
          description: "Mesin cuci dan pengering coin-operated tersedia di setiap lantai.", 
          imageUrl: "" 
        },
      ]);
    }, 1000);
  });
};

export function BuildingFacilities({ id }: { id: string }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    fetchFacilitiesData(id).then((res) => {
      setFacilities(res);
      setLoading(false);
    });
  }, [id]);

  const handleAdd = () => {
    setFormMode("create");
    setSelectedFacility(null);
    setIsFormOpen(true);
  };

  const handleEdit = (facility: Facility) => {
    setFormMode("edit");
    setSelectedFacility(facility);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: FacilityFormData) => {
    if (formMode === "create") {
      const newFacility: Facility = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
      };
      setFacilities([newFacility, ...facilities]);
      toast.success("Fasilitas berhasil ditambahkan");
    } else {
      if (!selectedFacility) return;
      const updatedFacilities = facilities.map((f) =>
        f.id === selectedFacility.id ? { ...f, ...data } : f
      );
      setFacilities(updatedFacilities);
      toast.success("Fasilitas berhasil diperbarui");
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedFacility) return;
    const updatedFacilities = facilities.filter((f) => f.id !== selectedFacility.id);
    setFacilities(updatedFacilities);
    setIsDeleteOpen(false);
    toast.success("Fasilitas berhasil dihapus");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className=" flex flex-row items-center justify-between mb-6">
        <div>
          <CardTitle className="text-lg font-semibold">Fasilitas Gedung</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar fasilitas yang tersedia untuk penghuni gedung ini.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Fasilitas
        </Button>
      </CardHeader>
      <CardContent className="">
        {facilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className="group relative flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image Cover */}
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                  {facility.imageUrl ? (
                    <Image
                      src={facility.imageUrl}
                      alt={facility.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/50">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white">
                          <MoreVertical className="h-4 w-4 text-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(facility)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(facility)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="font-semibold text-base mb-2 line-clamp-1" title={facility.title}>
                    {facility.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {facility.description || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
            <div className="p-4 rounded-full bg-muted mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Belum ada fasilitas</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Tambahkan fasilitas gedung untuk memberikan informasi lebih lengkap kepada calon penghuni.
            </p>
            <Button onClick={handleAdd} variant="outline">
              Mulai Tambah Fasilitas
            </Button>
          </div>
        )}
      </CardContent>

      <FacilityForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedFacility ? {
          title: selectedFacility.title,
          description: selectedFacility.description || "",
          imageUrl: selectedFacility.imageUrl || "",
        } : undefined}
        mode={formMode}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fasilitas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus fasilitas <b>{selectedFacility?.title}</b>? 
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

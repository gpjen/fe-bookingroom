"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  MapPinned,
} from "lucide-react";
import { FormArea, ArealFormData, Areal } from "./_components/form-area";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// Mock Data with updated type
const initialData: (Areal & { createdAt: string; updatedAt: string })[] = [
  {
    id: "1",
    kodeAreal: "HL-01",
    namaAreal: "MESS LQ",
    lokasi: "kawasi, Obi",
    status: "active",
    catatan: "areal mess LQ kawasi HPAL,DCM,ONC",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
  },
  {
    id: "2",
    kodeAreal: "HL-02",
    namaAreal: "MESS LQ Center",
    lokasi: "kawasi, Obi",
    status: "active",
    parentId: "",
    catatan: null,
    createdAt: "2024-02-20T09:15:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
  },
  {
    id: "3",
    kodeAreal: "HL-03",
    namaAreal: "MESS P2",
    lokasi: "kawasi, Obi",
    status: "inactive",
    catatan: "Dalam tahap persiapan lahan dan pembersihan",
    createdAt: "2024-03-10T07:45:00Z",
    updatedAt: "2024-11-25T16:00:00Z",
  },
  {
    id: "4",
    kodeAreal: "HL-04",
    namaAreal: "Mess Tomori",
    lokasi: "kawasi, Obi",
    status: "development",
    catatan: "mess lama DCM",
    createdAt: "2024-04-05T11:00:00Z",
    updatedAt: "2024-11-22T09:10:00Z",
  },
];

// Status Badge Component
const StatusBadge = ({ status }: { status: Areal["status"] }) => {
  const variants = {
    active: {
      className:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
      label: "Aktif",
    },
    inactive: {
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
      label: "Tidak Aktif",
    },
    development: {
      className:
        "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
      label: "Pengembangan",
    },
  };

  return (
    <Badge className={variants[status].className} variant="outline">
      {variants[status].label}
    </Badge>
  );
};

// Main Component
export default function ArealMasterPage() {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Areal | null>(null);

  // Filter data based on search and status
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.namaAreal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeAreal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasi?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle form submission from FormArea component
  const handleFormSubmit = (formData: ArealFormData, id?: string) => {
    const now = new Date().toISOString();

    if (id) {
      // Update existing item
      setData(
        data.map((item) =>
          item.id === id ? { ...item, ...formData, updatedAt: now } : item
        )
      );
    } else {
      // Add new item
      const newItem: Areal & { createdAt: string; updatedAt: string } = {
        ...formData,
        id: Date.now().toString(),
        kodeAreal: `HL-${String(data.length + 1).padStart(3, "0")}`,
        createdAt: now,
        updatedAt: now,
      };
      setData([...data, newItem]);
    }
  };

  // Handle delete
  const handleDelete = (id: string, namaAreal: string) => {
    toast.success(`Areal ${namaAreal} berhasil dihapus.`);
    setData(data.filter((item) => item.id !== id));
  };

  // Open modal for editing
  const handleEdit = (item: Areal) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-foreground/90 dark:text-zinc-50">
              <MapPinned className="size-6" />
              <h2 className="text-3xl font-bold tracking-tight">Areal</h2>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Kelola data areal atau kawasan
            </p>
          </div>

          <Button onClick={handleAdd} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Tambah Areal
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama areal, kode, atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="development">Pengembangan</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="px-4 py-3 w-8 text-left text-sm font-semibold">
                    NO
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Kode
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Nama Areal
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Lokasi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Parent
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Terakhir Update
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-sm font-semibold">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || statusFilter !== "all"
                            ? "Tidak ada data yang sesuai dengan filter"
                            : "Belum ada data areal"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => {
                    const parentArea = item.parentId
                      ? data.find((d) => d.id === item.parentId)
                      : null;

                    return (
                      <TableRow
                        key={item.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-4 py-4 w-8 text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="font-mono text-sm font-medium">
                            {item.kodeAreal}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {item.namaAreal}
                            </span>
                            {item.catatan && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.catatan}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 max-w-[250px]">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{item.lokasi}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {parentArea ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Layers className="h-3.5 w-3.5" />
                              <span>{parentArea.kodeAreal}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(item.updatedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  handleDelete(item.id, item.namaAreal)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Info */}
          {filteredData.length > 0 && (
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              Menampilkan {filteredData.length} dari {data.length} areal
            </div>
          )}
        </div>
      </div>

      {/* Render the Modal Form Component */}
      <FormArea
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        allAreas={data}
      />
    </Card>
  );
}

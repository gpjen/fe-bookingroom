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
  Calendar,
  Building2,
} from "lucide-react";
import {
  FormArea,
  CompaniesFormData,
  Companies,
} from "./_components/form-companies";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// Mock Data with updated type
const initialData: (Companies & { createdAt: string; updatedAt: string })[] = [
  {
    id: "1",
    code: "DCM",
    name: "PT. Dharma Cipta Mulia",
    status: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
  },
  {
    id: "2",
    code: "HPAL",
    name: "PT. Halmahera Persada Lygend",
    status: true,
    createdAt: "2024-02-20T09:15:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
  },
  {
    id: "3",
    code: "ONC",
    name: "PT. Obi Nickel Cobalt",
    status: false,
    createdAt: "2024-03-10T07:45:00Z",
    updatedAt: "2024-11-25T16:00:00Z",
  },
];

// Status Badge Component
const StatusBadge = ({ status }: { status: Companies["status"] }) => {
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

// Main Component
export default function CompaniesMasterPage() {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Companies | null>(null);

  // Filter data based on search and status
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === (statusFilter === "true");

    return matchesSearch && matchesStatus;
  });

  // Handle form submission from FormArea component
  const handleFormSubmit = (formData: CompaniesFormData, id?: string) => {
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
      const newItem: Companies & { createdAt: string; updatedAt: string } = {
        ...formData,
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        status: formData.status,
        createdAt: now,
        updatedAt: now,
      };
      setData([...data, newItem]);
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    toast.success(`Companies ${name} berhasil dihapus.`);
    setData(data.filter((item) => item.id !== id));
  };

  // Open modal for editing
  const handleEdit = (item: Companies) => {
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
              <Building2 className="size-6" />
              <h2 className="text-3xl font-bold tracking-tight">Perusahaan</h2>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Kelola data perusahaan
            </p>
          </div>

          <Button onClick={handleAdd} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Tambah Perusahaan
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama companies, kode, atau lokasi..."
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
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
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
                    Nama
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold">
                    Status
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
                            : "Belum ada data companies"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => {
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
                            {item.code}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <StatusBadge status={item.status} />
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
                                onClick={() => handleDelete(item.id, item.name)}
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
              Menampilkan {filteredData.length} dari {data.length} companies
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

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface Areal {
  id: string;
  kodeAreal: string;
  namaAreal: string;
  lokasi: string;
  status: "active" | "inactive" | "development";
  koordinat: {
    type: "Polygon";
    polygon: Array<{ latitude: number; longitude: number }>;
  };
  catatan?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock Data
const initialData: Areal[] = [
  {
    id: "1",
    kodeAreal: "HL-01",
    namaAreal: "MESS LQ",
    lokasi: "kawasi, Obi",
    status: "active",
    koordinat: {
      type: "Polygon",
      polygon: [
        { latitude: -7.257, longitude: 112.7515 },
        { latitude: -7.257, longitude: 112.7527 },
        { latitude: -7.258, longitude: 112.7527 },
        { latitude: -7.258, longitude: 112.7515 },
      ],
    },
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
    koordinat: {
      type: "Polygon",
      polygon: [
        { latitude: -7.2665, longitude: 112.761 },
        { latitude: -7.2665, longitude: 112.7632 },
        { latitude: -7.2685, longitude: 112.7632 },
        { latitude: -7.2685, longitude: 112.761 },
      ],
    },
    parentId: "",
    createdAt: "2024-02-20T09:15:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
  },
  {
    id: "3",
    kodeAreal: "HL-03",
    namaAreal: "MESS P2",
    lokasi: "kawasi, Obi",
    status: "inactive",
    koordinat: {
      type: "Polygon",
      polygon: [
        { latitude: -7.247, longitude: 112.7815 },
        { latitude: -7.247, longitude: 112.7827 },
        { latitude: -7.248, longitude: 112.7827 },
        { latitude: -7.248, longitude: 112.7815 },
      ],
    },
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
    koordinat: {
      type: "Polygon",
      polygon: [
        { latitude: -7.237, longitude: 112.7415 },
        { latitude: -7.237, longitude: 112.7427 },
        { latitude: -7.238, longitude: 112.7427 },
        { latitude: -7.238, longitude: 112.7415 },
      ],
    },
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

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

// Main Component
export default function ArealMasterPage() {
  const [data, setData] = useState<Areal[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Areal | null>(null);
  const [formData, setFormData] = useState<Partial<Areal>>({});

  // Filter data based on search and status
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.namaAreal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeAreal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle form submit
  const handleSubmit = () => {
    const now = new Date().toISOString();

    if (editingItem) {
      setData(
        data.map((item) =>
          item.id === editingItem.id
            ? ({ ...item, ...formData, updatedAt: now } as Areal)
            : item
        )
      );
    } else {
      const newItem: Areal = {
        ...formData,
        id: Date.now().toString(),
        kodeAreal: `AR-${String(data.length + 1).padStart(3, "0")}`,
        createdAt: now,
        updatedAt: now,
      } as Areal;
      setData([...data, newItem]);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      setData(data.filter((item) => item.id !== id));
    }
  };

  // Open dialog for edit
  const handleEdit = (item: Areal) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  // Open dialog for add
  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      status: "active",
      koordinat: {
        type: "Polygon",
        polygon: [],
      },
    });
    setIsDialogOpen(true);
  };

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">AREAL</h2>
            <p className="text-muted-foreground mt-1.5">
              Kelola data areal atau kawasan
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Tambah Areal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingItem ? "Edit Areal" : "Tambah Areal Baru"}
                </DialogTitle>
                <DialogDescription>
                  Lengkapi informasi areal di bawah ini. Field dengan tanda (*)
                  wajib diisi.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Informasi Dasar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Informasi Dasar
                  </h3>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="namaAreal"
                        className="text-sm font-medium"
                      >
                        Nama Areal <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="namaAreal"
                        placeholder="Contoh: Kebun Padi Utara"
                        value={formData.namaAreal || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            namaAreal: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lokasi" className="text-sm font-medium">
                        Lokasi <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lokasi"
                        placeholder="Desa, Kecamatan, Kabupaten"
                        value={formData.lokasi || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, lokasi: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as Areal["status"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status areal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="development">
                            Pengembangan
                          </SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Koordinat Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Koordinat & Pemetaan
                  </h3>

                  <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          Input Koordinat Polygon
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Koordinat polygon akan diinput melalui peta interaktif
                          atau import file KML/GeoJSON
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent Areal */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Hubungan Areal
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="parentId" className="text-sm font-medium">
                      Parent Areal (Opsional)
                    </Label>
                    <Select
                      value={formData.parentId || "none"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          parentId: value === "none" ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih parent areal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada parent</SelectItem>
                        {data
                          .filter((item) => item.id !== editingItem?.id)
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.kodeAreal} - {item.namaAreal}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pilih jika areal ini merupakan bagian dari areal yang
                      lebih besar
                    </p>
                  </div>
                </div>

                {/* Catatan */}
                <div className="space-y-2">
                  <Label htmlFor="catatan" className="text-sm font-medium">
                    Catatan
                  </Label>
                  <Textarea
                    id="catatan"
                    placeholder="Informasi tambahan tentang areal..."
                    value={formData.catatan || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="button" onClick={handleSubmit}>
                  {editingItem ? "Simpan Perubahan" : "Tambah Areal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <TableCell colSpan={7} className="px-4 py-12 text-center">
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
                                onClick={() => handleDelete(item.id)}
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
    </Card>
  );
}

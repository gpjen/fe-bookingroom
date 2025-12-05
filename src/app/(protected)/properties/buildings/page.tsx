"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreVertical,
  Trash2,
  Building2,
  Calendar,
  MapPin,
  Layers,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  FormBuildings,
  BuildingFormData,
  Building,
} from "./_components/form-buildings";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

// Mock Data for Areas (should match Areas page)
const MOCK_AREAS = [
  { id: "1", name: "MESS LQ" },
  { id: "2", name: "MESS LQ Center" },
  { id: "3", name: "MESS P2" },
  { id: "4", name: "Mess Tomori" },
];

// Mock Data for Building Types
const MOCK_BUILDING_TYPES = [
  { id: "bt-1", name: "Mess" },
  { id: "bt-2", name: "Hotel" },
  { id: "bt-3", name: "Barrack" },
  { id: "bt-4", name: "House" },
];

// Mock Data for Buildings
const initialData: Building[] = [
  {
    id: "1",
    code: "BLD-LQ-01",
    name: "Gedung A (Mess)",
    arealId: "1",
    arealName: "MESS LQ",
    buildingTypeId: "bt-1",
    buildingTypeName: "Mess",
    totalFloors: 3,
    status: "active",
    description: "Asrama karyawan staff",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
  },
  {
    id: "2",
    code: "BLD-LQ-02",
    name: "Gedung B (Hotel)",
    arealId: "1",
    arealName: "MESS LQ",
    buildingTypeId: "bt-2",
    buildingTypeName: "Hotel",
    totalFloors: 2,
    status: "active",
    description: "Hotel Tamu LQ",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-11-21T14:00:00Z",
  },
  {
    id: "3",
    code: "BLD-CTR-01",
    name: "Main Hall",
    arealId: "2",
    arealName: "MESS LQ Center",
    buildingTypeId: "bt-4",
    buildingTypeName: "House",
    totalFloors: 1,
    status: "active",
    description: "Mess utama LQ Center",
    createdAt: "2024-02-01T07:30:00Z",
    updatedAt: "2024-11-25T11:45:00Z",
  },
  {
    id: "4",
    code: "BLD-P2-01",
    name: "Gedung P2 A",
    arealId: "3",
    arealName: "MESS P2",
    buildingTypeId: "bt-1",
    buildingTypeName: "Mess",
    totalFloors: 4,
    status: "maintenance",
    description: "Mess DCM - Sedang dalam perbaikan atap",
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-11-28T09:00:00Z",
  },
  {
    id: "5",
    code: "BLD-TMR-01",
    name: "Tomori Guest House",
    arealId: "4",
    arealName: "Mess Tomori",
    buildingTypeId: "bt-1",
    buildingTypeName: "Mess",
    totalFloors: 2,
    status: "development",
    description: "Mess Baru DCM ONC - Tahap finishing interior",
    createdAt: "2024-04-05T13:00:00Z",
    updatedAt: "2024-11-27T16:20:00Z",
  },
];

// Status Badge Component
const StatusBadge = ({ status }: { status: Building["status"] }) => {
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
    maintenance: {
      className:
        "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200",
      label: "Perbaikan",
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

export default function BuildingsPage() {
  const [data, setData] = useState<Building[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Building | null>(null);

  // Handle form submission
  const handleFormSubmit = (formData: BuildingFormData, id?: string) => {
    const now = new Date().toISOString();
    const areal = MOCK_AREAS.find((a) => a.id === formData.arealId);
    const type = MOCK_BUILDING_TYPES.find(
      (t) => t.id === formData.buildingTypeId
    );

    if (id) {
      // Update existing item
      setData(
        data.map((item) =>
          item.id === id
            ? {
                ...item,
                ...formData,
                arealName: areal?.name,
                buildingTypeName: type?.name,
                updatedAt: now,
              }
            : item
        )
      );
      toast.success("Data bangunan berhasil diperbarui");
    } else {
      // Add new item
      const newItem: Building = {
        ...formData,
        id: Date.now().toString(),
        arealName: areal?.name,
        buildingTypeName: type?.name,
        createdAt: now,
        updatedAt: now,
      };
      setData([newItem, ...data]);
      toast.success("Bangunan baru berhasil ditambahkan");
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    setData(data.filter((item) => item.id !== id));
    toast.success(`Bangunan ${name} berhasil dihapus`);
  };

  // Open modal for editing - will be used when edit functionality is enabled
  const _handleEdit = (item: Building) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  void _handleEdit; // Suppress unused warning

  // Open modal for adding
  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Define columns
  const columns: ColumnDef<Building>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-semibold">NO</div>,
      cell: ({ row, table }) => {
        const paginatedRows = table.getPaginationRowModel().rows;
        const indexInPage = paginatedRows.findIndex((r) => r.id === row.id);
        const { pageIndex, pageSize } = table.getState().pagination;
        const number = pageIndex * pageSize + indexInPage + 1;
        return (
          <div className="text-center font-medium text-muted-foreground w-12">
            {number}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kode" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama Bangunan" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "arealName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Areal" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.arealName}</span>
        </div>
      ),
    },
    {
      accessorKey: "buildingTypeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipe" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.buildingTypeName}
        </Badge>
      ),
    },
    {
      accessorKey: "totalFloors",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lantai" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("totalFloors")} Lt</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Terakhir Update" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(row.getValue("updatedAt"))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={`/properties/buildings/${item.id}`}>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(item.id, item.name)}
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

  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-foreground/90 dark:text-zinc-50">
              <Building2 className="size-6" />
              <h2 className="text-3xl font-bold tracking-tight">Buildings</h2>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Kelola data bangunan dan gedung
            </p>
          </div>

          <Button onClick={handleAdd} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Tambah Bangunan
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Cari nama bangunan, kode..."
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage="Belum ada data bangunan."
          renderToolbar={(table) => (
            <Select
              value={
                (table.getColumn("status")?.getFilterValue() as string) || "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="maintenance">Perbaikan</SelectItem>
                <SelectItem value="development">Pengembangan</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Form Modal */}
      <FormBuildings
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        areals={MOCK_AREAS}
        buildingTypes={MOCK_BUILDING_TYPES}
      />
    </Card>
  );
}

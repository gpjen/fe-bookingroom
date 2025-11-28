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
  Edit,
  Trash2,
  Calendar,
  Layers,
  Building2,
  DoorOpen,
  LayoutGrid,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  FormOptionsType,
  OptionType,
} from "./_components/form-options-type";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// Type for table data with timestamps
type OptionTypeWithDates = OptionType & {
  createdAt: string;
  updatedAt: string;
};

// Mock Data
const initialData: OptionTypeWithDates[] = [
  {
    id: "1",
    category: "building",
    name: "Dormitory A",
    description: "Student dormitory building with modern facilities",
    metadata: {
      floors: 5,
      facilities: ["Gym", "Cafeteria", "Study Room"],
      yearBuilt: 2020,
      capacity: 200,
    },
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
  },
  {
    id: "2",
    category: "room",
    name: "VIP Suite",
    description: "Premium room with luxury amenities",
    metadata: {
      amenities: ["AC", "TV", "Mini Bar", "Private Bathroom"],
      bedType: "King Size",
      maxOccupancy: 2,
      priceMultiplier: 2.5,
    },
    createdAt: "2024-02-15T09:15:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
  },
  {
    id: "3",
    category: "floor",
    name: "Ground Floor",
    description: "Main entrance floor with lobby",
    metadata: {
      level: 0,
      hasElevatorAccess: true,
      totalRooms: 20,
      commonAreas: ["Lobby", "Reception"],
    },
    createdAt: "2024-03-20T07:45:00Z",
    updatedAt: "2024-11-25T16:00:00Z",
  },
  {
    id: "4",
    category: "building",
    name: "Dormitory B",
    description: "Economy dormitory building",
    metadata: {
      floors: 3,
      facilities: ["Laundry"],
      yearBuilt: 2018,
      capacity: 120,
    },
    createdAt: "2024-04-05T10:00:00Z",
    updatedAt: "2024-11-22T09:15:00Z",
  },
  {
    id: "5",
    category: "room",
    name: "Standard Room",
    description: "Basic room with essential amenities",
    metadata: {
      amenities: ["Fan", "Shared Bathroom"],
      bedType: "Single",
      maxOccupancy: 1,
      priceMultiplier: 1.0,
    },
    createdAt: "2024-05-12T11:30:00Z",
    updatedAt: "2024-11-23T15:45:00Z",
  },
  {
    id: "6",
    category: "floor",
    name: "Second Floor",
    description: "Residential floor with rooms",
    metadata: {
      level: 2,
      hasElevatorAccess: true,
      totalRooms: 25,
      commonAreas: ["Lounge"],
    },
    createdAt: "2024-06-08T08:20:00Z",
    updatedAt: "2024-11-24T12:00:00Z",
  },
  {
    id: "7",
    category: "building",
    name: "Dormitory C",
    description: "Modern eco-friendly dormitory",
    metadata: {
      floors: 4,
      facilities: ["Solar Panels", "Gym", "Library"],
      yearBuilt: 2022,
      capacity: 150,
    },
    createdAt: "2024-07-15T14:30:00Z",
    updatedAt: "2024-11-26T08:45:00Z",
  },
  {
    id: "8",
    category: "room",
    name: "Deluxe Room",
    description: "Spacious room with premium features",
    metadata: {
      amenities: ["AC", "TV", "Kitchen", "Balcony"],
      bedType: "Queen Size",
      maxOccupancy: 3,
      priceMultiplier: 1.8,
    },
    createdAt: "2024-08-20T11:15:00Z",
    updatedAt: "2024-11-27T13:20:00Z",
  },
];

// Category Badge Component
const CategoryBadge = ({ category }: { category: OptionType["category"] }) => {
  const config = {
    building: {
      color: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
      label: "Bangunan",
      icon: Building2,
    },
    floor: {
      color:
        "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200",
      label: "Lantai",
      icon: LayoutGrid,
    },
    room: {
      color: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
      label: "Kamar",
      icon: DoorOpen,
    },
  };

  const { color, label, icon: Icon } = config[category];

  return (
    <Badge className={`${color} gap-1.5`} variant="outline">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

// Metadata Display Component
const MetadataDisplay = ({ metadata }: { metadata: any }) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Tidak ada metadata
      </span>
    );
  }

  const keys = Object.keys(metadata).slice(0, 2);
  const remaining = Object.keys(metadata).length - 2;

  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((key) => {
        const value = metadata[key];
        let displayValue = "";

        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value[0] + (value.length > 1 ? ` +${value.length - 1}` : "") : "[]";
        } else if (typeof value === "object") {
          displayValue = "{...}";
        } else {
          displayValue = String(value);
        }

        return (
          <span
            key={key}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground"
          >
            {key}: {displayValue}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
          +{remaining} lainnya
        </span>
      )}
    </div>
  );
};

// Main Component
export default function OptionsTypesPage() {
  const [data, setData] = useState<OptionTypeWithDates[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptionType | null>(null);

  // Handle form submission
  const handleFormSubmit = (formData: OptionType, id?: string) => {
    const now = new Date().toISOString();

    if (id) {
      setData(
        data.map((item) =>
          item.id === id ? { ...item, ...formData, updatedAt: now } : item
        )
      );
      toast.success("Option Type berhasil diperbarui");
    } else {
      const newItem: OptionTypeWithDates = {
        ...formData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setData([newItem, ...data]);
      toast.success("Option Type berhasil ditambahkan");
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    setData(data.filter((item) => item.id !== id));
    toast.success(`Option Type "${name}" berhasil dihapus`);
  };

  // Handle edit
  const handleEdit = (item: OptionTypeWithDates) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Handle add
  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Define columns
  const columns: ColumnDef<OptionTypeWithDates>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-semibold">NO</div>,
      cell: ({ row, table }) => {
        // Get the paginated rows (current page only)
        const paginatedRows = table.getPaginationRowModel().rows;
        
        // Find index in current page
        const indexInPage = paginatedRows.findIndex(r => r.id === row.id);
        
        // Get pagination state
        const { pageIndex, pageSize } = table.getState().pagination;
        
        // Calculate number: (pageIndex * pageSize) + indexInCurrentPage + 1
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
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kategori" />
      ),
      cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama & Deskripsi" />
      ),
      cell: ({ row }) => {
        return (
          <div className="space-y-1 max-w-md">
            <div className="font-semibold text-foreground">
              {row.getValue("name")}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {row.original.description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "metadata",
      header: "Metadata",
      cell: ({ row }) => (
        <MetadataDisplay metadata={row.getValue("metadata")} />
      ),
      enableSorting: false,
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
                <DropdownMenuItem onClick={() => handleEdit(item)}>
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
              <Layers className="size-6" />
              <h2 className="text-3xl font-bold tracking-tight">
                Pilihan Tipe
              </h2>
            </div>
            <p className="text-muted-foreground mt-1.5">
              Kelola pilihan tipe untuk data bangunan, lantai, dan kamar
            </p>
          </div>

          <Button onClick={handleAdd} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Tambah Tipe
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Cari nama tipe..."
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage="Belum ada data option type. Klik 'Tambah Tipe' untuk memulai."
          renderToolbar={(table) => (
            <Select
              value={
                (table.getColumn("category")?.getFilterValue() as string) || "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("category")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="building">Bangunan</SelectItem>
                <SelectItem value="floor">Lantai</SelectItem>
                <SelectItem value="room">Kamar</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Form Modal */}
      <FormOptionsType
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />
    </Card>
  );
}
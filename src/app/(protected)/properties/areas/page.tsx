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
  MapPin,
  Calendar,
  Layers,
  MapPinned,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { FormArea, ArealFormData, Areal } from "./_components/form-area";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// Mock Data with updated type
const initialData: (Areal & { createdAt: string; updatedAt: string })[] = [
  {
    id: "1",
    code: "HL-01",
    name: "MESS LQ",
    location: "kawasi, Obi",
    status: "active",
    descriptions: "areal mess LQ kawasi HPAL,DCM,ONC",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-11-20T10:30:00Z",
    polygon:
      '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[127.41194,-1.566721],[127.399063,-1.598118],[127.389276,-1.618878],[127.408849,-1.621623],[127.459499,-1.585079],[127.426877,-1.572211],[127.41194,-1.566721]]]}}',
  },
  {
    id: "2",
    code: "HL-02",
    name: "MESS LQ Center",
    location: "kawasi, Obi",
    status: "active",
    parent_id: "",
    descriptions: null,
    createdAt: "2024-02-20T09:15:00Z",
    updatedAt: "2024-11-18T14:20:00Z",
    polygon:
      '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[127.412395,-1.565408],[127.459431,-1.583597],[127.465267,-1.56129],[127.460117,-1.547562],[127.416859,-1.540698],[127.404499,-1.545503],[127.412395,-1.565408]]]}}',
  },
  {
    id: "3",
    code: "HL-03",
    name: "MESS P2",
    location: "kawasi, Obi",
    status: "inactive",
    descriptions: "Dalam tahap persiapan lahan dan pembersihan",
    createdAt: "2024-03-10T07:45:00Z",
    updatedAt: "2024-11-25T16:00:00Z",
    polygon: '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[127.427931,-1.541702],[127.461576,-1.547536],[127.469988,-1.542045],[127.45677,-1.536726],[127.433424,-1.536382],[127.427931,-1.541702]]]}}',
  },
  {
    id: "4",
    code: "HL-04",
    name: "Mess Tomori",
    location: "kawasi, Obi",
    status: "development",
    descriptions: "mess lama DCM",
    createdAt: "2024-04-05T11:00:00Z",
    updatedAt: "2024-11-22T09:10:00Z",
    polygon: '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[127.429905,-1.529029],[127.470417,-1.534177],[127.464237,-1.514958],[127.429905,-1.529029]]]}}',
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Areal | null>(null);

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
      toast.success("Areal berhasil diperbarui");
    } else {
      // Add new item
      const newItem: Areal & { createdAt: string; updatedAt: string } = {
        ...formData,
        id: Date.now().toString(),
        code: `HL-${String(data.length + 1).padStart(3, "0")}`,
        createdAt: now,
        updatedAt: now,
      };
      setData([newItem, ...data]);
      toast.success("Areal berhasil ditambahkan");
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    setData(data.filter((item) => item.id !== id));
    toast.success(`Areal ${name} berhasil dihapus.`);
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

  // Define columns
  const columns: ColumnDef<Areal & { createdAt: string; updatedAt: string }>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-semibold">NO</div>,
      cell: ({ row, table }) => {
        const paginatedRows = table.getPaginationRowModel().rows;
        const indexInPage = paginatedRows.findIndex(r => r.id === row.id);
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
        <DataTableColumnHeader column={column} title="Nama Areal" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.descriptions && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.descriptions}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lokasi" />
      ),
      cell: ({ row }) => (
        <div className="flex items-start gap-2 max-w-[200px]">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm truncate">{row.getValue("location")}</span>
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
      accessorKey: "parent_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parent" />
      ),
      cell: ({ row }) => {
        const parentId = row.getValue("parent_id");
        const parentArea = data.find((d) => d.id === parentId);
        
        return parentArea ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>{parentArea.code}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Cari nama areal, kode, atau lokasi..."
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage="Belum ada data areal."
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
                <SelectItem value="development">Pengembangan</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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

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
  Building2,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Companies | null>(null);

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
      toast.success("Companies berhasil diperbarui");
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
      setData([newItem, ...data]);
      toast.success("Companies berhasil ditambahkan");
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    setData(data.filter((item) => item.id !== id));
    toast.success(`Companies ${name} berhasil dihapus.`);
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

  // Define columns
  const columns: ColumnDef<Companies & { createdAt: string; updatedAt: string }>[] = [
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
        <DataTableColumnHeader column={column} title="Nama" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.getValue("name")}</span>
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
        return value.includes(String(row.getValue(id)));
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Cari nama companies..."
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage="Belum ada data companies."
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
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
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

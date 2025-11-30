"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "./types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

interface ColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  roleMap: Record<string, string>; // ID -> Name
  companyMap: Record<string, string>; // ID -> Name
  buildingMap: Record<string, string>; // ID -> Name
}

export const getColumns = ({
  onEdit,
  onDelete,
  roleMap,
}: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Nama Pengguna",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "nik",
    header: "NIK",
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue("nik")}</div>
    ),
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 2).map((roleId) => (
            <Badge
              key={roleId}
              variant="outline"
              className="text-[10px] font-normal"
            >
              {roleMap[roleId] || roleId}
            </Badge>
          ))}
          {roles.length > 2 && (
            <Badge
              variant="outline"
              className="text-[10px] font-normal bg-muted/50"
            >
              +{roles.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "companyAccess",
    header: "Akses Perusahaan",
    cell: ({ row }) => {
      const companies = row.getValue("companyAccess") as string[];
      if (companies.length === 0)
        return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>{companies.length} Perusahaan</span>
        </div>
      );
    },
  },
  {
    accessorKey: "buildingAccess",
    header: "Akses Gedung",
    cell: ({ row }) => {
      const buildings = row.getValue("buildingAccess") as string[];
      if (buildings.length === 0)
        return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{buildings.length} Gedung</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className={
            status === "active" ? "bg-green-500 hover:bg-green-600" : ""
          }
        >
          {status === "active" ? "Aktif" : "Non-aktif"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

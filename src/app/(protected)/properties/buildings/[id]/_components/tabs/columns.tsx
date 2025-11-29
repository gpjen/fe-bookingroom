"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, LogOut } from "lucide-react";

export type HistoryOccupant = {
  id: string;
  name: string;
  nik: string;
  gender: "Male" | "Female";
  checkInDate: string;
  checkOutDate: string;
  department: string;
  avatar?: string;
  status: "Checked Out";
};

export const columns: ColumnDef<HistoryOccupant>[] = [
  {
    accessorKey: "name",
    header: "Nama Penghuni",
    cell: ({ row }) => {
      const occupant = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={occupant.avatar} />
            <AvatarFallback>
              {occupant.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{occupant.name}</span>
            <span className="text-xs text-muted-foreground">{occupant.nik}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Departemen",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("department")}</span>
    ),
  },
  {
    accessorKey: "checkInDate",
    header: "Check In",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{row.getValue("checkInDate")}</span>
      </div>
    ),
  },
  {
    accessorKey: "checkOutDate",
    header: "Check Out",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <LogOut className="h-3 w-3" />
        <span>{row.getValue("checkOutDate")}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px]">
        {row.getValue("status")}
      </Badge>
    ),
  },
];

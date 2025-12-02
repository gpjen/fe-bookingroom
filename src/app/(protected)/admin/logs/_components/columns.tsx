"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SystemLog } from "./types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<SystemLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Waktu",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(row.original.timestamp, "dd MMM yyyy", { locale: id })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(row.original.timestamp, "HH:mm:ss", { locale: id })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      const level = row.original.level;
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1",
            level === "INFO" && "border-blue-500 text-blue-500",
            level === "WARNING" && "border-yellow-500 text-yellow-500",
            level === "ERROR" && "border-red-500 text-red-500",
            level === "CRITICAL" && "border-red-700 text-red-700 bg-red-50"
          )}
        >
          {level === "INFO" && <Info className="h-3 w-3" />}
          {level === "WARNING" && <AlertTriangle className="h-3 w-3" />}
          {level === "ERROR" && <AlertOctagon className="h-3 w-3" />}
          {level === "CRITICAL" && <ShieldAlert className="h-3 w-3" />}
          {level}
        </Badge>
      );
    },
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.nik}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "module",
    header: "Modul",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-xs">
        {row.original.module}
      </Badge>
    ),
  },
  {
    accessorKey: "action",
    header: "Aksi",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.action}</span>
    ),
  },
  {
    accessorKey: "message",
    header: "Pesan",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate text-sm text-muted-foreground"
        title={row.original.message}
      >
        {row.original.message}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            status === "SUCCESS" ? "text-green-600" : "text-red-600"
          )}
        >
          {status === "SUCCESS" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.ipAddress}
      </span>
    ),
  },
];

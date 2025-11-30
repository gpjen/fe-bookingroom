"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Building2, User, FileText, LogIn, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type HistoryOccupant = {
  id: string;
  name: string;
  identifier: string; // NIK or other ID
  type: "employee" | "guest" | "other";
  gender: "Male" | "Female";
  checkInDate: string;
  checkOutDate: string;
  company?: string;
  department?: string;
  notes?: string;
  avatar?: string;
  status: "Checked Out" | "Cancelled" | "Moved";
  companionName?: string;
  companionId?: string;
};

export const columns: ColumnDef<HistoryOccupant>[] = [
  {
    accessorKey: "name",
    header: "Identitas Penghuni",
    cell: ({ row }) => {
      const occupant = row.original;
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={occupant.avatar} />
            <AvatarFallback>
              {occupant.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{occupant.name}</span>
              <Badge 
                variant={occupant.type === 'employee' ? 'default' : occupant.type === 'guest' ? 'secondary' : 'outline'}
                className="text-[10px] h-4 px-1"
              >
                {occupant.type === 'employee' ? 'Karyawan' : occupant.type === 'guest' ? 'Tamu' : 'Lainnya'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{occupant.identifier}</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted">
                <span className={occupant.gender === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
                  {occupant.gender === 'Male' ? 'L' : 'P'}
                </span>
              </div>
            </div>
            
            {/* Companion Info */}
            {occupant.companionName && (
              <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-dashed">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">Pendamping:</span>
                </div>
                <div className="text-xs pl-4">
                  <span className="font-medium">{occupant.companionName}</span>
                  {occupant.companionId && <span className="text-muted-foreground ml-1">({occupant.companionId})</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Organisasi",
    cell: ({ row }) => {
      const { company, department } = row.original;
      
      return (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{company || "-"}</span>
          </div>
          <span className="text-xs text-muted-foreground pl-5">{department || "-"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "checkInDate",
    header: "Periode Inap",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center gap-1.5 text-xs">
          <LogIn className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium">{row.original.checkInDate}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <LogOut className="h-3.5 w-3.5 text-rose-600" />
          <span className="text-muted-foreground">{row.original.checkOutDate}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status & Catatan",
    cell: ({ row }) => {
      const status = row.original.status;
      const notes = row.original.notes;
      
      return (
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-[10px] ${
              status === 'Checked Out' ? 'bg-slate-100 text-slate-700 border-slate-200' :
              status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            {status}
          </Badge>
          
          {/* notes with <Popover> */}
          {notes && (
            <Popover>
              <PopoverTrigger asChild>
                <FileText className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent>
                <p className="max-w-xs text-xs">{notes}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    },
  },
];

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  Clock,
  LogOut,
  MoreVertical,
  Users,
  Building2,
  BedDouble,
  UserCircle,
  ArrowRightLeft,
  User,
} from "lucide-react";
import { Occupant } from "./types";
import { cn } from "@/lib/utils";

interface OccupantItemProps {
  occupant: Occupant;
  onViewProfile: (occupant: Occupant) => void;
  onMove: (occupant: Occupant) => void;
  onCheckout: (occupant: Occupant) => void;
}

export function OccupantItem({
  occupant,
  onViewProfile,
  onMove,
  onCheckout,
}: OccupantItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const typeConfig = {
    employee: {
      label: "Karyawan",
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
      barColor: "bg-blue-500",
    },
    guest: {
      label: "Tamu",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
      barColor: "bg-amber-500",
    },
    other: {
      label: "Lainnya",
      color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400",
      barColor: "bg-slate-400",
    },
  };

  const config = typeConfig[occupant.type] || typeConfig.other;

  return (
    <div className="group relative rounded-lg border bg-card hover:shadow-sm hover:border-primary/20 transition-all duration-200 overflow-hidden">
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 w-1 h-full", config.barColor)} />

      <div className="p-3 pl-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
            <AvatarImage src={occupant.avatar} alt={occupant.name} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {getInitials(occupant.name)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">
                  {occupant.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 font-medium", config.color)}>
                    {config.label}
                  </Badge>
                  {occupant.bedCode && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400">
                      <BedDouble className="h-2.5 w-2.5 mr-0.5" />
                      {occupant.bedCode}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewProfile(occupant)} className="text-xs">
                    <UserCircle className="mr-2 h-3.5 w-3.5" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(occupant)} className="text-xs">
                    <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                    Pindahkan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive text-xs" onClick={() => onCheckout(occupant)}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Check Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Info Grid - Compact */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3 w-3 shrink-0" />
                <span className="truncate">{occupant.identifier}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3 shrink-0" />
                <span>{occupant.gender === "Male" ? "L" : "P"}</span>
              </div>
              
              {/* Company/Department info */}
              {occupant.type === 'employee' ? (
                <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{occupant.company} • {occupant.department}</span>
                </div>
              ) : (
                <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{occupant.company || "-"}</span>
                </div>
              )}
            </div>

            {/* Companion Info - For Guest & Other */}
            {(occupant.type === 'guest' || occupant.type === 'other') && occupant.companionName && (
              <div className="p-2 rounded-md bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">Pendamping</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="ml-1 font-medium text-foreground">{occupant.companionName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NIK:</span>
                    <span className="ml-1 font-medium text-foreground">{occupant.companionId || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Check-in/out - Compact */}
            <div className="flex items-center gap-3 text-[11px] pt-1.5 border-t">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {occupant.checkInDate}
                </span>
              </div>
              {occupant.checkOutDate && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-1.5">
                    <LogOut className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {occupant.checkOutDate}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
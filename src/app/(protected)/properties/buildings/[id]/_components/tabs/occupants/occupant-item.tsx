"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  Clock,
  LogOut,
  MoreVertical,
  Users,
  Building2,
} from "lucide-react";
import { Occupant } from "./types";

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
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={occupant.avatar} />
        <AvatarFallback>{occupant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-none">{occupant.name}</p>
            <Badge 
              variant={occupant.type === 'employee' ? 'default' : occupant.type === 'guest' ? 'secondary' : 'outline'}
              className="text-[10px] h-4 px-1"
            >
              {occupant.type === 'employee' ? 'Karyawan' : occupant.type === 'guest' ? 'Tamu' : 'Lainnya'}
            </Badge>
            {occupant.bedCode && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-muted">
                Bed {occupant.bedCode}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProfile(occupant)}>
                Lihat Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove(occupant)}>
                Pindahkan
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onCheckout(occupant)}
              >
                Check Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" />
            <span>{occupant.identifier}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span>{occupant.gender === "Male" ? "Laki-laki" : "Perempuan"}</span>
          </div>
          
          {occupant.type === 'employee' ? (
            <div className="col-span-2 flex items-center gap-1.5 mt-1">
              <Building2 className="h-3 w-3" />
              <span>{occupant.company} • {occupant.department}</span>
            </div>
          ) : (
            <div className="col-span-2 flex items-center gap-1.5 mt-1">
              <Building2 className="h-3 w-3" />
              <span>{occupant.company || "-"}</span>
            </div>
          )}

          {occupant.companionName && (
            <div className="col-span-2 mt-1 pt-1 border-t border-dashed flex flex-col gap-0.5">
              <span className="text-[10px] font-medium">Pendamping:</span>
              <span>{occupant.companionName} ({occupant.companionId})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Clock className="h-3 w-3" />
            <span>In: {occupant.checkInDate}</span>
          </div>
          {occupant.checkOutDate && (
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <LogOut className="h-3 w-3" />
              <span>Out: {occupant.checkOutDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

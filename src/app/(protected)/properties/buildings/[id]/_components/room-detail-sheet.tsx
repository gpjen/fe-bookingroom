"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  History,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomOccupantsTab } from "./tabs/room-occupants-tab";
import { RoomInfoTab } from "./tabs/room-info-tab";
import { RoomHistoryTab } from "./tabs/room-history-tab";

interface RoomDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    code: string;
    name: string;
    type: string;
    capacity: number;
    occupied: number;
    status: string;
    price: number;
    isMixGender: boolean;
    isBookable: boolean;
    description: string;
  } | null;
  floors: { id: string; name: string }[];
}

export function RoomDetailSheet({
  isOpen,
  onClose,
  room,
  floors,
}: RoomDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("occupants");

  if (!room) return null;

  const isOccupied = room.occupied > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="!max-w-none !w-full md:!w-[500px] lg:!w-[730px] overflow-y-auto px-4"
      >
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                {room.name}
                <Badge variant={room.status === "available" ? "default" : "secondary"}>
                  {room.status}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                {room.code} • {room.type}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="occupants" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="occupants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:block">Penghuni</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:block">Informasi</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden md:block">Riwayat</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: PENGHUNI */}
          <TabsContent value="occupants">
            <RoomOccupantsTab 
              roomId={room.id} 
              capacity={room.capacity} 
              occupied={room.occupied} 
              bedCodes={Array.from({ length: room.capacity }, (_, i) => String.fromCharCode(65 + i))} // ["A", "B", "C", ...]
            />
          </TabsContent>

          {/* TAB: INFORMASI & EDIT */}
          <TabsContent value="info">
            <RoomInfoTab 
              roomId={room.id} 
              isOccupied={isOccupied} 
              initialData={room} 
              floors={floors}
            />
          </TabsContent>

          {/* TAB: RIWAYAT */}
          <TabsContent value="history">
            <RoomHistoryTab roomId={room.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

import type { RoomAvailability, RoomGender, RoomAllocation } from "./room-search-api";

export interface SelectedBed {
  roomId: string;
  roomCode: string;
  bedId: string;
  bedCode: string;
  buildingId: string;
  buildingName: string;
  areaId: string;
  areaName: string;
  roomType: string;
  capacity: number;
  roomGender?: RoomGender;
  roomAllocation?: RoomAllocation;
}

export interface BookingAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

export interface BookingRequestSheetProps {
  trigger?: React.ReactNode;
  searchParams: {
    areaId: string;
    startDate: Date;
    endDate: Date;
    totalPeople: number;
    roomRequirements: { type: string; count: number }[];
  };
  availableRooms: RoomAvailability[];
  selectedBeds: SelectedBed[];
  onClose?: () => void;
  onSuccess?: () => void; // Called after booking is successfully created
}

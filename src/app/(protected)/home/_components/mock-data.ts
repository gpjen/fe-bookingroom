import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";

export type RoomType = "standard" | "vip" | "vvip";
export type RoomAllocation = "employee" | "guest";
export type RoomGender = "male" | "female" | "mix" | "flexible";
export type RoomStatus = "available" | "partial" | "full" | "maintenance";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface Area {
  id: string;
  name: string;
  code: string;
}

export interface Building {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
}

export interface RoomAvailability {
  id: string;
  code: string;
  buildingId: string;
  buildingName: string;
  areaId: string;
  areaName: string;
  floor: number;
  type: RoomType;
  allocation: RoomAllocation;
  gender: RoomGender;
  capacity: number;
  availableBeds: number;
  status: RoomStatus;
  beds: BedAvailability[];
  facilities: string[];
  images: string[];
}

export interface BedAvailability {
  id: string;
  code: string;
  status: BedStatus;
  occupantName?: string;
  occupantCheckIn?: Date;
  occupantCheckOut?: Date;
  reservedFrom?: Date;
  reservedTo?: Date;
}

export const AREAS: Area[] = [
  { id: "area-1", name: "LQ", code: "LQ" },
  { id: "area-2", name: "LQ Center", code: "LQC" },
  { id: "area-3", name: "Tomori", code: "TMR" },
  { id: "area-4", name: "P2", code: "P2" },
];

export const BUILDINGS: Building[] = [
  { id: "b1", name: "Block 11", areaId: "area-1", areaName: "LQ" },
  { id: "b2", name: "Block 12", areaId: "area-1", areaName: "LQ" },
  { id: "b3", name: "Block 3", areaId: "area-2", areaName: "LQ Center" },
  { id: "b4", name: "Block 4", areaId: "area-2", areaName: "LQ Center" },
  { id: "b5", name: "Block C", areaId: "area-3", areaName: "Tomori" },
  { id: "b6", name: "Block D", areaId: "area-3", areaName: "Tomori" },
  { id: "b7", name: "Block A9", areaId: "area-4", areaName: "P2" },
  { id: "b8", name: "Block A10", areaId: "area-4", areaName: "P2" },
];

export const ROOM_TYPES: {
  value: RoomType;
  label: string;
}[] = [
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
];

const FACILITIES = [
  "AC",
  "TV",
  "WiFi",
  "Kamar Mandi Dalam",
  "Lemari",
  "Meja Kerja",
  "Kulkas Mini",
  "Water Heater",
];

export function generateRoomAvailability(): RoomAvailability[] {
  const rooms: RoomAvailability[] = [];

  BUILDINGS.forEach((building) => {
    const roomCount = faker.number.int({ min: 15, max: 25 });

    for (let i = 1; i <= roomCount; i++) {
      const roomCode = `${building.name.replace("Block ", "")}-${i
        .toString()
        .padStart(2, "0")}`;
      const type: RoomType = faker.helpers.arrayElement([
        "standard",
        "standard",
        "standard",
        "vip",
        "vvip",
      ]);
      // Remove category logic

      const capacity =
        type === "vvip"
          ? 1
          : type === "vip"
          ? 2
          : faker.number.int({ min: 2, max: 4 });
      const floor = Math.ceil(i / 8);

      const isRoomMaintenance = Math.random() < 0.05; // 5% chance entire room is maintenance

      const beds: BedAvailability[] = [];
      let availableBeds = 0;

      for (let b = 1; b <= capacity; b++) {
        const bedCode = `B${b}`;
        const rand = Math.random();
        let status: BedStatus = "available";
        let occupantName: string | undefined;
        let occupantCheckIn: Date | undefined;
        let occupantCheckOut: Date | undefined;
        let reservedFrom: Date | undefined;
        let reservedTo: Date | undefined;

        if (isRoomMaintenance) {
          status = "maintenance";
        } else {
          const today = new Date();
          const isOccupied = rand < 0.5;

          if (isOccupied) {
            status = "occupied";
            occupantName = faker.person.fullName();
            occupantCheckIn = subDays(
              today,
              faker.number.int({ min: 1, max: 14 })
            );
            occupantCheckOut = addDays(
              today,
              faker.number.int({ min: 1, max: 14 })
            );
          } else if (rand < 0.65) {
            status = "reserved";
            reservedFrom = addDays(
              new Date(),
              faker.number.int({ min: 1, max: 7 })
            );
            reservedTo = addDays(
              reservedFrom,
              faker.number.int({ min: 3, max: 14 })
            );
          } else {
            availableBeds++;
          }
        }

        beds.push({
          id: faker.string.uuid(),
          code: bedCode,
          status,
          occupantName,
          occupantCheckOut,
          reservedFrom,
          reservedTo,
        });
      }

      let roomStatus: RoomStatus = "available";
      if (isRoomMaintenance) {
        roomStatus = "maintenance";
      } else if (availableBeds === 0) {
        roomStatus = "full";
      } else if (availableBeds < capacity) {
        roomStatus = "partial";
      }

      const facilityCount = type === "vvip" ? 7 : type === "vip" ? 5 : 3;
      const facilities = faker.helpers.arrayElements(FACILITIES, facilityCount);

      rooms.push({
        id: faker.string.uuid(),
        code: roomCode,
        buildingId: building.id,
        buildingName: building.name,
        areaId: building.areaId,
        areaName: building.areaName,
        floor,
        type,
        allocation: faker.helpers.arrayElement(["employee", "guest"]),
        gender: faker.helpers.arrayElement(["male", "female", "mix", "flexible"]),
        images: faker.helpers.arrayElements(
          [
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
            "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
          ],
          faker.number.int({ min: 2, max: 4 })
        ),
        capacity,
        availableBeds,
        status: roomStatus,
        beds,
        facilities,
      });
    }
  });

  return rooms;
}

export const MOCK_ROOMS = generateRoomAvailability();

export function filterRooms(
  rooms: RoomAvailability[],
  filters: {
    areaId?: string;
    buildingId?: string;
    type?: RoomType;
    onlyAvailable?: boolean;
  }
): RoomAvailability[] {
  return rooms.filter((room) => {
    if (filters.areaId && room.areaId !== filters.areaId) return false;
    if (filters.buildingId && room.buildingId !== filters.buildingId)
      return false;
    if (filters.type && room.type !== filters.type) return false;
    if (filters.onlyAvailable && room.availableBeds === 0) return false;
    return true;
  });
}

import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";

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
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  status: "active" | "maintenance" | "inactive";
}

export interface Room {
  id: string;
  code: string;
  buildingId: string;
  buildingName: string;
  floor: number;
  capacity: number;
  beds: Bed[];
}

export interface Bed {
  id: string;
  code: string;
  roomId: string;
  roomCode: string;
  buildingId: string;
  buildingName: string;
  areaId: string;
  areaName: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  occupant?: BedOccupant;
}

export interface BedOccupant {
  id: string;
  name: string;
  identifier: string;
  type: "employee" | "guest";
  gender: "L" | "P";
  company: string;
  department?: string;
  checkInDate: Date;
  checkOutDate?: Date;
  companionName?: string;
  companionNik?: string;
}

// Areas
export const AREAS: Area[] = [
  { id: "area-1", name: "LQ", code: "LQ" },
  { id: "area-2", name: "LQ Center", code: "LQC" },
  { id: "area-3", name: "Tomori", code: "TMR" },
  { id: "area-4", name: "P2", code: "P2" },
];

// Buildings
export const MOCK_BUILDINGS: Building[] = [
  {
    id: "b1",
    name: "Block 11",
    areaId: "area-1",
    areaName: "LQ",
    totalRooms: 20,
    totalBeds: 80,
    occupiedBeds: 65,
    status: "active",
  },
  {
    id: "b2",
    name: "Block 12",
    areaId: "area-1",
    areaName: "LQ",
    totalRooms: 20,
    totalBeds: 80,
    occupiedBeds: 72,
    status: "active",
  },
  {
    id: "b3",
    name: "Block 3",
    areaId: "area-2",
    areaName: "LQ Center",
    totalRooms: 15,
    totalBeds: 60,
    occupiedBeds: 45,
    status: "active",
  },
  {
    id: "b4",
    name: "Block 4",
    areaId: "area-2",
    areaName: "LQ Center",
    totalRooms: 15,
    totalBeds: 60,
    occupiedBeds: 58,
    status: "active",
  },
  {
    id: "b5",
    name: "Block C",
    areaId: "area-3",
    areaName: "Tomori",
    totalRooms: 25,
    totalBeds: 100,
    occupiedBeds: 78,
    status: "active",
  },
  {
    id: "b6",
    name: "Block D",
    areaId: "area-3",
    areaName: "Tomori",
    totalRooms: 25,
    totalBeds: 100,
    occupiedBeds: 92,
    status: "active",
  },
  {
    id: "b7",
    name: "Block A9",
    areaId: "area-4",
    areaName: "P2",
    totalRooms: 30,
    totalBeds: 120,
    occupiedBeds: 95,
    status: "active",
  },
  {
    id: "b8",
    name: "Block A10",
    areaId: "area-4",
    areaName: "P2",
    totalRooms: 30,
    totalBeds: 120,
    occupiedBeds: 110,
    status: "active",
  },
];

const COMPANIES = [
  "PT. Dharma Cipta Mulia",
  "PT. Halmahera Persada Lygend",
  "PT. Obi Nickel Cobalt",
  "PT. Obi Sinar Timur",
];
const DEPARTMENTS = [
  "Operations",
  "Engineering",
  "HR & GA",
  "Safety",
  "IT",
  "Plant Maintenance",
  "Mining",
];

// Generate mock beds with occupants
export function generateMockBeds(): Bed[] {
  const beds: Bed[] = [];

  MOCK_BUILDINGS.forEach((building) => {
    const bedsPerRoom = Math.ceil(building.totalBeds / building.totalRooms);
    let occupiedCount = 0;

    for (let room = 1; room <= building.totalRooms; room++) {
      const roomCode = `${building.name.replace("Block ", "")}-${room
        .toString()
        .padStart(2, "0")}`;
      const area = AREAS.find((a) => a.id === building.areaId);

      for (let bed = 1; bed <= bedsPerRoom; bed++) {
        const bedCode = `${roomCode}-B${bed}`;
        const isOccupied = occupiedCount < building.occupiedBeds;
        const isReserved = !isOccupied && Math.random() > 0.85;
        const isMaintenance =
          !isOccupied && !isReserved && Math.random() > 0.95;

        let occupant: BedOccupant | undefined;
        if (isOccupied) {
          const type = Math.random() > 0.8 ? "guest" : "employee";
          const checkInDate = subDays(
            new Date(),
            faker.number.int({ min: 1, max: 60 })
          );
          const checkOutDate =
            Math.random() > 0.3
              ? addDays(new Date(), faker.number.int({ min: 1, max: 90 }))
              : undefined;

          occupant = {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            identifier:
              type === "employee"
                ? `D${faker.string.numeric(8)}`
                : faker.string.numeric(16),
            type,
            gender: faker.person.sex() === "male" ? "L" : "P",
            company: faker.helpers.arrayElement(COMPANIES),
            department:
              type === "employee"
                ? faker.helpers.arrayElement(DEPARTMENTS)
                : undefined,
            checkInDate,
            checkOutDate,
            companionName:
              type === "guest" ? faker.person.fullName() : undefined,
            companionNik:
              type === "guest" ? `D${faker.string.numeric(8)}` : undefined,
          };
          occupiedCount++;
        }

        beds.push({
          id: faker.string.uuid(),
          code: bedCode,
          roomId: `room-${building.id}-${room}`,
          roomCode,
          buildingId: building.id,
          buildingName: building.name,
          areaId: building.areaId,
          areaName: area?.name || "",
          status: isOccupied
            ? "occupied"
            : isReserved
            ? "reserved"
            : isMaintenance
            ? "maintenance"
            : "available",
          occupant,
        });
      }
    }
  });

  return beds;
}

export const MOCK_BEDS = generateMockBeds();

// Stats helpers
export function getOccupancyStats() {
  const totalBeds = MOCK_BUILDINGS.reduce((acc, b) => acc + b.totalBeds, 0);
  const occupiedBeds = MOCK_BUILDINGS.reduce(
    (acc, b) => acc + b.occupiedBeds,
    0
  );
  const reservedBeds = MOCK_BEDS.filter((b) => b.status === "reserved").length;
  const maintenanceBeds = MOCK_BEDS.filter(
    (b) => b.status === "maintenance"
  ).length;
  const availableBeds =
    totalBeds - occupiedBeds - reservedBeds - maintenanceBeds;

  return {
    totalBeds,
    occupiedBeds,
    reservedBeds,
    maintenanceBeds,
    availableBeds,
    occupancyRate: Math.round((occupiedBeds / totalBeds) * 100),
  };
}

export function getAreaStats() {
  return AREAS.map((area) => {
    const buildings = MOCK_BUILDINGS.filter((b) => b.areaId === area.id);
    const totalBeds = buildings.reduce((acc, b) => acc + b.totalBeds, 0);
    const occupiedBeds = buildings.reduce((acc, b) => acc + b.occupiedBeds, 0);

    return {
      ...area,
      totalBuildings: buildings.length,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate:
        totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    };
  });
}

export function getBuildingStats(areaId?: string) {
  const buildings = areaId
    ? MOCK_BUILDINGS.filter((b) => b.areaId === areaId)
    : MOCK_BUILDINGS;

  return buildings.map((building) => ({
    ...building,
    availableBeds: building.totalBeds - building.occupiedBeds,
    occupancyRate: Math.round(
      (building.occupiedBeds / building.totalBeds) * 100
    ),
  }));
}

export function getUpcomingCheckouts(days: number = 7) {
  const now = new Date();
  const futureDate = addDays(now, days);

  return MOCK_BEDS.filter((bed) => {
    if (!bed.occupant?.checkOutDate) return false;
    return (
      bed.occupant.checkOutDate >= now &&
      bed.occupant.checkOutDate <= futureDate
    );
  })
    .map((bed) => ({
      ...bed,
      occupant: bed.occupant!,
    }))
    .sort(
      (a, b) =>
        a.occupant.checkOutDate!.getTime() - b.occupant.checkOutDate!.getTime()
    );
}

export function getRecentCheckins(days: number = 7) {
  const now = new Date();
  const pastDate = subDays(now, days);

  return MOCK_BEDS.filter((bed) => {
    if (!bed.occupant?.checkInDate) return false;
    return (
      bed.occupant.checkInDate >= pastDate && bed.occupant.checkInDate <= now
    );
  })
    .map((bed) => ({
      ...bed,
      occupant: bed.occupant!,
    }))
    .sort(
      (a, b) =>
        b.occupant.checkInDate.getTime() - a.occupant.checkInDate.getTime()
    );
}

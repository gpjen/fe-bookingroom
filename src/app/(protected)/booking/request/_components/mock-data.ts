import { addDays, subDays } from "date-fns";
import { BookingRequest, BookingStatus, Occupant } from "./types";

// --- MOCK DATABASE ---

export const MOCK_AREAS = [
  { id: "area-1", name: "Kawasan Industri" },
  { id: "area-2", name: "Pusat Kota" },
  { id: "area-3", name: "Area Pantai" },
];

export const MOCK_BUILDINGS = [
  { id: "bldg-a", name: "Gedung A (Pria)", areaId: "area-1" },
  { id: "bldg-b", name: "Gedung B (Wanita)", areaId: "area-1" },
  { id: "bldg-c", name: "Menara C (Campur)", areaId: "area-2" },
  { id: "bldg-d", name: "Wisma D (VIP)", areaId: "area-2" },
  { id: "bldg-e", name: "Villa E (Keluarga)", areaId: "area-3" },
];

export const MOCK_ROOMS = [
  // Building A
  { id: "room-a101", name: "Kamar A101", buildingId: "bldg-a" },
  { id: "room-a102", name: "Kamar A102", buildingId: "bldg-a" },
  // Building B
  { id: "room-b101", name: "Kamar B101", buildingId: "bldg-b" },
  // Building C
  { id: "room-c201", name: "Kamar C201 (2 bed)", buildingId: "bldg-c" },
  { id: "room-c202", name: "Kamar C202 (2 bed)", buildingId: "bldg-c" },
  // Building D
  { id: "room-d301", name: "Suite D301", buildingId: "bldg-d" },
];

export const MOCK_BEDS = [
  // Room A101
  { id: "bed-a101-1", name: "Bed 1", roomId: "room-a101" },
  // Room A102
  { id: "bed-a102-1", name: "Bed 1", roomId: "room-a102" },
  // Room B101
  { id: "bed-b101-1", name: "Bed 1", roomId: "room-b101" },
  // Room C201
  { id: "bed-c201-1", name: "Bed 1", roomId: "room-c201" },
  { id: "bed-c201-2", name: "Bed 2", roomId: "room-c201" },
  // Room C202
  { id: "bed-c202-1", name: "Bed 1", roomId: "room-c202" },
  { id: "bed-c202-2", name: "Bed 2", roomId: "room-c202" },
  // Room D301
  { id: "bed-d301-1", name: "A1", roomId: "room-d301" },
];

const MOCK_USERS = [
  {
    name: "Budi Santoso",
    nik: "123456789",
    email: "budi.santoso@example.com",
    phone: "081234567890",
    company: "PT. Maju Mundur",
    department: "IT",
  },
  {
    name: "Siti Aminah",
    nik: "987654321",
    email: "siti.aminah@example.com",
    phone: "089876543210",
    company: "CV. Sejahtera",
    department: "HR",
  },
];

const MOCK_PURPOSES = [
  "Kunjungan Dinas",
  "Pelatihan Karyawan",
  "Meeting Proyek",
  "Acara Perusahaan",
];

const STATUSES: BookingStatus[] = [
  "request",
  "approved",
  "rejected",
  "cancelled",
  "checkin",
  "checkout",
];

// --- MOCK GENERATORS ---

const generateMockOccupants = (count: number): Occupant[] => {
  const occupants: Occupant[] = [];
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? "L" : "P";
    occupants.push({
      id: `occ-${Date.now()}-${i}`,
      name: `Tamu ${i + 1}`,
      identifier: `KTP-000${i + 1}`,
      type: "guest",
      gender,
      department: "Guest",
      company: "External",
    });
  }
  return occupants;
};

const generateMockBookingRequests = (count: number): BookingRequest[] => {
  const requests: BookingRequest[] = [];

  for (let i = 0; i < count; i++) {
    const requester = MOCK_USERS[i % MOCK_USERS.length];

    // Have some requests without a specific building
    const requestSpecificBuilding = Math.random() > 0.3;
    const building = requestSpecificBuilding
      ? MOCK_BUILDINGS[i % MOCK_BUILDINGS.length]
      : undefined;
    const area = building
      ? MOCK_AREAS.find((a) => a.id === building.areaId)!
      : MOCK_AREAS[i % MOCK_AREAS.length];

    const status = STATUSES[i % STATUSES.length];
    const checkInDate = addDays(new Date(), Math.floor(Math.random() * 10) - 5);
    const durationInDays = Math.floor(Math.random() * 7) + 1;
    const checkOutDate = addDays(checkInDate, durationInDays);
    const occupants = generateMockOccupants(Math.floor(Math.random() * 2) + 1);

    const booking: BookingRequest = {
      id: `book-${i + 1}`,
      bookingCode: `BK-00${i + 1}`,
      requester,
      occupants,
      requestedLocation: {
        areaId: area.id,
        areaName: area.name,
        buildingId: building?.id,
        buildingName: building?.name,
      },
      placements: [],
      checkInDate,
      checkOutDate,
      durationInDays,
      status,
      purpose: MOCK_PURPOSES[i % MOCK_PURPOSES.length],
      notes: i % 3 === 0 ? "Mohon diproses segera." : undefined,
      requestedAt: subDays(new Date(), Math.floor(Math.random() * 5)),
    };

    // Add approval and placement data for bookings that are past the 'request' state
    if (
      status !== "request" &&
      status !== "rejected" &&
      status !== "cancelled"
    ) {
      booking.approvedAt = subDays(new Date(), Math.floor(Math.random() * 2));
      booking.approvedBy = "Manager HR";
      booking.placements = occupants.map((occ, index) => {
        const room = MOCK_ROOMS[index % MOCK_ROOMS.length];
        const buildingForPlacement = MOCK_BUILDINGS.find(
          (b) => b.id === room.buildingId
        )!;
        return {
          occupantId: occ.id,
          areaId: buildingForPlacement.areaId,
          buildingId: room.buildingId,
          roomId: room.id,
          bedId: `bed-${index + 1}`,
        };
      });
    }

    if (status === "rejected") {
      booking.adminNotes = "Ruangan tidak tersedia pada tanggal yang diminta.";
    }

    requests.push(booking);
  }

  return requests;
};

export const MOCK_BOOKING_REQUESTS = generateMockBookingRequests(25);

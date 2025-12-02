import { BookingRequest } from "./types";
import { addDays, subDays } from "date-fns";

const MOCK_AREAS = [
  { id: "area1", name: "Area Utara" },
  { id: "area2", name: "Area Selatan" },
  { id: "area3", name: "Area Timur" },
];

const MOCK_BUILDINGS = [
  { id: "b1", name: "Gedung Utama", areaId: "area1" },
  { id: "b2", name: "Gedung Annex", areaId: "area1" },
  { id: "b3", name: "Menara Kembar A", areaId: "area2" },
  { id: "b4", name: "Menara Kembar B", areaId: "area2" },
  { id: "b5", name: "Gedung Parkir", areaId: "area3" },
];

const MOCK_ROOMS = [
  { id: "r1", name: "Kamar 101", buildingId: "b1" },
  { id: "r2", name: "Kamar 102", buildingId: "b1" },
  { id: "r3", name: "Kamar 201", buildingId: "b2" },
  { id: "r4", name: "Kamar 301", buildingId: "b3" },
  { id: "r5", name: "Kamar 401", buildingId: "b4" },
];

const MOCK_REQUESTERS = [
  {
    name: "Budi Santoso",
    nik: "EMP001",
    email: "budi@example.com",
    phone: "081234567890",
    company: "PT. Dharma Cipta Mulia",
    department: "IT",
  },
  {
    name: "Siti Aminah",
    nik: "EMP002",
    email: "siti@example.com",
    phone: "081234567891",
    company: "PT. Halmahera Persada Lygend",
    department: "HR",
  },
  {
    name: "Andi Wijaya",
    nik: "EMP003",
    email: "andi@example.com",
    phone: "081234567892",
    company: "CV. Obi Nickel Sulfat",
    department: "Finance",
  },
  {
    name: "Dewi Lestari",
    nik: "EMP004",
    email: "dewi@example.com",
    phone: "081234567893",
    company: "PT. Dharma Cipta Mulia",
    department: "Operations",
  },
  {
    name: "Rudi Hartono",
    nik: "EMP005",
    email: "rudi@example.com",
    phone: "081234567894",
    company: "PT. Halmahera Persada Lygend",
    department: "Engineering",
  },
];

const MOCK_PURPOSES = [
  "Kunjungan kerja",
  "Training karyawan",
  "Meeting dengan klien",
  "Audit internal",
  "Maintenance peralatan",
  "Perjalanan dinas",
  "Koordinasi proyek",
];

export const generateMockBookingRequests = (
  count: number
): BookingRequest[] => {
  const statuses: BookingRequest["status"][] = [
    "request",
    "request",
    "request",
    "approved",
    "approved",
    "checkin",
    "checkout",
    "rejected",
    "cancelled",
  ];
  const bookingTypes: BookingRequest["bookingType"][] = [
    "employee",
    "employee",
    "guest",
    "others",
  ];

  function generateBookingCodeSimple(increment: number) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${random}${increment}`;
  }

  return Array.from({ length: count }).map((_, i) => {
    const requester = MOCK_REQUESTERS[i % MOCK_REQUESTERS.length];
    const building = MOCK_BUILDINGS[i % MOCK_BUILDINGS.length];
    const room = MOCK_ROOMS[i % MOCK_ROOMS.length];
    const area = MOCK_AREAS.find((a) => a.id === building.areaId)!;
    const status = statuses[i % statuses.length];
    const bookingType = bookingTypes[i % bookingTypes.length];

    const checkInDate = addDays(
      new Date(),
      Math.floor(Math.random() * 30) - 10
    );
    const duration = Math.floor(Math.random() * 7) + 1;
    const checkOutDate = addDays(checkInDate, duration);

    const booking: BookingRequest = {
      id: `booking-${i + 1}`,
      bookingCode: generateBookingCodeSimple(i + 1),
      requester,
      bookingType,
      area: area.name,
      building: building.name,
      buildingId: building.id,
      room: room.name,
      roomId: room.id,
      bedCode:
        bookingType === "employee"
          ? `BED-${String(i + 1).padStart(2, "0")}`
          : undefined,
      checkInDate,
      checkOutDate,
      duration,
      status,
      purpose: MOCK_PURPOSES[i % MOCK_PURPOSES.length],
      notes: i % 3 === 0 ? "Mohon diproses segera" : undefined,
      requestedAt: subDays(new Date(), Math.floor(Math.random() * 5)),
    };

    // Add guest info for guest bookings
    if (bookingType === "guest" || bookingType === "others") {
      booking.guestInfo = {
        name: "John Doe",
        idNumber: "3174012345678901",
        phone: "081298765432",
        company: "PT. External Partner",
        gender: i % 2 === 0 ? "L" : "P",
      };
    }

    // Add approval data based on status
    if (
      status === "approved" ||
      status === "checkin" ||
      status === "checkout"
    ) {
      booking.approvedAt = subDays(new Date(), Math.floor(Math.random() * 2));
      booking.approvedBy = "Manager HR";
    }

    if (status === "rejected") {
      booking.adminNotes = "Ruangan tidak tersedia pada tanggal yang diminta";
    }

    return booking;
  });
};

export const MOCK_BOOKING_REQUESTS = generateMockBookingRequests(25);

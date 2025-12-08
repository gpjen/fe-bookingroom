import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";
import type {
  BookingOccupant,
  OccupantStatus,
  BookingType,
  Gender,
} from "../../request/_components/types";

const COMPANIES = [
  "PT. Dharma Cipta Mulia",
  "PT. Halmahera Persada Lygend",
  "PT. Obi Nickel Cobalt",
];

const DEPARTMENTS = [
  "Operations",
  "Engineering",
  "HR & GA",
  "Safety",
  "Information and Technology",
];

export const BUILDINGS = [
  { id: "b1", name: "Block 11", areaId: "area-1", area: "LQ" },
  { id: "b2", name: "Block 3", areaId: "area-2", area: "LQ Center" },
  { id: "b3", name: "Block C", areaId: "area-3", area: "Tomori" },
  { id: "b4", name: "Block A9", areaId: "area-4", area: "P2" },
];

export const ROOMS = [
  { id: "r1", code: "101", name: "Room 101", buildingId: "b1", capacity: 4 },
  { id: "r2", code: "102", name: "Room 102", buildingId: "b1", capacity: 4 },
  { id: "r3", code: "201", name: "Room 201", buildingId: "b2", capacity: 2 },
  { id: "r4", code: "202", name: "Room 202", buildingId: "b2", capacity: 2 },
  { id: "r5", code: "301", name: "Room 301", buildingId: "b3", capacity: 4 },
  { id: "r6", code: "302", name: "Room 302", buildingId: "b3", capacity: 4 },
  { id: "r7", code: "401", name: "Room 401", buildingId: "b4", capacity: 2 },
  { id: "r8", code: "402", name: "Room 402", buildingId: "b4", capacity: 2 },
];

export const BEDS = [
  { id: "bed1", code: "A", name: "Bed A", roomId: "r1" },
  { id: "bed2", code: "B", name: "Bed B", roomId: "r1" },
  { id: "bed3", code: "C", name: "Bed C", roomId: "r1" },
  { id: "bed4", code: "D", name: "Bed D", roomId: "r1" },
  { id: "bed5", code: "A", name: "Bed A", roomId: "r2" },
  { id: "bed6", code: "B", name: "Bed B", roomId: "r2" },
  { id: "bed7", code: "A", name: "Bed A", roomId: "r3" },
  { id: "bed8", code: "B", name: "Bed B", roomId: "r3" },
  { id: "bed9", code: "A", name: "Bed A", roomId: "r4" },
  { id: "bed10", code: "B", name: "Bed B", roomId: "r4" },
  { id: "bed11", code: "A", name: "Bed A", roomId: "r5" },
  { id: "bed12", code: "B", name: "Bed B", roomId: "r5" },
  { id: "bed13", code: "A", name: "Bed A", roomId: "r6" },
  { id: "bed14", code: "B", name: "Bed B", roomId: "r6" },
  { id: "bed15", code: "A", name: "Bed A", roomId: "r7" },
  { id: "bed16", code: "B", name: "Bed B", roomId: "r7" },
  { id: "bed17", code: "A", name: "Bed A", roomId: "r8" },
  { id: "bed18", code: "B", name: "Bed B", roomId: "r8" },
];

// Extended occupant type with booking info for the list
export interface OccupantWithBooking extends BookingOccupant {
  bookingId: string;
  bookingCode: string;

  // Requester Details
  requesterName: string;
  requesterNik: string;
  requesterDepartment: string;
  requesterCompany: string;
  requesterEmail: string;
  requesterPhone: string;

  // Companion Info (for guests)
  companionName?: string;
  companionNik?: string;
  companionPhone?: string;
  companionCompany?: string;
  companionDepartment?: string;
}

// Generate bookings with multiple occupants (more realistic)
export function generateMockApprovedOccupants(
  bookingCount: number
): OccupantWithBooking[] {
  const allOccupants: OccupantWithBooking[] = [];
  const today = new Date();

  for (let i = 0; i < bookingCount; i++) {
    // Each booking has 1-3 occupants
    const occupantCount = faker.number.int({ min: 1, max: 3 });
    const bookingId = faker.string.uuid();
    const bookingCode = `REQ-${faker.string.alphanumeric(6).toUpperCase()}`;
    const requesterName = faker.person.fullName();
    const requesterNik = `${faker.string
      .fromCharacters("DLC")
      .substring(0, 1)}${faker.string.numeric(8)}`;
    const requesterDepartment = faker.helpers.arrayElement(DEPARTMENTS);
    const requesterCompany = faker.helpers.arrayElement(COMPANIES);
    const requesterEmail = faker.internet.email({
      firstName: requesterName.split(" ")[0],
    });
    const requesterPhone = faker.phone.number();

    // Random companion for the booking (nullable)
    const hasCompanion = Math.random() > 0.5;
    const companionName = hasCompanion ? faker.person.fullName() : undefined;
    const companionNik = hasCompanion ? faker.string.numeric(8) : undefined;
    const companionPhone = hasCompanion ? faker.phone.number() : undefined;
    const companionDepartment = hasCompanion
      ? faker.helpers.arrayElement(DEPARTMENTS)
      : undefined;
    const companionCompany = hasCompanion
      ? faker.helpers.arrayElement(COMPANIES)
      : undefined;

    // Shared booking dates for all occupants in same booking
    const baseInDate = addDays(today, faker.number.int({ min: -10, max: 14 }));
    const baseDuration = faker.number.int({ min: 2, max: 14 });
    const baseOutDate = addDays(baseInDate, baseDuration);

    for (let j = 0; j < occupantCount; j++) {
      const type: BookingType = Math.random() > 0.7 ? "guest" : "employee";
      const gender: Gender = faker.person.sex() === "male" ? "L" : "P";

      // Occupant status - weighted towards scheduled for demo
      const statusWeights: { status: OccupantStatus; weight: number }[] = [
        { status: "scheduled", weight: 40 },
        { status: "checked_in", weight: 35 },
        { status: "checked_out", weight: 20 },
        { status: "cancelled", weight: 5 },
      ];

      const totalWeight = statusWeights.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      let status: OccupantStatus = "scheduled";

      for (const sw of statusWeights) {
        random -= sw.weight;
        if (random <= 0) {
          status = sw.status;
          break;
        }
      }

      // Adjust dates based on status
      let inDate = baseInDate;
      let outDate = baseOutDate;
      let actualCheckInAt: Date | undefined;
      let actualCheckOutAt: Date | undefined;

      if (status === "checked_out") {
        inDate = subDays(today, faker.number.int({ min: 5, max: 20 }));
        const duration = faker.number.int({ min: 2, max: 7 });
        outDate = addDays(inDate, duration);
        actualCheckInAt = addDays(inDate, faker.number.int({ min: 0, max: 1 }));
        actualCheckOutAt = subDays(
          outDate,
          faker.number.int({ min: 0, max: 1 })
        );
      } else if (status === "checked_in") {
        inDate = subDays(today, faker.number.int({ min: 1, max: 5 }));
        const duration = faker.number.int({ min: 3, max: 14 });
        outDate = addDays(inDate, duration);
        actualCheckInAt = addDays(inDate, faker.number.int({ min: 0, max: 1 }));
      } else if (status === "scheduled") {
        inDate = addDays(today, faker.number.int({ min: -1, max: 7 }));
        const duration = faker.number.int({ min: 2, max: 14 });
        outDate = addDays(inDate, duration);
      }

      // Location assignment
      const building = faker.helpers.arrayElement(BUILDINGS);
      const buildingRooms = ROOMS.filter((r) => r.buildingId === building.id);
      const room = faker.helpers.arrayElement(buildingRooms);
      const roomBeds = BEDS.filter((b) => b.roomId === room.id);
      const bed = faker.helpers.arrayElement(roomBeds);

      allOccupants.push({
        id: faker.string.uuid(),
        bookingId,
        bookingCode,

        // Requester
        requesterName,
        requesterNik,
        requesterDepartment,
        requesterCompany,
        requesterEmail,
        requesterPhone,

        // Companion (only relevant if occupant is guest, but we populate from booking)
        companionName: type === "guest" ? companionName : undefined,
        companionNik: type === "guest" ? companionNik : undefined,
        companionPhone: type === "guest" ? companionPhone : undefined,
        companionDepartment: type === "guest" ? companionDepartment : undefined,
        companionCompany: type === "guest" ? companionCompany : undefined,

        name: faker.person.fullName(),
        identifier:
          type === "employee"
            ? `${faker.string
                .fromCharacters("DLC")
                .substring(0, 1)}${faker.string.numeric(8)}`
            : faker.string.numeric(16),
        type,
        gender,
        phone: faker.phone.number(),
        email: faker.internet.email(),
        company: faker.helpers.arrayElement(COMPANIES),
        department:
          type === "employee"
            ? faker.helpers.arrayElement(DEPARTMENTS)
            : undefined,

        status,
        cancelledAt:
          status === "cancelled"
            ? subDays(today, faker.number.int({ min: 1, max: 5 }))
            : undefined,
        cancelledReason:
          status === "cancelled" ? "Perubahan jadwal" : undefined,
        cancelledBy: status === "cancelled" ? requesterName : undefined,

        inDate,
        outDate,
        duration: Math.ceil(
          (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)
        ),

        actualCheckInAt,
        actualCheckOutAt,

        areaId: building.areaId,
        areaName: building.area,
        buildingId: building.id,
        buildingName: building.name,
        roomId: room.id,
        roomCode: room.code,
        bedId: bed.id,
        bedCode: bed.code,
      });
    }
  }

  // Add Fixed Test Occupants (for QR Testing stability)
  const fixedTestOccupants: OccupantWithBooking[] = [
    {
      // 1. Scheduled Object (Ready to Check-in)
      id: "fixed-test-scheduled-id",
      bookingId: "fixed-booking-1",
      bookingCode: "TEST-SCH",
      requesterName: "Test Requester 1",
      requesterNik: "D12345678",
      requesterDepartment: "IT",
      requesterCompany: "PT. Test",
      requesterEmail: "test1@example.com",
      requesterPhone: "081234567890",
      name: "Test User Scheduled",
      identifier: "KTP1234567890",
      type: "guest",
      gender: "L",
      phone: "081234567891",
      email: "guest1@example.com",
      company: "Guest Co",
      status: "scheduled",
      inDate: addDays(today, -1), // Yesterday (late checkin) or today
      outDate: addDays(today, 2),
      duration: 3,
      areaId: "area-1",
      areaName: "LQ",
      buildingId: "b1",
      buildingName: "Block Test",
      roomId: "r1",
      roomCode: "101",
      bedId: "bed1",
      bedCode: "A",
    },
    {
      // 2. Checked-In Object (Ready to Check-out)
      id: "fixed-test-checked-in-id",
      bookingId: "fixed-booking-2",
      bookingCode: "TEST-IN",
      requesterName: "Test Requester 2",
      requesterNik: "D87654321",
      requesterDepartment: "HR",
      requesterCompany: "PT. Test",
      requesterEmail: "test2@example.com",
      requesterPhone: "081234567892",
      name: "Test User CheckedIn",
      identifier: "NIK87654321",
      type: "employee",
      gender: "P",
      phone: "081234567893",
      email: "emp2@example.com",
      company: "PT. Test",
      department: "HR",
      status: "checked_in",
      inDate: subDays(today, 2),
      outDate: today, // Today is checkout day
      duration: 2,
      actualCheckInAt: subDays(today, 2),
      areaId: "area-1",
      areaName: "LQ",
      buildingId: "b1",
      buildingName: "Block Test",
      roomId: "r1",
      roomCode: "101",
      bedId: "bed2",
      bedCode: "B",
    },
    {
      // 3. Checked-In Object (Not Ready - Future Checkout)
      id: "fixed-test-future-checkout-id",
      bookingId: "fixed-booking-3",
      bookingCode: "TEST-FUTURE",
      requesterName: "Test Requester 3",
      requesterNik: "D11223344",
      requesterDepartment: "Safety",
      requesterCompany: "PT. Test",
      requesterEmail: "test3@example.com",
      requesterPhone: "081234567894",
      name: "Test User Future",
      identifier: "NIK11223344",
      type: "employee",
      gender: "L",
      status: "checked_in",
      inDate: subDays(today, 1),
      outDate: addDays(today, 5), // Future checkout
      duration: 6,
      actualCheckInAt: subDays(today, 1),
      areaId: "area-1",
      areaName: "LQ",
      buildingId: "b1",
      buildingName: "Block Test",
      roomId: "r1",
      roomCode: "101",
      bedId: "bed3",
      bedCode: "C",
    },
  ];

  return [...fixedTestOccupants, ...allOccupants];
}

export const MOCK_APPROVED_OCCUPANTS = generateMockApprovedOccupants(30);

import { faker } from "@faker-js/faker";
import { addDays, subDays } from "date-fns";
import {
  BookingRequest,
  BookingStatus,
  BookingType,
  BookingOccupant,
  OccupantStatus,
  Gender,
} from "./types";

const MOCK_PURPOSES = [
  "Perjalanan Dinas ke Site A",
  "Meeting Project X",
  "Audit Tahunan",
  "Instalasi Mesin Baru",
  "Penempatan Karyawan Baru",
];

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

// Mock rooms per building
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

// Mock beds per room
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

export function generateMockBookingRequests(count: number): BookingRequest[] {
  return Array.from({ length: count }).map(() => {
    const requesterName = faker.person.fullName();
    const requesterNik = `${faker.string
      .fromCharacters("DLC")
      .substring(0, 1)}${faker.string.numeric(8)}`;

    // Determine status
    const statuses: BookingStatus[] = [
      "request",
      "approved",
      "rejected",
      "cancelled",
      "expired",
    ];
    const status = faker.helpers.arrayElement(statuses);

    // Generate Occupants
    const occupantsCount = faker.number.int({ min: 1, max: 4 });
    const occupants: BookingOccupant[] = Array.from({
      length: occupantsCount,
    })
      .map(() => {
        const type: BookingType = Math.random() > 0.7 ? "guest" : "employee";
        const gender: Gender = faker.person.sex() === "male" ? "L" : "P";
        
        // Requester can optionally set building/room/bed when submitting request
        // For approved/cancelled/expired: always have location (admin assigns or keeps requester's choice)
        // For request/rejected: random chance (simulates requester optionally setting location)
        const hasRequestedLocation = Math.random() > 0.3; // 70% chance requester sets location
        const shouldHaveLocation = 
          status === "approved" || 
          status === "cancelled" || 
          status === "expired" || 
          hasRequestedLocation;

        // Determine occupant status based on booking status
        let occStatus: OccupantStatus = "scheduled";
        if (status === "approved") {
          occStatus = faker.helpers.arrayElement([
            "scheduled",
            "checked_in",
            "checked_out",
          ]);
        } else if (status === "cancelled") {
          occStatus = "cancelled";
        }

        // Per-occupant dates
        const occCheckInDate = addDays(
          new Date(),
          faker.number.int({ min: -10, max: 60 })
        );
        const occDuration = faker.number.int({ min: 1, max: 14 });
        const occCheckOutDate = addDays(occCheckInDate, occDuration);

        // Per-occupant location assignment
        const assignedBuilding = faker.helpers.arrayElement(BUILDINGS);
        const buildingRooms = ROOMS.filter((r) => r.buildingId === assignedBuilding.id);
        const assignedRoom = buildingRooms.length > 0 ? faker.helpers.arrayElement(buildingRooms) : null;
        const roomBeds = assignedRoom ? BEDS.filter((b) => b.roomId === assignedRoom.id) : [];
        const assignedBed = roomBeds.length > 0 ? faker.helpers.arrayElement(roomBeds) : null;

        return {
          id: faker.string.uuid(),
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
          company: faker.helpers.arrayElement(COMPANIES),
          department:
            type === "employee"
              ? faker.helpers.arrayElement(DEPARTMENTS)
              : undefined,

          // Companion will be set for guests
          companion: undefined,

          status: occStatus,

          // Planned stay dates
          inDate: occCheckInDate,
          outDate: occCheckOutDate,
          duration: occDuration,

          // Actual timestamps (only if checked in/out)
          actualCheckInAt:
            occStatus === "checked_in" || occStatus === "checked_out"
              ? addDays(occCheckInDate, faker.number.int({ min: 0, max: 1 }))
              : undefined,
          actualCheckOutAt:
            occStatus === "checked_out"
              ? addDays(occCheckOutDate!, faker.number.int({ min: -1, max: 0 }))
              : undefined,

          // Location assignment - can be set by requester (optional) or admin (on approval)
          areaId: shouldHaveLocation ? assignedBuilding.areaId : undefined,
          areaName: shouldHaveLocation ? assignedBuilding.area : undefined,
          buildingId: shouldHaveLocation ? assignedBuilding.id : undefined,
          buildingName: shouldHaveLocation ? assignedBuilding.name : undefined,
          roomId: shouldHaveLocation && assignedRoom ? assignedRoom.id : undefined,
          roomCode: shouldHaveLocation && assignedRoom ? assignedRoom.code : undefined,
          bedId: shouldHaveLocation && assignedBed ? assignedBed.id : undefined,
          bedCode: shouldHaveLocation && assignedBed ? assignedBed.code : undefined,
        };
      });

    // Check if any guest occupants exist - if so, create companion info at booking level
    const hasGuests = occupants.some((occ) => occ.type === "guest");
    
    let bookingCompanion = undefined;
    if (hasGuests) {
      const companionName = faker.person.fullName();
      const companionNik = `${faker.string.fromCharacters("DLC").substring(0, 1)}${faker.string.numeric(8)}`;
      
      bookingCompanion = {
        nik: companionNik,
        name: companionName,
        company: faker.helpers.arrayElement(COMPANIES),
        department: faker.helpers.arrayElement(DEPARTMENTS),
        email: faker.internet.email({ firstName: companionName.split(" ")[0] }),
        phone: faker.phone.number(),
      };
    }

    // Timestamps
    // Use the earliest check-in date for requestedAt logic
    const earliestCheckIn = occupants.reduce(
      (min, occ) => (occ.inDate < min ? occ.inDate : min),
      occupants[0].inDate
    );

    const requestedAt = subDays(
      earliestCheckIn,
      faker.number.int({ min: 1, max: 30 })
    );
    const expiresAt = addDays(requestedAt, 7); // Expire after 7 days if not processed

    let approvedAt: Date | undefined;
    let approvedBy: string | undefined;
    let adminNotes: string | undefined;
    let rejectReason: string | undefined;

    if (status === "approved") {
      approvedAt = subDays(
        earliestCheckIn,
        faker.number.int({ min: 1, max: 5 })
      );
      approvedBy = "Gandi Jen";
    }

    if (status === "rejected") {
      rejectReason = "Kapasitas penuh";
      adminNotes =
        "Mohon maaf, kapasitas penuh untuk tanggal tersebut. Silakan ajukan tanggal lain.";
    }

    // Cancelled booking info
    let cancelledAt: Date | undefined;
    let cancelledBy: string | undefined;
    let cancelledReason: string | undefined;

    if (status === "cancelled") {
      cancelledAt = subDays(earliestCheckIn, faker.number.int({ min: 1, max: 10 }));
      cancelledBy = requesterName; // Cancelled by the requester
      cancelledReason = faker.helpers.arrayElement([
        "Perubahan jadwal perjalanan dinas",
        "Pembatalan meeting",
        "Penggantian personel",
        "Jadwal bentrok dengan kegiatan lain",
        "Alasan pribadi",
      ]);
    }

    // Main Location Info (derived from first occupant or random)
    const mainBuilding = faker.helpers.arrayElement(BUILDINGS);

    return {
      id: faker.string.uuid(),
      bookingCode: `REQ-${faker.string.alphanumeric(6).toUpperCase()}`,
      requester: {
        name: requesterName,
        nik: requesterNik,
        department: faker.helpers.arrayElement(DEPARTMENTS),
        company: faker.helpers.arrayElement(COMPANIES),
        email: faker.internet.email({ firstName: requesterName }),
        phone: faker.phone.number(),
      },

      // Main Location Request (area only, buildings are per-occupant)
      areaId: mainBuilding.areaId,

      // Companion info (required when any occupant is a guest)
      companion: bookingCompanion,

      occupants,

      attachments: [
        {
          id: faker.string.uuid(),
          name: "Surat Tugas.pdf",
          url: "#",
          type: "document",
        },
        {
          id: faker.string.uuid(),
          name: "Ticket-booking.pdf",
          url: "#",
          type: "document",
        },
      ],

      purpose: faker.helpers.arrayElement(MOCK_PURPOSES),
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : undefined,
      status,
      rejectReason,
      adminNotes,

      requestedAt,
      expiresAt,
      approvedAt,
      approvedBy,

      cancelledAt,
      cancelledBy,
      cancelledReason,

      updatedAt: faker.date.recent(),
    };
  });
}

export const MOCK_BOOKING_REQUESTS = generateMockBookingRequests(20);

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

export function generateMockBookingRequests(count: number): BookingRequest[] {
  return Array.from({ length: count }).map((_, i) => {
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
    let occupants: BookingOccupant[] = Array.from({
      length: occupantsCount,
    })
      .map(() => {
        const type: BookingType = Math.random() > 0.7 ? "guest" : "employee";
        const gender: Gender = faker.person.sex() === "male" ? "L" : "P";
        const isAssigned = status === "approved";

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

        // Per-occupant location
        const occBuilding = faker.helpers.arrayElement(BUILDINGS);

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

          // Room assignment (optional - set by requester or admin)
          // bedId can only be set if roomId is set
          roomId:
            isAssigned || Math.random() > 0.7
              ? `R-${faker.number.int({ min: 100, max: 999 })}`
              : undefined,
        };
      })
      .map((occ) => ({
        ...occ,
        // Only set bedId if roomId exists
        bedId: occ.roomId
          ? `B-${faker.number
              .int({ min: 1, max: 4 })
              .toString()
              .padStart(2, "0")}`
          : undefined,
      }));

    // Ensure guests have companion info
    const guests = occupants.filter((occ) => occ.type === "guest");
    const employees = occupants.filter((occ) => occ.type === "employee");

    // Assign companion info to each guest
    guests.forEach((guest) => {
      // Create a companion employee info
      const companionName = faker.person.fullName();
      const companionNik = `${faker.string.fromCharacters("DLC").substring(0, 1)}${faker.string.numeric(8)}`;
      
      guest.companion = {
        nik: companionNik,
        name: companionName,
        company: faker.helpers.arrayElement(COMPANIES),
        department: faker.helpers.arrayElement(DEPARTMENTS),
        email: faker.internet.email({ firstName: companionName.split(" ")[0] }),
        phone: faker.phone.number(),
      };
    });

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
      updatedAt: faker.date.recent(),
    };
  });
}

export const MOCK_BOOKING_REQUESTS = generateMockBookingRequests(20);

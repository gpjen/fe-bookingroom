/**
 * Seed Booking Data with Occupants & Occupancies
 * 
 * Creates 5 sample booking records with occupants for testing.
 * Run with: npx tsx prisma/seed-booking.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { addDays, subDays, format } from "date-fns";
import * as dotenv from "dotenv";

// Load env
dotenv.config({ path: ".env.local" });

// Initialize Prisma with adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🎫 SEEDING BOOKING DATA WITH OCCUPANTS\n");

  // Get a user to be the requester
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No user found. Run main seed first.");
    process.exit(1);
  }

  // Get available beds
  const beds = await prisma.bed.findMany({
    where: { deletedAt: null},
    take: 20,
    include: {
      room: {
        include: {
          building: {
            include: { area: true },
          },
        },
      },
    },
  });

  if (beds.length < 5) {
    console.error("❌ Not enough beds. Run main seed first.");
    process.exit(1);
  }

  console.log(`📋 Using requester: ${user.displayName} (${user.email})`);
  console.log(`🛏️  Available beds: ${beds.length}`);

  // Generate booking code prefix
  const today = format(new Date(), "yyyyMMdd");

  // Sample occupants data
  const occupantsData = [
    { nik: "DCM00000001", name: "Ahmad Rasyid", gender: "MALE" as const, type: "EMPLOYEE" as const, company: "PT. Dharma Cipta Mulia", department: "Operations" },
    { nik: "DCM00000002", name: "Budi Hartono", gender: "MALE" as const, type: "EMPLOYEE" as const, company: "PT. Dharma Cipta Mulia", department: "Engineering" },
    { nik: "DCM00000003", name: "Citra Dewi", gender: "FEMALE" as const, type: "EMPLOYEE" as const, company: "PT. Dharma Cipta Mulia", department: "HR & GA" },
    { nik: "GUEST0000001", name: "David Wong", gender: "MALE" as const, type: "GUEST" as const, company: "Vendor ABC", department: null },
    { nik: "DCM00000004", name: "Eko Prasetyo", gender: "MALE" as const, type: "EMPLOYEE" as const, company: "PT. Dharma Cipta Mulia", department: "Safety" },
    { nik: "DCM00000005", name: "Fitri Handayani", gender: "FEMALE" as const, type: "EMPLOYEE" as const, company: "PT. Dharma Cipta Mulia", department: "Finance" },
    { nik: "GUEST0000002", name: "George Smith", gender: "MALE" as const, type: "GUEST" as const, company: "Contractor XYZ", department: null },
  ];

  // Create or get occupants
  console.log("\n👥 Creating occupants...");
  const createdOccupants: { id: string; nik: string; name: string; type: string }[] = [];
  
  for (const occ of occupantsData) {
    const occupant = await prisma.occupant.upsert({
      where: { nik: occ.nik },
      update: {},
      create: {
        nik: occ.nik,
        name: occ.name,
        gender: occ.gender,
        type: occ.type,
        company: occ.company,
        department: occ.department,
        email: `${occ.name.toLowerCase().replace(/ /g, ".")}@example.com`,
        phone: "+6281234567" + Math.floor(Math.random() * 100).toString().padStart(2, "0"),
      },
    });
    createdOccupants.push({ id: occupant.id, nik: occupant.nik, name: occupant.name, type: occupant.type });
    console.log(`   ✓ ${occupant.name} (${occupant.type})`);
  }

  // Sample bookings with occupants
  const bookingsData = [
    {
      code: `BK-${today}-001`,
      status: "PENDING" as const,
      purpose: "Perjalanan Dinas ke Site A",
      projectCode: "PRJ-2026-001",
      notes: "Mohon kamar yang dekat dengan kantor",
      checkInDate: addDays(new Date(), 3),
      checkOutDate: addDays(new Date(), 7),
      companionName: null,
      occupantIndices: [0, 1], // Ahmad, Budi
    },
    {
      code: `BK-${today}-002`,
      status: "PENDING" as const,
      purpose: "Meeting Tahunan Divisi IT",
      projectCode: "PRJ-2026-002",
      notes: null,
      checkInDate: addDays(new Date(), 5),
      checkOutDate: addDays(new Date(), 8),
      companionName: null,
      occupantIndices: [2], // Citra
    },
    {
      code: `BK-${today}-003`,
      status: "APPROVED" as const,
      purpose: "Training Karyawan Baru",
      projectCode: null,
      notes: "Butuh kamar bersebelahan untuk tim",
      checkInDate: addDays(new Date(), 1),
      checkOutDate: addDays(new Date(), 4),
      companionName: "Budi Santoso",
      approvedBy: "Admin System",
      approvedAt: new Date(),
      occupantIndices: [3, 4], // David (Guest), Eko
    },
    {
      code: `BK-${today}-004`,
      status: "REJECTED" as const,
      purpose: "Kunjungan Vendor Luar",
      projectCode: "PRJ-2026-003",
      notes: null,
      checkInDate: addDays(new Date(), 2),
      checkOutDate: addDays(new Date(), 5),
      companionName: "Siti Rahayu",
      rejectedBy: "Admin System",
      rejectedAt: new Date(),
      rejectionReason: "Kapasitas penuh untuk tanggal tersebut. Silakan pilih tanggal lain.",
      occupantIndices: [6], // George (Guest)
    },
    {
      code: `BK-${today}-005`,
      status: "CANCELLED" as const,
      purpose: "Audit Internal Cabang",
      projectCode: "PRJ-2026-004",
      notes: null,
      checkInDate: subDays(new Date(), 2),
      checkOutDate: addDays(new Date(), 3),
      companionName: null,
      cancelledBy: user.displayName || "User",
      cancelledAt: subDays(new Date(), 1),
      cancellationReason: "Jadwal audit diubah ke bulan depan",
      occupantIndices: [5], // Fitri
    },
  ];

  console.log("\n📝 Creating booking records with occupancies...\n");
  let bedIndex = 0;

  for (const data of bookingsData) {
    // Check if booking with this code already exists
    const existing = await prisma.booking.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      console.log(`   ⏭️  ${data.code} already exists, skipping...`);
      continue;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        code: data.code,
        
        // Requester info
        requesterUserId: user.id,
        requesterName: user.displayName || "Test User",
        requesterNik: "DCM12345678",
        requesterEmail: user.email,
        requesterPhone: "+62812345678",
        requesterCompany: "PT. Dharma Cipta Mulia",
        requesterDepartment: "Information Technology",
        requesterPosition: "Staff",
        
        // Companion info (if has guest)
        companionName: data.companionName,
        companionNik: data.companionName ? "DCM87654321" : null,
        companionEmail: data.companionName ? "companion@example.com" : null,
        companionPhone: data.companionName ? "+62898765432" : null,
        companionCompany: data.companionName ? "PT. Dharma Cipta Mulia" : null,
        companionDepartment: data.companionName ? "Operations" : null,
        
        // Note: dates are now at Occupancy level, not Booking
        purpose: data.purpose,
        projectCode: data.projectCode,
        notes: data.notes,
        
        // Status
        status: data.status,
        
        // Status metadata
        approvedBy: "approvedBy" in data ? data.approvedBy : null,
        approvedAt: "approvedAt" in data ? data.approvedAt : null,
        rejectedBy: "rejectedBy" in data ? data.rejectedBy : null,
        rejectedAt: "rejectedAt" in data ? data.rejectedAt : null,
        rejectionReason: "rejectionReason" in data ? data.rejectionReason : null,
        cancelledBy: "cancelledBy" in data ? data.cancelledBy : null,
        cancelledAt: "cancelledAt" in data ? data.cancelledAt : null,
        cancellationReason: "cancellationReason" in data ? data.cancellationReason : null,
      },
    });

    // Create occupancies for this booking
    const occupantNames: string[] = [];
    for (const occIdx of data.occupantIndices) {
      const occupant = createdOccupants[occIdx];
      const bed = beds[bedIndex % beds.length];
      bedIndex++;

      // Determine occupancy status based on booking status
      let occStatus: "PENDING" | "RESERVED" | "CHECKED_IN" | "CANCELLED" = "PENDING";
      if (data.status === "APPROVED") occStatus = "RESERVED";
      if (data.status === "CANCELLED") occStatus = "CANCELLED";

      await prisma.occupancy.create({
        data: {
          bookingId: booking.id,
          occupantId: occupant.id,
          bedId: bed.id,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          status: occStatus,
          createdBy: user.id,
          createdByName: user.displayName,
        },
      });

      occupantNames.push(occupant.name);
    }

    const statusEmoji = {
      PENDING: "⏳",
      APPROVED: "✅",
      REJECTED: "❌",
      CANCELLED: "🚫",
    };

    console.log(`   ${statusEmoji[data.status]} ${booking.code} - ${data.purpose}`);
    console.log(`      └─ Occupants: ${occupantNames.join(", ")}`);
  }

  // Count results
  const bookingCounts = await prisma.booking.groupBy({
    by: ["status"],
    _count: true,
  });

  const occupancyCount = await prisma.occupancy.count();
  const occupantCount = await prisma.occupant.count();

  console.log("\n📊 Summary:");
  console.log("   Bookings:");
  for (const c of bookingCounts) {
    console.log(`     - ${c.status}: ${c._count}`);
  }
  console.log(`   Occupants: ${occupantCount}`);
  console.log(`   Occupancies: ${occupancyCount}`);

  console.log("\n🎉 Booking seeding complete!\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

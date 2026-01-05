// OCCUPANCY SEEDER - Sample Data
// Run: npx tsx prisma/seed-occupancy.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

// Load env
dotenv.config({ path: ".env.local" });

// Initialize Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🏠 SEEDING OCCUPANCY DATA\n");

  // Get beds that are available
  const beds = await prisma.bed.findMany({
    where: { status: "AVAILABLE" },
    include: {
      room: {
        include: {
          building: true,
        },
      },
    },
    take: 15, // Get up to 15 beds
  });

  if (beds.length === 0) {
    console.log("❌ No available beds found. Run main seed first.");
    return;
  }

  console.log(`📋 Found ${beds.length} available beds`);

  // Sample occupant data
  const sampleOccupants = [
    // CHECKED_IN occupants
    {
      name: "Ahmad Hidayat",
      nik: "D0520001234",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Dharma Cipta Mulia",
      department: "Engineering",
      position: "Senior Engineer",
      phone: "081234567890",
      email: "ahmad.hidayat@company.com",
      status: "CHECKED_IN" as const,
      daysAgo: 3,
      stayDays: 14,
    },
    {
      name: "Budi Santoso",
      nik: "D0520001235",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Dharma Cipta Mulia",
      department: "Operations",
      position: "Supervisor",
      phone: "081234567891",
      email: "budi.santoso@company.com",
      status: "CHECKED_IN" as const,
      daysAgo: 5,
      stayDays: 21,
    },
    {
      name: "Siti Rahayu",
      nik: "D0520001236",
      type: "EMPLOYEE" as const,
      gender: "FEMALE" as const,
      company: "PT Halmahera Persada Lygend",
      department: "HR",
      position: "HR Officer",
      phone: "081234567892",
      email: "siti.rahayu@company.com",
      status: "CHECKED_IN" as const,
      daysAgo: 1,
      stayDays: 7,
    },
    {
      name: "John Smith",
      nik: null,
      type: "GUEST" as const,
      gender: "MALE" as const,
      company: "PT Vendor International",
      department: null,
      position: "Consultant",
      phone: "081234567893",
      email: "john.smith@vendor.com",
      status: "CHECKED_IN" as const,
      daysAgo: 2,
      stayDays: 5,
    },
    // RESERVED occupants (future check-in)
    {
      name: "Dewi Lestari",
      nik: "D0520001237",
      type: "EMPLOYEE" as const,
      gender: "FEMALE" as const,
      company: "PT Dharma Cipta Mulia",
      department: "Finance",
      position: "Accountant",
      phone: "081234567894",
      email: "dewi.lestari@company.com",
      status: "RESERVED" as const,
      daysAgo: -2, // Future: 2 days from now
      stayDays: 10,
    },
    {
      name: "Rudi Hartono",
      nik: "D0520001238",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Halmahera Persada Lygend",
      department: "Maintenance",
      position: "Technician",
      phone: "081234567895",
      email: "rudi.hartono@company.com",
      status: "RESERVED" as const,
      daysAgo: -5, // Future: 5 days from now
      stayDays: 14,
    },
    // CHECKED_OUT occupants (past)
    {
      name: "Agus Setiawan",
      nik: "D0520001239",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Dharma Cipta Mulia",
      department: "Production",
      position: "Operator",
      phone: "081234567896",
      email: "agus.setiawan@company.com",
      status: "CHECKED_OUT" as const,
      daysAgo: 15,
      stayDays: 7,
    },
    {
      name: "Maria Santos",
      nik: null,
      type: "GUEST" as const,
      gender: "FEMALE" as const,
      company: "PT Contractor Asia",
      department: null,
      position: "Project Manager",
      phone: "081234567897",
      email: "maria.santos@contractor.com",
      status: "CHECKED_OUT" as const,
      daysAgo: 10,
      stayDays: 3,
    },
    // PENDING occupants
    {
      name: "Bambang Wijaya",
      nik: "D0520001240",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Dharma Cipta Mulia",
      department: "Logistics",
      position: "Driver",
      phone: "081234567898",
      email: "bambang.wijaya@company.com",
      status: "PENDING" as const,
      daysAgo: -1, // Tomorrow
      stayDays: 5,
    },
    // CANCELLED occupant
    {
      name: "Eko Prasetyo",
      nik: "D0520001241",
      type: "EMPLOYEE" as const,
      gender: "MALE" as const,
      company: "PT Halmahera Persada Lygend",
      department: "Security",
      position: "Guard",
      phone: "081234567899",
      email: "eko.prasetyo@company.com",
      status: "CANCELLED" as const,
      daysAgo: 5,
      stayDays: 7,
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;

  for (let i = 0; i < Math.min(sampleOccupants.length, beds.length); i++) {
    const bed = beds[i];
    const occupant = sampleOccupants[i];

    // Calculate dates
    const checkInDate = new Date(today);
    checkInDate.setDate(checkInDate.getDate() - occupant.daysAgo);

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + occupant.stayDays);

    // Check if occupancy already exists for this bed
    const existingOccupancy = await prisma.occupancy.findFirst({
      where: {
        bedId: bed.id,
        status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
      },
    });

    if (existingOccupancy) {
      console.log(`   ⏭️  Skipping ${bed.code} - already has active occupancy`);
      continue;
    }

    // Create occupancy
    await prisma.occupancy.create({
      data: {
        bedId: bed.id,
        occupantType: occupant.type,
        occupantName: occupant.name,
        occupantNik: occupant.nik,
        occupantGender: occupant.gender,
        occupantPhone: occupant.phone,
        occupantEmail: occupant.email,
        occupantCompany: occupant.company,
        occupantDepartment: occupant.department,
        occupantPosition: occupant.position,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        actualCheckIn: occupant.status === "CHECKED_IN" || occupant.status === "CHECKED_OUT" 
          ? new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000) // 8 AM
          : null,
        actualCheckOut: occupant.status === "CHECKED_OUT"
          ? new Date(checkOutDate.getTime() + 10 * 60 * 60 * 1000) // 10 AM
          : null,
        status: occupant.status,
        createdBy: "SEEDER",
        createdByName: "System Seeder",
        logs: {
          create: {
            action: "CREATED",
            bedId: bed.id,
            performedBy: "SEEDER",
            performedByName: "System Seeder",
            notes: "Created by occupancy seeder",
          },
        },
      },
    });

    // Update bed status for active occupancies
    if (occupant.status === "CHECKED_IN") {
      await prisma.bed.update({
        where: { id: bed.id },
        data: { status: "OCCUPIED" },
      });
    } else if (occupant.status === "RESERVED" || occupant.status === "PENDING") {
      await prisma.bed.update({
        where: { id: bed.id },
        data: { status: "RESERVED" },
      });
    }

    console.log(`   ✅ ${occupant.name} → ${bed.code} (${occupant.status})`);
    created++;
  }

  console.log(`\n🎉 Created ${created} occupancy records\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ SEEDING FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

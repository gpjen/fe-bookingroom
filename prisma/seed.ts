// SIMPLE SEEDER - RBAC System
// Run: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

// Load env
dotenv.config({ path: ".env.local" });

// Initialize Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🌱 SEEDING DATABASE - RBAC SYSTEM\n");

  // ========================================
  // 1. PERMISSIONS
  // ========================================
  console.log("📝 Creating permissions...");

  const permissions = [
    { key: "*", description: "Super Admin - All Access", category: "system" },
    { key: "home:read", description: "View home page", category: "general" },
    { key: "dashboard:read", description: "View dashboard", category: "general" },
    { key: "admin:read", description: "Access admin area", category: "admin" },
    { key: "companies:read", description: "View companies", category: "property" },
    { key: "areas:read", description: "View areas", category: "property" },
    { key: "buildings:read", description: "View buildings", category: "property" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  console.log(`   ✅ ${permissions.length} permissions`);

  // ========================================
  // 2. ROLES
  // ========================================
  console.log("👥 Creating roles...");

  const superAdminRole = await prisma.role.upsert({
    where: { name: "super-admin" },
    update: {},
    create: {
      name: "super-admin",
      description: "Full system access",
      isSystemRole: true,
    },
  });

  // Link super-admin with all permissions
  const allPerm = await prisma.permission.findUnique({ where: { key: "*" } });
  if (allPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: allPerm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: allPerm.id,
      },
    });
  }

  console.log("   ✅ super-admin role");

  // ========================================
  // 3. COMPANIES
  // ========================================
  console.log("🏢 Creating companies...");

  const dcm = await prisma.company.upsert({
    where: { code: "DCM" },
    update: {},
    create: {
      code: "DCM",
      name: "PT. Dharma Cipta Mulia",
      status: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hpal = await prisma.company.upsert({
    where: { code: "HPAL" },
    update: {},
    create: {
      code: "HPAL",
      name: "PT. Halmahera Persada Lygend",
      status: true,
    },
  });

  console.log("   ✅ DCM, HPAL");

  // ========================================
  // 4. USER ROLES
  // ========================================
  console.log("👤 Creating user roles...");

  await prisma.userRole.upsert({
    where: {
      usernameKey_roleId_companyId: {
        usernameKey: "d12345",
        roleId: superAdminRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      username: "D12345",
      usernameKey: "d12345",
      displayName: "Super User",
      email: "superadmin@company.com",
      roleId: superAdminRole.id,
      companyId: dcm.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      usernameKey_roleId_companyId: {
        usernameKey: "d0525000109",
        roleId: superAdminRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      username: "D0525000109",
      usernameKey: "d0525000109",
      displayName: "Gandi Purna Jen",
      email: "gpjen95@gmail.com",
      roleId: superAdminRole.id,
      companyId: dcm.id,
    },
  });

  console.log("   ✅ 2 super admins");

  // ========================================
  // 5. AREAS
  // ========================================
  console.log("🏗️  Creating areas...");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const area1 = await prisma.area.upsert({
    where: { code: "KWS-PABRIK" },
    update: {},
    create: {
      code: "KWS-PABRIK",
      name: "Kawasan Pabrik",
      location: "Kawasi, Obi, Halmahera Selatan",
      status: "ACTIVE",
      description: "Area kawasan pabrik HPAL",
    },
  });

  console.log("   ✅ 1 area");

  // ========================================
  // 6. BUILDING TYPES & ROOM TYPES
  // ========================================
  console.log("🏗️  Creating building types & room types...");

  await prisma.buildingType.upsert({
    where: { code: "MESS" },
    update: {},
    create: {
      code: "MESS",
      name: "Mess",
      description: "Asrama karyawan/pekerja",
      defaultMaxFloors: 5,
      defaultFacilities: ["WiFi", "Laundry", "Common Room"],
      icon: "building-2",
      status: true,
    },
  });

  await prisma.buildingType.upsert({
    where: { code: "HOTEL" },
    update: {},
    create: {
      code: "HOTEL",
      name: "Hotel",
      description: "Hotel atau guest house",
      defaultMaxFloors: 10,
      defaultFacilities: ["WiFi", "Restaurant", "Reception", "Parking"],
      icon: "hotel",
      status: true,
    },
  });

  await prisma.roomType.upsert({
    where: { code: "SINGLE" },
    update: {},
    create: {
      code: "SINGLE",
      name: "Single Room",
      description: "Kamar dengan 1 bed",
      bedsPerRoom: 1,
      defaultBedType: "Single Bed",
      defaultAmenities: ["Fan", "Desk", "Shared Bathroom"],
      priceMultiplier: 1.0,
      icon: "bed-single",
      status: true,
    },
  });

  await prisma.roomType.upsert({
    where: { code: "DOUBLE" },
    update: {},
    create: {
      code: "DOUBLE",
      name: "Double Room",
      description: "Kamar dengan 2 bed",
      bedsPerRoom: 2,
      defaultBedType: "Single Bed",
      defaultAmenities: ["AC", "TV", "Private Bathroom"],
      priceMultiplier: 1.5,
      icon: "bed-double",
      status: true,
    },
  });

  await prisma.roomType.upsert({
    where: { code: "DORM-6" },
    update: {},
    create: {
      code: "DORM-6",
      name: "Dormitory (6 Beds)",
      description: "Kamar asrama dengan 6 bed",
      bedsPerRoom: 6,
      defaultBedType: "Bunk Bed",
      defaultAmenities: ["Locker", "Fan", "Shared Bathroom"],
      priceMultiplier: 0.5,
      icon: "warehouse",
      status: true,
    },
  });

  console.log("   ✅ 2 building types, 3 room types");

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n🎉 DATABASE SEEDING COMPLETE!\n");
  console.log("📊 Summary:");
  console.log(`   - Permissions: ${permissions.length}`);
  console.log("   - Roles: 1 (super-admin)");
  console.log("   - Companies: 2 (DCM, HPAL)");
  console.log("   - Users: 2 super admins");
  console.log("   - Areas: 1");
  console.log("   - Building Types: 2");
  console.log("   - Room Types: 3");
  console.log("\n✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("\n❌ SEEDING FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
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
    { key: "booking:read", description: "View bookings", category: "booking" },
    { key: "booking-request:read", description: "View booking requests", category: "booking" },
    { key: "booking-occupant:read", description: "View booking occupants", category: "booking" },
    { key: "booking-mine:read", description: "View my bookings", category: "booking" },
    { key: "building:read", description: "View buildings", category: "property" },
    { key: "reports:read", description: "View reports", category: "reports" },
    { key: "property:read", description: "View properties", category: "property" },
    { key: "companies:read", description: "View companies", category: "admin" },
    { key: "area:read", description: "View areas", category: "property" },
    { key: "options-type:read", description: "View option types", category: "settings" },
    { key: "admin:read", description: "Access admin area", category: "admin" },
    { key: "admin-users:read", description: "View admin users", category: "admin" },
    { key: "admin-roles:read", description: "View admin roles", category: "admin" },
    { key: "admin-settings:read", description: "View admin settings", category: "admin" },
    { key: "admin-logs:read", description: "View admin logs", category: "admin" },
    { key: "notifications:read", description: "View notifications", category: "general" },
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

  // Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super-admin" },
    update: {},
    create: {
      name: "super-admin",
      description: "Full system access",
      isSystemRole: true,
    },
  });

  // Staff Role
  const staffRole = await prisma.role.upsert({
    where: { name: "staff" },
    update: {},
    create: {
      name: "staff",
      description: "Staff with basic access",
      isSystemRole: false,
    },
  });

  // Link super-admin dengan semua permission
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Link staff dengan permission terbatas
  const staffPermissions = ["home:read", "notifications:read"];
  for (const permKey of staffPermissions) {
    const perm = await prisma.permission.findUnique({
      where: { key: permKey }
    });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: staffRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: staffRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  console.log("   ✅ super-admin role (all permissions)");
  console.log("   ✅ staff role (home:read, notifications:read)");

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
  // 4. USER ROLES (WITH SNAPSHOT)
  // ========================================
  console.log("👤 Creating user roles...");

  // User 1: d12345 = SUPER ADMIN ✨
  await prisma.userRole.upsert({
    where: {
      usernameKey_roleId_companyId: {
        usernameKey: "d12345", // lowercase
        roleId: superAdminRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      username: "D12345", // Original case
      usernameKey: "d12345", // Lowercase untuk search
      displayName: "Super User",
      email: "superadmin@company.com",
      roleId: superAdminRole.id,
      companyId: dcm.id,
    },
  });

  // User 2: D0525000109 = STAFF (bukan super admin lagi)
  await prisma.userRole.upsert({
    where: {
      usernameKey_roleId_companyId: {
        usernameKey: "d0525000109",
        roleId: staffRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      username: "D0525000109",
      usernameKey: "d0525000109",
      displayName: "Gandi Purna Jen",
      email: "gpjen95@gmail.com",
      roleId: staffRole.id,
      companyId: dcm.id,
    },
  });

  // User 3: L0721001028 = SUPER ADMIN
  await prisma.userRole.upsert({
    where: {
      usernameKey_roleId_companyId: {
        usernameKey: "l0721001028",
        roleId: superAdminRole.id,
        companyId: hpal.id,
      },
    },
    update: {},
    create: {
      username: "L0721001028",
      usernameKey: "l0721001028",
      displayName: "Novi Ikhtiarullah",
      email: "novi.ikhtiarullah@hpalnickel.com",
      roleId: superAdminRole.id,
      companyId: hpal.id,
    },
  });

  console.log("   ✅ 2 super admins (d12345, L0721001028)");
  console.log("   ✅ 1 staff (D0525000109)");

  // ========================================
  // 5. AREAS & BUILDINGS
  // ========================================
  console.log("🏗️  Creating areas & buildings...");

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

  const building1 = await prisma.building.upsert({
    where: { code: "GB-01" },
    update: {},
    create: {
      code: "GB-01",
      name: "Gedung A",
      areaId: area1.id,
      status: true,
    },
  });

  console.log("   ✅ 1 area, 1 building");

  // ========================================
  // 6. USER BUILDING ACCESS (WITH SNAPSHOT)
  // ========================================
  console.log("🔑 Granting building access...");

  // d12345 → Building access
  await prisma.userBuilding.upsert({
    where: {
      usernameKey_buildingId: {
        usernameKey: "d12345",
        buildingId: building1.id,
      },
    },
    update: {},
    create: {
      username: "D12345",
      usernameKey: "d12345",
      displayName: "Super User",
      email: "superadmin@company.com",
      buildingId: building1.id,
    },
  });

  console.log("   ✅ d12345 has building access");

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n🎉 DATABASE SEEDING COMPLETE!\n");
  console.log("📊 Summary:");
  console.log(`   - Permissions: ${permissions.length}`);
  console.log(`   - Roles: 2 (super-admin, staff)`);
  console.log(`   - Companies: 2 (DCM, HPAL)`);
  console.log(`   - Users: 2 super admins, 1 staff`);
  console.log(`   - Areas: 1`);
  console.log(`   - Buildings: 1`);
  console.log("\n✨ User roles:");
  console.log("   - d12345: SUPER ADMIN (all permissions)");
  console.log("   - D0525000109: STAFF (home:read, notifications:read)");
  console.log("   - L0721001028: SUPER ADMIN (all permissions)");
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
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
    // General
    { key: "home:read", description: "View home page", category: "general" },
    { key: "dashboard:read", description: "View dashboard", category: "general" },
    { key: "notifications:read", description: "View notifications", category: "general" },
    
    // Booking
    { key: "booking:read", description: "Access booking menu", category: "booking" },
    { key: "booking-request:read", description: "View booking requests", category: "booking" },
    { key: "booking-request:create", description: "Create booking request", category: "booking" },
    { key: "booking-request:update", description: "Update booking request", category: "booking" },
    { key: "booking-request:delete", description: "Delete booking request", category: "booking" },
    { key: "booking-request:approve", description: "Approve booking request", category: "booking" },
    { key: "booking-occupant-status:read", description: "View occupant status", category: "booking" },
    { key: "booking-occupant-status:update", description: "Update occupant status", category: "booking" },
    { key: "booking-mine:read", description: "View my bookings", category: "booking" },
    
    // Buildings
    { key: "building:read", description: "View buildings", category: "property" },
    { key: "building:create", description: "Create building", category: "property" },
    { key: "building:update", description: "Update building", category: "property" },
    { key: "building:delete", description: "Delete building", category: "property" },
    
    // Reports
    { key: "reports:read", description: "View reports", category: "reports" },
    { key: "reports:export", description: "Export reports", category: "reports" },
    
    // Property Management
    { key: "property:read", description: "Access property menu", category: "property" },
    
    // Companies
    { key: "companies:read", description: "View companies", category: "property" },
    { key: "companies:create", description: "Create company", category: "property" },
    { key: "companies:update", description: "Update company", category: "property" },
    { key: "companies:delete", description: "Delete company", category: "property" },
    
    // Areas
    { key: "area:read", description: "View areas", category: "property" },
    { key: "area:create", description: "Create area", category: "property" },
    { key: "area:update", description: "Update area", category: "property" },
    { key: "area:delete", description: "Delete area", category: "property" },
    
    // Building Types
    { key: "building-type:read", description: "View building types", category: "property" },
    { key: "building-type:create", description: "Create building type", category: "property" },
    { key: "building-type:update", description: "Update building type", category: "property" },
    { key: "building-type:delete", description: "Delete building type", category: "property" },
    
    // Room Types
    { key: "room-type:read", description: "View room types", category: "property" },
    { key: "room-type:create", description: "Create room type", category: "property" },
    { key: "room-type:update", description: "Update room type", category: "property" },
    { key: "room-type:delete", description: "Delete room type", category: "property" },
    
    // Administration
    { key: "admin:read", description: "Access admin menu", category: "admin" },
    
    // Admin - Users
    { key: "admin-users:read", description: "View users", category: "admin" },
    { key: "admin-users:create", description: "Create user", category: "admin" },
    { key: "admin-users:update", description: "Update user", category: "admin" },
    { key: "admin-users:delete", description: "Delete user", category: "admin" },
    
    // Admin - Roles
    { key: "admin-roles:read", description: "View roles & permissions", category: "admin" },
    { key: "admin-roles:create", description: "Create role", category: "admin" },
    { key: "admin-roles:update", description: "Update role", category: "admin" },
    { key: "admin-roles:delete", description: "Delete role", category: "admin" },
    
    // Admin - Settings
    { key: "admin-settings:read", description: "View system settings", category: "admin" },
    { key: "admin-settings:update", description: "Update system settings", category: "admin" },
    
    // Admin - Logs
    { key: "admin-logs:read", description: "View system logs", category: "admin" },
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
      description: "Full system access - all permissions",
      isSystemRole: true,
    },
  });

  // Staff Role
  const staffRole = await prisma.role.upsert({
    where: { name: "staff" },
    update: {},
    create: {
      name: "staff",
      description: "Basic staff access - limited permissions",
      isSystemRole: false,
    },
  });

  console.log("   ✅ super-admin, staff roles");

  // ========================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ========================================
  console.log("🔗 Assigning permissions to roles...");

  // Get all permissions for super-admin
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

  // Staff permissions (limited)
  const staffPermissionKeys = [
    "home:read",
    "booking:read",
    "booking-mine:read",
    "notifications:read",
  ];

  for (const key of staffPermissionKeys) {
    const perm = await prisma.permission.findUnique({ where: { key } });
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

  console.log(`   ✅ ${allPermissions.length} permissions → super-admin`);
  console.log(`   ✅ ${staffPermissionKeys.length} permissions → staff`);

  // ========================================
  // 4. COMPANIES
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
  // 4. USERS
  // ========================================
  console.log("👤 Creating users...");

  const superUser1 = await prisma.user.upsert({
    where: { username: "D12345" },
    update: {},
    create: {
      username: "D12345",
      usernameKey: "d12345",
      displayName: "Super User",
      email: "superadmin@company.com",
      status: true,
    },
  });

  const superUser2 = await prisma.user.upsert({
    where: { username: "D0525000109" },
    update: {},
    create: {
      username: "D0525000109",
      usernameKey: "d0525000109",
      displayName: "Gandi Purna Jen",
      email: "gpjen95@gmail.com",
      status: true,
    },
  });

  console.log("   ✅ 2 users created");

  // ========================================
  // 5. USER ROLES
  // ========================================
  console.log("🔑 Assigning user roles...");

  await prisma.userRole.upsert({
    where: {
      userId_roleId_companyId: {
        userId: superUser1.id,
        roleId: superAdminRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      userId: superUser1.id,
      roleId: superAdminRole.id,
      companyId: dcm.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_companyId: {
        userId: superUser2.id,
        roleId: superAdminRole.id,
        companyId: dcm.id,
      },
    },
    update: {},
    create: {
      userId: superUser2.id,
      roleId: superAdminRole.id,
      companyId: dcm.id,
    },
  });

  console.log("   ✅ 2 role assignments");

  // ========================================
  // 6. AREAS
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
  console.log("   - Roles: 2 (super-admin, staff)");
  console.log("   - Companies: 2 (DCM, HPAL)");
  console.log("   - Users: 2");
  console.log("   - User Roles: 2 assignments");
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
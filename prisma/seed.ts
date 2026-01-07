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

    // Occupants
    { key: "occupant:read", description: "View occupants", category: "occupant" },
    { key: "occupant:create", description: "Create occupant", category: "occupant" },
    { key: "occupant:update", description: "Update occupant", category: "occupant" },
    { key: "occupant:delete", description: "Delete occupant", category: "occupant" },
    
    // Buildings
    { key: "building:read", description: "View buildings", category: "buildings" },
    { key: "building:create", description: "Create building", category: "buildings" },
    { key: "building:update", description: "Update building", category: "buildings" },
    { key: "building:delete", description: "Delete building", category: "buildings" },
    
    // Reports
    { key: "reports:read", description: "View reports", category: "reports" },
    { key: "reports:export", description: "Export reports", category: "reports" },
    
    // Master Data
    { key: "property:read", description: "Access master data menu", category: "master-data" },
    
    // Companies
    { key: "companies:read", description: "View companies", category: "master-data" },
    { key: "companies:create", description: "Create company", category: "master-data" },
    { key: "companies:update", description: "Update company", category: "master-data" },
    { key: "companies:delete", description: "Delete company", category: "master-data" },
    
    // Areas
    { key: "area:read", description: "View areas", category: "master-data" },
    { key: "area:create", description: "Create area", category: "master-data" },
    { key: "area:update", description: "Update area", category: "master-data" },
    { key: "area:delete", description: "Delete area", category: "master-data" },
    
    // Building Types
    { key: "building-type:read", description: "View building types", category: "master-data" },
    { key: "building-type:create", description: "Create building type", category: "master-data" },
    { key: "building-type:update", description: "Update building type", category: "master-data" },
    { key: "building-type:delete", description: "Delete building type", category: "master-data" },
    
    // Room Types
    { key: "room-type:read", description: "View room types", category: "master-data" },
    { key: "room-type:create", description: "Create room type", category: "master-data" },
    { key: "room-type:update", description: "Update room type", category: "master-data" },
    { key: "room-type:delete", description: "Delete room type", category: "master-data" },
    
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
  // 4a. NOTIFICATIONS (SEED DATA)
  // ========================================
  console.log("🔔 Creating example notifications...");

  // Example 1: System Info
  await prisma.notification.create({
    data: {
      title: "Selamat Datang D12345",
      message: "Akun Anda di Booking Room System telah aktif. Anda dapat mulai melakukan pemesanan ruangan.",
      type: "INFO",
      category: "SYSTEM",
      link: "/profile",
      recipients: {
        create: {
          userId: superUser1.id,
          isRead: false,
        }
      }
    }
  });

  // Example 2: Booking Success
  await prisma.notification.create({
    data: {
      title: "Booking Dikonfirmasi",
      message: "Pemesanan Meeting Room A untuk tanggal 25 Nov 2024 telah disetujui.",
      type: "SUCCESS",
      category: "BOOKING",
      link: "/bookings/123",
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      recipients: {
        create: {
          userId: superUser1.id,
          isRead: false,
        }
      }
    }
  });

  // Example 3: Maintenance Warning
  await prisma.notification.create({
    data: {
      title: "Jadwal Maintenance",
      message: "AC Ruang Server akan diperbaiki besok jam 09:00 - 11:00 WITA.",
      type: "WARNING",
      category: "MAINTENANCE",
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      recipients: {
        create: {
          userId: superUser1.id,
          isRead: true, // Already read
          readAt: new Date(Date.now() - 40000000),
        }
      }
    }
  });


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
  // 7. SYSTEM SETTINGS
  // ========================================
  console.log("⚙️  Seeding system settings...");

  const defaultSettings = {
    general: {
      appName: "Booking Room System",
      supportEmail: "booking@obi-site.com",
      supportWhatsapp: "https://wa.me/628123456789",
      supportHelpdesk: "http://helpdesk.obi-site.com",
      timezone: "Asia/Jakarta",
      dateFormat: "dd/MM/yyyy",
    },
    booking: {
      allowWeekendBooking: false,
      requiresApproval: true,
      maxBookingDuration: 8,
      minAdvanceBooking: 1,
      maxAdvanceBooking: 30,
      operatingHoursStart: "08:00",
      operatingHoursEnd: "18:00",
    },
    notifications: {
      enableEmail: true,
      enablePush: true,
      reminderTime: "30",
    },
    maintenance: {
      enabled: false,
      message: "Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.",
    },
  };

  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {}, // Don't overwrite if exists
    create: {
      id: 1,
      config: defaultSettings,
    },
  });

  console.log("   ✅ System settings seeded");

  // ========================================
  // 8. BUILDINGS, ROOMS & BEDS
  // ========================================
  console.log("🏢 Creating buildings, rooms & beds...");

  // Get references
  const messType = await prisma.buildingType.findUnique({ where: { code: "MESS" } });
  const singleRoom = await prisma.roomType.findUnique({ where: { code: "SINGLE" } });
  const doubleRoom = await prisma.roomType.findUnique({ where: { code: "DOUBLE" } });
  const dormRoom = await prisma.roomType.findUnique({ where: { code: "DORM-6" } });

  if (messType && singleRoom && doubleRoom && dormRoom && area1) {
    // ======================
    // BUILDING 1: Mess Alpha
    // ======================
    const building1 = await prisma.building.upsert({
      where: { code: "MESS-A" },
      update: {},
      create: {
        code: "MESS-A",
        name: "Mess Alpha",
        areaId: area1.id,
        buildingTypeId: messType.id,
        address: "Blok A, Kawasan Pabrik",
        latitude: -1.3725,
        longitude: 127.5925,
        status: true,
      },
    });

    // Building 1 - Floor 1 Rooms
    const b1f1Rooms = [
      { code: "A101", name: "Kamar 101", floorNumber: 1, roomTypeId: doubleRoom.id, genderPolicy: "MALE_ONLY" as const },
      { code: "A102", name: "Kamar 102", floorNumber: 1, roomTypeId: doubleRoom.id, genderPolicy: "MALE_ONLY" as const },
      { code: "A103", name: "Kamar 103", floorNumber: 1, roomTypeId: singleRoom.id, genderPolicy: "FLEXIBLE" as const },
    ];

    for (const roomData of b1f1Rooms) {
      const room = await prisma.room.upsert({
        where: { code: roomData.code },
        update: {},
        create: {
          ...roomData,
          buildingId: building1.id,
          status: "ACTIVE",
        },
      });

      // Create beds
      const roomType = await prisma.roomType.findUnique({ where: { id: roomData.roomTypeId } });
      const bedCount = roomType?.bedsPerRoom || 1;
      for (let i = 1; i <= bedCount; i++) {
        await prisma.bed.upsert({
          where: { code: `${roomData.code}-B${i}` },
          update: {},
          create: {
            code: `${roomData.code}-B${i}`,
            label: `Bed ${i}`,
            position: i,
            bedType: roomType?.defaultBedType || "Single Bed",
            roomId: room.id,
          },
        });
      }
    }

    // Building 1 - Floor 2 Rooms
    const b1f2Rooms = [
      { code: "A201", name: "Kamar 201", floorNumber: 2, floorName: "Lantai 2", roomTypeId: dormRoom.id, genderPolicy: "MALE_ONLY" as const },
      { code: "A202", name: "Kamar 202", floorNumber: 2, floorName: "Lantai 2", roomTypeId: doubleRoom.id, genderPolicy: "FEMALE_ONLY" as const },
    ];

    for (const roomData of b1f2Rooms) {
      const room = await prisma.room.upsert({
        where: { code: roomData.code },
        update: {},
        create: {
          ...roomData,
          buildingId: building1.id,
          status: "ACTIVE",
        },
      });

      const roomType = await prisma.roomType.findUnique({ where: { id: roomData.roomTypeId } });
      const bedCount = roomType?.bedsPerRoom || 1;
      for (let i = 1; i <= bedCount; i++) {
        await prisma.bed.upsert({
          where: { code: `${roomData.code}-B${i}` },
          update: {},
          create: {
            code: `${roomData.code}-B${i}`,
            label: `Bed ${i}`,
            position: i,
            bedType: roomType?.defaultBedType || "Single Bed",
            roomId: room.id,
          },
        });
      }
    }

    console.log("   ✅ Mess Alpha: 2 floors, 5 rooms");

    // ======================
    // BUILDING 2: Mess Beta
    // ======================
    const building2 = await prisma.building.upsert({
      where: { code: "MESS-B" },
      update: {},
      create: {
        code: "MESS-B",
        name: "Mess Beta",
        areaId: area1.id,
        buildingTypeId: messType.id,
        address: "Blok B, Kawasan Pabrik",
        latitude: -1.3730,
        longitude: 127.5930,
        status: true,
      },
    });

    // Building 2 - Floor 1 Rooms
    const b2f1Rooms = [
      { code: "B101", name: "Kamar 101", floorNumber: 1, roomTypeId: singleRoom.id, genderPolicy: "MIX" as const },
      { code: "B102", name: "Kamar 102", floorNumber: 1, roomTypeId: doubleRoom.id, genderPolicy: "FLEXIBLE" as const },
      { code: "B103", name: "Kamar 103", floorNumber: 1, roomTypeId: doubleRoom.id, genderPolicy: "MALE_ONLY" as const },
    ];

    for (const roomData of b2f1Rooms) {
      const room = await prisma.room.upsert({
        where: { code: roomData.code },
        update: {},
        create: {
          ...roomData,
          buildingId: building2.id,
          status: "ACTIVE",
        },
      });

      const roomType = await prisma.roomType.findUnique({ where: { id: roomData.roomTypeId } });
      const bedCount = roomType?.bedsPerRoom || 1;
      for (let i = 1; i <= bedCount; i++) {
        await prisma.bed.upsert({
          where: { code: `${roomData.code}-B${i}` },
          update: {},
          create: {
            code: `${roomData.code}-B${i}`,
            label: `Bed ${i}`,
            position: i,
            bedType: roomType?.defaultBedType || "Single Bed",
            roomId: room.id,
          },
        });
      }
    }

    // Building 2 - Floor 2 Rooms
    const b2f2Rooms = [
      { code: "B201", name: "Kamar 201", floorNumber: 2, floorName: "Lantai 2", roomTypeId: dormRoom.id, genderPolicy: "FEMALE_ONLY" as const },
      { code: "B202", name: "Kamar 202", floorNumber: 2, floorName: "Lantai 2", roomTypeId: singleRoom.id, genderPolicy: "MALE_ONLY" as const },
    ];

    for (const roomData of b2f2Rooms) {
      const room = await prisma.room.upsert({
        where: { code: roomData.code },
        update: {},
        create: {
          ...roomData,
          buildingId: building2.id,
          status: "ACTIVE",
        },
      });

      const roomType = await prisma.roomType.findUnique({ where: { id: roomData.roomTypeId } });
      const bedCount = roomType?.bedsPerRoom || 1;
      for (let i = 1; i <= bedCount; i++) {
        await prisma.bed.upsert({
          where: { code: `${roomData.code}-B${i}` },
          update: {},
          create: {
            code: `${roomData.code}-B${i}`,
            label: `Bed ${i}`,
            position: i,
            bedType: roomType?.defaultBedType || "Single Bed",
            roomId: room.id,
          },
        });
      }
    }

    console.log("   ✅ Mess Beta: 2 floors, 5 rooms");
  }

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
  console.log("   - Buildings: 2 (Mess Alpha, Mess Beta)");
  console.log("   - Rooms: 10 (5 per building)");
  console.log("   - Beds: ~30 (varies by room type)");
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
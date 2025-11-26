const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const permissionKeys = [
    "dashboard:read",
    "calendar:read",
    "booking:read",
    "booking-mine:write",
    "booking-request:read",
    "property:read",
    "reports:read",
    "payments:read",
    "admin:read",
  ];

  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  const roles = [
    { name: "super-admin" },
    { name: "admin" },
    { name: "manager" },
    { name: "staff" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  const allPerms = await prisma.permission.findMany({ select: { id: true } });
  const adminPerms = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "dashboard:read",
          "calendar:read",
          "booking:read",
          "booking-mine:write",
          "booking-request:read",
          "property:read",
          "reports:read",
          "payments:read",
          "admin:read",
        ],
      },
    },
    select: { id: true },
  });
  const managerPerms = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "dashboard:read",
          "calendar:read",
          "booking:read",
          "booking-mine:write",
          "booking-request:read",
          "property:read",
          "reports:read",
        ],
      },
    },
    select: { id: true },
  });
  const staffPerms = await prisma.permission.findMany({
    where: {
      key: { in: ["dashboard:read", "calendar:read", "booking-mine:write"] },
    },
    select: { id: true },
  });

  const roleMap = await prisma.role.findMany({
    select: { id: true, name: true },
  });
  const idOf = (name) => roleMap.find((r) => r.name === name)?.id;

  // Set role permissions
  await prisma.rolePermission.deleteMany();
  await prisma.rolePermission.createMany({
    data: allPerms.map(({ id }) => ({
      roleId: idOf("super-admin"),
      permissionId: id,
    })),
  });
  await prisma.rolePermission.createMany({
    data: adminPerms.map(({ id }) => ({
      roleId: idOf("admin"),
      permissionId: id,
    })),
  });
  await prisma.rolePermission.createMany({
    data: managerPerms.map(({ id }) => ({
      roleId: idOf("manager"),
      permissionId: id,
    })),
  });
  await prisma.rolePermission.createMany({
    data: staffPerms.map(({ id }) => ({
      roleId: idOf("staff"),
      permissionId: id,
    })),
  });

  // Seed companies
  const cmpHarita = await prisma.company.upsert({
    where: { code: "cmp-harita" },
    update: {},
    create: { code: "cmp-harita", name: "Harita Lygend" },
  });
  const cmpObicom = await prisma.company.upsert({
    where: { code: "cmp-obicom" },
    update: {},
    create: { code: "cmp-obicom", name: "OBICOM" },
  });

  // Assign super-admin for requested usernames
  const superAdminRoleId = idOf("super-admin");
  const superAdmins = ["D0525000109", "DD052500"];
  for (const username of superAdmins) {
    await prisma.userRole.upsert({
      where: {
        username_roleId_companyId: {
          username,
          roleId: superAdminRoleId,
          companyId: cmpHarita.id,
        },
      },
      update: {},
      create: { username, roleId: superAdminRoleId, companyId: cmpHarita.id },
    });
    await prisma.userRole.upsert({
      where: {
        username_roleId_companyId: {
          username,
          roleId: superAdminRoleId,
          companyId: cmpObicom.id,
        },
      },
      update: {},
      create: { username, roleId: superAdminRoleId, companyId: cmpObicom.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

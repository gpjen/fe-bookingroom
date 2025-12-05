// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const permissionKeys = [
    "dashboard:read",
    "calendar:read",
    "booking:read",
    "booking-mine:read",
    "booking-request:read",
    "reports:read",
    "payments:read",
    "property:read",
    "companies:read",
    "area:read",
    "property:read",
    "property:read",
    "property:read",
    "admin:read",
    "admin-roles",
    "admin-company",
    "admin-users",
    "admin-settings",
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
          "booking-mine:read",
          "booking-request:read",
          "reports:read",
          "payments:read",
          "property:read",
          "companies:read",
          "area:read",
          "property:read",
          "property:read",
          "property:read",
          "admin:read",
          "admin-users",
          "admin-settings",
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
          "booking-request:read",
          "reports:read",
          "payments:read",
          "property:read",
          "companies:read",
          "area:read",
          "property:read",
          "property:read",
          "property:read",
        ],
      },
    },
    select: { id: true },
  });
  const staffPerms = await prisma.permission.findMany({
    where: {
      key: { in: ["dashboard:read", "calendar:read", "booking-mine:read"] },
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
    where: { code: "dcm" },
    update: {},
    create: { code: "dcm", name: "PT. Dharma Cipta Mulia" },
  });
  const cmpObicom = await prisma.company.upsert({
    where: { code: "hpal" },
    update: {},
    create: { code: "hpal", name: "PT. Halmahera Persada Lygend" },
  });

  // Assign super-admin for requested usernames
  const superAdminRoleId = idOf("super-admin");
  const superAdmins = ["D0525000109"];
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

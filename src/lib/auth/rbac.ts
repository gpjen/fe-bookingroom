import type { Permission, Role, Company, UserAccess } from "@/types/auth";

const ROLES: Record<string, Role> = {
  "super-admin": {
    name: "super-admin",
    permissions: ["*"],
  },
  admin: {
    name: "admin",
    permissions: [
      "dashboard:read",
      "calendar:read",
      "area:read",
      "booking:read",
      "booking-mine:read",
      "booking-request:read",
      "property:read",
      "reports:read",
      "payments:read",
      "admin:read",
    ],
  },
  manager: {
    name: "manager",
    permissions: [
      "dashboard:read",
      "calendar:read",
      "area:read",
      "booking:read",
      "booking-mine:read",
      "booking-request:read",
      "property:read",
      "reports:read",
    ],
  },
  staff: {
    name: "staff",
    permissions: ["dashboard:read", "calendar:read", "booking-mine:read"],
  },
};

export const COMPANIES: Company[] = [
  { id: "cmp-harita", name: "Harita Lygend" },
  { id: "cmp-obicom", name: "OBICOM" },
];

const MOCK_ACCESS: (UserAccess & { username?: string })[] = [
  {
    userId: "superadmin@obalab.local",
    username: "D0525000109",
    roles: ["super-admin"],
    companies: ["cmp-harita", "cmp-obicom"],
  },
  {
    userId: "superadmin2@obalab.local",
    username: "DD052500",
    roles: ["super-admin"],
    companies: ["cmp-harita", "cmp-obicom"],
  },
  {
    userId: "admin@obalab.local",
    username: "ADMIN",
    roles: ["admin"],
    companies: ["cmp-harita", "cmp-obicom"],
  },
  {
    userId: "manager@obalab.local",
    username: "MANAGER",
    roles: ["manager"],
    companies: ["cmp-harita"],
  },
  {
    userId: "staff@obalab.local",
    username: "STAFF",
    roles: ["staff"],
    companies: ["cmp-obicom"],
  },
];

export function resolvePermissions(
  roles: string[],
  explicit?: Permission[]
): Permission[] {
  const perms = new Set<Permission>();
  roles.forEach((r) => {
    const role = ROLES[r];
    if (role) role.permissions.forEach((p) => perms.add(p));
  });
  explicit?.forEach((p) => perms.add(p));
  return Array.from(perms);
}

export function getMockAccessForUser(email?: string, name?: string) {
  const id = (email || name || "").toLowerCase();
  const found = MOCK_ACCESS.find((u) => id.includes(u.userId.split("@")[0]));
  if (found) {
    return {
      permissions: resolvePermissions(found.roles, found.explicitPermissions),
      companies: found.companies,
      roles: found.roles,
    };
  }
  // default staff access
  return {
    permissions: resolvePermissions(["staff"]),
    companies: ["cmp-obicom"],
    roles: ["staff"],
  };
}

export function getAccessForUsername(username?: string) {
  const key = (username || "").toUpperCase();
  const found = MOCK_ACCESS.find((u) => u.username === key);
  if (found) {
    return {
      permissions: resolvePermissions(found.roles, found.explicitPermissions),
      companies: found.companies,
      roles: found.roles,
    };
  }
  return {
    permissions: resolvePermissions(["staff"]),
    companies: ["cmp-obicom"],
    roles: ["staff"],
  };
}

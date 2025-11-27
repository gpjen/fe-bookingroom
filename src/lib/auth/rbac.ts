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
    ],
  },
  manager: {
    name: "manager",
    permissions: [
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
  staff: {
    name: "staff",
    permissions: ["dashboard:read", "calendar:read", "booking-mine:read"],
  },
  viewer: {
    name: "viewer",
    permissions: ["dashboard:read", "calendar:read"],
  },
};

export const COMPANIES: Company[] = [
  { id: "dcm", name: "PT. Dharma Cipta Mulia" },
  { id: "hpal", name: "PT. Halmahera Persada Lygend" },
];

const MOCK_ACCESS: (UserAccess & { username?: string })[] = [
  {
    userId: "superadmin@obalab.local",
    username: "D0525000109",
    roles: ["super-admin"],
    companies: ["dcm", "hpal"],
  },
  {
    userId: "staff@obalab.local",
    username: "d12345",
    roles: ["staff"],
    companies: ["hpal"],
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
    permissions: resolvePermissions(["viewer"]),
    companies: ["hpal", "dcm"],
    roles: ["viewer"],
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
    permissions: resolvePermissions(["viewer"]),
    companies: ["hpal", "dcm"],
    roles: ["viewer"],
  };
}

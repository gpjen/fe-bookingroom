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
      "booking:read",
      "booking-calendar:read",
      "booking-all:read",
      "booking-mine:read",
      "booking-request:read",
      "building:read",
      "reports:read",
      "property:read",
      "companies:read",
      "area:read",
      "options-type:read",
      "admin:read",
      "admin-users:read",
      "admin-roles:read",
      "admin-company:read",
      "admin-settings:read",
      "admin-logs:read",
    ],
  },
  manager: {
    name: "manager",
    permissions: [
      "dashboard:read",
      "booking:read",
      "booking-calendar:read",
      "booking-all:read",
      "booking-mine:read",
      "booking-request:read",
      "building:read",
      "reports:read",
      "property:read",
      "companies:read",
      "area:read",
      "options-type:read",
      "admin:read",
      "admin-users:read",
      "admin-roles:read",
      "admin-company:read",
      "admin-settings:read",
      "admin-logs:read",
    ],
  },
  staff: {
    name: "staff",
    permissions: ["dashboard:read", "booking-calendar:read", "booking:read", "booking-mine:read", "booking-request:read"],
  },
  viewer: {
    name: "viewer",
    permissions: ["dashboard:read", "booking:read", "booking-mine:read"] ,
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

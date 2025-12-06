import type { Permission, Role, Company, UserAccess } from "@/types/auth";

const ROLES: Record<string, Role> = {
  "super-admin": {
    name: "super-admin",
    permissions: ["*"],
  },
  admin: {
    name: "admin",
    permissions: [
      "home:read",
      "dashboard:read",
      "booking:read",
      "booking-request:read",
      "booking-occupant:read",
      "booking-mine:read",
      "building:read",
      "reports:read",
      "property:read",
      "companies:read",
      "area:read",
      "options-type:read",
      "admin:read",
      "admin-users:read",
      "admin-roles:read",
      "admin-settings:read",
      "admin-logs:read",
      "notifications:read",
    ],
  },
  staff: {
    name: "staff",
    permissions: [
      "home:read",
      "booking:read",
      "booking-mine:read",
      "notifications:read",
    ],
  },
};

export const COMPANIES: Company[] = [
  { id: "dcm", name: "PT. Dharma Cipta Mulia" },
  { id: "hpal", name: "PT. Halmahera Persada Lygend" },
];

const MOCK_ACCESS: (UserAccess & { username?: string })[] = [
  {
    userId: "gandijen@gmail.com",
    username: "D0525000109",
    roles: ["super-admin"],
    companies: ["dcm", "hpal"],
  },
  {
    userId: "staff@obalab.local",
    username: "D123456",
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
}

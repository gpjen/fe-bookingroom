import { Permission, Role, UserAccess } from "@/types/auth";

export const ROLES: Record<string, Role> = {
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
      "admin-roles:write",
      "admin-settings:read",
      "admin-settings:write",
      "admin-logs:read",
      "notifications:read",
    ],
  },
  staff: {
    name: "staff",
    permissions: [
      "home:read",
      "booking-request:create",
      "booking:read",
      "booking-mine:read",
      "notifications:read",
    ],
  },
};

export const MOCK_ACCESS: (UserAccess & { username?: string })[] = [
  {
    userId: "gandijen@gmail.com",
    username: "D0525000109",
    roles: ["super-admin"],
    companies: ["dcm", "hpal"],
  },
  {
    userId: "staff@obalab.local",
    username: "D12345",
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

export function getUserAccess(username: string) {
  const usernameKey = (username || "").toLowerCase();
  return MOCK_ACCESS.find((u) => u.username?.toLowerCase() === usernameKey);
}

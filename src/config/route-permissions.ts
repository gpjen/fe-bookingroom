export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/home": ["home:read"],
  "/dashboard": ["dashboard:read"],

  // Booking
  "/booking/request": ["booking-request:read"],
  "/booking/occupant-status": ["booking-occupant-status:read"],
  "/booking/mine": ["booking-mine:read"],

  // Property
  "/properties/buildings": ["building:read"],
  "/properties/companies": ["companies:read"],
  "/properties/areas": ["area:read"],
  "/properties/options-types": ["options-type:read"],

  // Admin
  "/admin/users": ["admin-users:read"],
  "/admin/roles": ["admin-roles:read"],
  "/admin/settings": ["admin-settings:read"],
  "/admin/logs": ["admin-logs:read"],

  // Other
  "/reports": ["reports:read"],
  "/notifications": ["notifications:read"],
  // Add other routes as needed
};

// Helper to find required permission for a path
export function getRequiredPermissions(pathname: string): string[] | undefined {
  // 1. Exact match
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // 2. Prefix match (optional, if we want /booking/request/123 to inherit)
  // For now we might stick to exact or handle sub-routes logic here.
  // Simple logic: Check keys that match start of pathname
  const sortedKeys = Object.keys(ROUTE_PERMISSIONS).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (pathname === key || pathname.startsWith(key + "/")) {
      return ROUTE_PERMISSIONS[key];
    }
  }

  return undefined;
}

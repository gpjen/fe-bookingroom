# Permission System Documentation

This project uses a client-side permission system backed by an API endpoint, with server-side API protection.

## Overview

- **Source**: `/api/permissions` (Mocked DB + Shared Logic in `@/lib/auth/mock-db`).
- **Client**: `PermissionsProvider` fetches and provides context.
- **Protection**: `AuthGuard` (Routes), `PermissionGate` (UI), and `api-guard` (API).

## 1. Using Permissions in Components

Use the `usePermissions` hook to check permissions in your logic.

```tsx
import { usePermissions } from "@/providers/permissions-provider";

export function MyComponent() {
  const { hasPermission } = usePermissions();

  if (hasPermission(["admin:write"])) {
    // Do something strictly for admins
  }
}
```

## 2. UI Protection (PermissionGate)

Hide elements using `PermissionGate`.

```tsx
import { PermissionGate } from "@/components/auth/permission-gate";

<PermissionGate permissions={["booking:create"]}>
  <Button>Create Booking</Button>
</PermissionGate>;
```

You can also provide a fallback:

```tsx
<PermissionGate
  permissions={["booking:create"]}
  fallback={<span>You cannot create booking</span>}
>
  ...
</PermissionGate>
```

## 3. Route Protection

Routes are protected automatically by `AuthGuard` in `ProtectedLayout`.
Configuration is defined in `src/config/route-permissions.ts`.

To add protection for a new page:

1. Open `src/config/route-permissions.ts`.
2. Add the path and required permission:

```typescript
export const ROUTE_PERMISSIONS = {
  // ...
  "/new-feature": ["feature:read"],
};
```

## 4. API Protection

To protect API routes, utilize the `checkApiPermission` helper.

```typescript
import { checkApiPermission } from "@/lib/auth/api-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const permCheck = await checkApiPermission("admin:read");
  if (permCheck.error) return permCheck.error;

  // ... Proceed with sensitive logic
  return NextResponse.json({ success: true });
}
```

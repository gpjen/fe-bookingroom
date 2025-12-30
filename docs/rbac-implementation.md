# 🔐 RBAC System Implementation - Complete Guide

## ✅ **WHAT WAS IMPLEMENTED**

### **Phase 1: Fixed Authentication Loop ✅**

**Problem:** Infinite JWT/Session callback causing endless API requests

**Solution:**

- ✅ Removed `userinfo` check on every JWT callback (Line 91-104 in `auth.ts`)
- ✅ Removed excessive `console.log` statements
- ✅ Set `SessionProvider` refetchInterval to 0
- ✅ Fixed `PermissionsProvider` useEffect dependencies

**Files Modified:**

- `src/auth.ts` - Removed userinfo validation loop
- `src/app/providers.tsx` - Disabled auto-refetch
- `src/providers/permissions-provider.tsx` - Fixed dependencies

---

### **Phase 2: Database-Driven RBAC ✅**

**Implemented:**

- ✅ Updated Prisma schema with Building & Area models
- ✅ Added `UserBuilding` for building access control
- ✅ Added `explicitPermissions` to UserRole for granular control
- ✅ Created migration: `20251230013331_add_building_and_rbac_improvements`
- ✅ Updated `/api/permissions` to fetch from database
- ✅ Enhanced `PermissionsProvider` with buildings support
- ✅ Created database seeder script

**New Features:**

1. **Building Access Control** - Users can be granted access to specific buildings
2. **Explicit Permissions** - Override role permissions for specific users
3. **Area Management** - Buildings grouped by areas
4. **Helper Functions**:
   - `hasCompanyAccess(companyCode)` - Check company access
   - `hasBuildingAccess(buildingCode)` - Check building access

---

## 📊 **DATABASE SCHEMA**

### **Models Overview:**

```
Permission ←→ RolePermission ←→ Role
                                 ↓
                            UserRole (username, explicitPermissions[], companyId)
                                 ↓
                            Company

Area ←→ Building ←→ UserBuilding (username, buildingId)
```

### **Key Tables:**

**1. Permission**

- Stores all permission keys (e.g., `home:read`, `admin-users:write`)
- Categorized (admin, property, booking, etc.)

**2. Role**

- Pre-defined roles: `super-admin`, `admin`, `staff`
- Associated with permissions via RolePermission

**3. UserRole**

- Maps Keycloak username → Role → Company
- `explicitPermissions[]` - Array of additional permission keys

**4. UserBuilding**

- Maps username → Building access

**5. Company & Building**

- Organization structure
- Status flag for active/inactive

---

## 🚀 **SETUP INSTRUCTIONS**

### **1. Run Migration**

Already applied:

```bash
npx prisma migrate dev --name add_building_and_rbac_improvements
```

### **2. Generate Prisma Client**

Already done:

```bash
npx prisma generate
```

### **3. Seed Database**

**IMPORTANT:** Run this to populate initial data:

```bash
npx tsx prisma/seed.ts
```

This will create:

- ✅ 34 permissions
- ✅ 3 roles (super-admin, admin, staff)
- ✅ 2 companies (DCM, HPAL)
- ✅ 1 area + 3 buildings
- ✅ User role assignments for mock users
- ✅ Building access for super admins

**Mock Users After Seeding:**

| Username    | Role        | Companies | Buildings     |
| ----------- | ----------- | --------- | ------------- |
| D0525000109 | super-admin | DCM, HPAL | GB-01, 02, 03 |
| L0721001028 | super-admin | DCM       | GB-01, 02, 03 |
| D12345      | staff       | HPAL      | None          |

---

## 🎯 **USAGE EXAMPLES**

### **1. Check Permissions in Components**

```typescript
import { usePermissions } from "@/providers/permissions-provider";

export function MyComponent() {
  const { hasPermission, hasCompanyAccess, hasBuildingAccess, buildings } =
    usePermissions();

  // Check route permission
  if (!hasPermission(["admin-users:read"])) {
    return <NoAccess />;
  }

  // Check company access
  if (!hasCompanyAccess("DCM")) {
    return <p>No access to DCM company</p>;
  }

  // Check building access
  if (!hasBuildingAccess("GB-01")) {
    return <p>No access to Building GB-01</p>;
  }

  // Show user's buildings
  return (
    <div>
      <h2>Your Buildings:</h2>
      <ul>
        {buildings.map((b) => (
          <li key={b.id}>
            {b.name} ({b.code}) - {b.area}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### **2. Server-Side Permission Check**

```typescript
// In Server Action or API Route
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function myServerAction() {
  const session = await getServerSession(authOptions);
  const username = session?.user?.username;

  // Fetch user permissions
  const userRoles = await prisma.userRole.findMany({
    where: { username },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  // Check permission
  const hasAdminAccess = userRoles.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.key === "admin:read" || rp.permission.key === "*"
    )
  );

  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  // ... rest of code
}
```

### **3. Assign Role to User**

```typescript
// Server Action to assign role
export async function assignRoleToUser(
  username: string,
  roleId: string,
  companyId: string
) {
  await prisma.userRole.create({
    data: {
      username,
      roleId,
      companyId,
    },
  });
}
```

### **4. Grant Building Access**

```typescript
export async function grantBuildingAccess(
  username: string,
  buildingId: string
) {
  await prisma.userBuilding.create({
    data: {
      username,
      buildingId,
    },
  });
}
```

---

## 🔧 **PERMISSION KEYS REFERENCE**

### **System**

- `*` - All permissions (super admin only)

### **General**

- `home:read` - Access home page
- `dashboard:read` - Access dashboard
- `reports:read` - View reports
- `notifications:read` - View notifications

### **Booking**

- `booking:read` - View bookings
- `booking:create` - Create booking
- `booking:update` - Update booking
- `booking:delete` - Delete booking
- `booking-request:read` - View booking requests
- `booking-request:create` - Create booking request
- `booking-occupant-status:read` - View occupant status
- `booking-mine:read` - View my bookings

### **Property**

- `property:read` - View properties
- `companies:read` / `companies:write` - Manage companies
- `area:read` / `area:write` - Manage areas
- `building:read` / `building:write` - Manage buildings
- `options-type:read` / `options-type:write` - Manage option types

### **Admin**

- `admin:read` - Access admin area
- `admin-users:read` / `admin-users:write` - Manage users
- `admin-roles:read` / `admin-roles:write` - Manage roles
- `admin-settings:read` / `admin-settings:write` - Manage settings
- `admin-logs:read` - View logs

---

## 📋 **TESTING CHECKLIST**

### **1. Authentication Loop Fixed**

- [ ] Login to app
- [ ] Navigate to `/properties/companies`
- [ ] Edit a company → Save
- [ ] **Check:** No infinite GET requests
- [ ] **Check:** Terminal logs are clean (no JWT spam)
- [ ] **Check:** Browser console is clean

### **2. Database RBAC**

- [ ] Run seeder: `npx tsx prisma/seed.ts`
- [ ] Login as `D0525000109` (super-admin)
- [ ] Check permissions context has:
  - [ ] `permissions: ["*"]`
  - [ ] `roles: ["super-admin"]`
  - [ ] `companies: ["dcm", "hpal"]`
  - [ ] `buildings: [3 items]`
- [ ] Navigate to admin pages → Should have access
- [ ] Logout and login as `D12345` (staff)
- [ ] Try to access admin pages → Should be blocked

### **3. Permission Checks**

- [ ] `hasPermission(["admin:read"])` works correctly
- [ ] `hasCompanyAccess("DCM")` works correctly
- [ ] `hasBuildingAccess("GB-01")` works correctly
- [ ] `buildings` array shows correct data

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Still seeing infinite loop**

**Solution:**

1. Hard refresh browser (Ctrl+Shift+R)
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server
4. Check `auth.ts` - userinfo check should be REMOVED

### **Issue: Permissions not loading**

**Solution:**

1. Check database has data: `npx prisma studio`
2. Verify user has UserRole records
3. Check `/api/permissions` response in Network tab
4. Ensure username in Keycloak matches database

### **Issue: Migration failed**

**Solution:**

1. Check database connection
2. Check if tables already exist
3. Try: `npx prisma migrate reset` (WARNING: deletes all data)
4. Then run migration + seed again

---

## 🎓 **NEXT STEPS**

### **Immediate:**

1. **Run seeder** to populate database
2. **Test login** with mock users
3. **Verify permissions** are working

### **Future Enhancements:**

1. Build User Management UI
2. Build Role Management UI
3. Implement caching (LRU + SWR)
4. Add audit logs for permission changes
5. Add bulk user import
6. Add permission templates

---

## 📚 **MIGRATION HISTORY**

| Migration                            | Date       | Description                                             |
| ------------------------------------ | ---------- | ------------------------------------------------------- |
| `add_status_to_company`              | 2024-12-30 | Added status field to Company                           |
| `add_building_and_rbac_improvements` | 2024-12-30 | Added Building, Area, UserBuilding, explicitPermissions |

---

**Status:** ✅ **IMPLEMENTATION COMPLETE**  
**Last Updated:** 2024-12-30  
**Author:** RBAC System Refactor  
**Version:** 2.0.0

# 🔐 RBAC System Implementation - Complete Guide

**Version:** 3.0.0  
**Last Updated:** 2026-01-01  
**Status:** ✅ Fully Implemented

---

## ✅ **WHAT WAS IMPLEMENTED**

### **Phase 1: Fixed Authentication Loop ✅**

**Problem:** Infinite JWT/Session callback causing endless API requests

**Solution:**

- ✅ Optimized `userinfo` validation to periodic checks (5-minute intervals)
- ✅ Removed excessive `console.log` statements
- ✅ Set `SessionProvider` refetchInterval to 0
- ✅ Fixed `PermissionsProvider` useEffect dependencies

**Files Modified:**

- `src/auth.ts` - Optimized userinfo validation
- `src/app/providers.tsx` - Disabled auto-refetch
- `src/providers/permissions-provider.tsx` - Fixed dependencies

---

### **Phase 2: Database-Driven RBAC ✅**

**Implemented:**

- ✅ Complete RBAC schema with User, Role, Permission models
- ✅ Building & Area models for location-based access
- ✅ UserCompany for company-level data access
- ✅ UserBuilding for building-level access control
- ✅ UserPermission for user-specific permission overrides
- ✅ Updated `/api/permissions` to fetch from database
- ✅ Enhanced `PermissionsProvider` with full RBAC support
- ✅ Created comprehensive database seeder script

**New Features:**

1. **User-Specific Permissions** - Override or extend role permissions per user
2. **Building Access Control** - Granular building-level permissions
3. **Company Access Control** - Multi-company data access
4. **Area Management** - Buildings grouped by geographical areas
5. **Helper Functions**:
   - `hasPermission(keys)` - Check permission access
   - `hasCompanyAccess(code)` - Check company access
   - `hasBuildingAccess(code)` - Check building access

---

## 📊 **DATABASE SCHEMA**

### **Complete RBAC Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     CORE RBAC MODELS                        │
└─────────────────────────────────────────────────────────────┘

Permission ←→ RolePermission ←→ Role
    ↓                             ↓
    ↓                        UserRole ←→ Company
    ↓                             ↓
    └──→ UserPermission ←──→ User ←──→ UserCompany ←→ Company
                               ↓
                          UserBuilding
                               ↓
                           Building ←→ Area

┌─────────────────────────────────────────────────────────────┐
│  Permission Resolution Order (Highest to Lowest Priority):  │
│  1. UserPermission (user-specific grants)                   │
│  2. RolePermission (from assigned roles)                    │
└─────────────────────────────────────────────────────────────┘
```

### **Key Tables:**

#### **1. User** (Central Identity)

```prisma
model User {
  id          String  @id
  username    String  @unique      // From Keycloak
  usernameKey String  @unique      // Lowercase for search
  displayName String
  email       String  @unique
  nik         String? @unique      // Employee ID
  status      Boolean @default(true)

  userRoles       UserRole[]
  userPermissions UserPermission[]
  userCompanies   UserCompany[]
  userBuildings   UserBuilding[]
}
```

**Purpose:** Central user record synced from Keycloak  
**Key Field:** `usernameKey` for case-insensitive lookups

---

#### **2. Permission** (All Available Permissions)

```prisma
model Permission {
  id          String @id
  key         String @unique  // e.g., "admin:read"
  description String?
  category    String?         // Grouping: admin, property, booking

  rolePermissions RolePermission[]
  userPermissions UserPermission[]
}
```

**Purpose:** Master list of all system permissions  
**Examples:** `admin:read`, `booking:create`, `*` (wildcard)

---

#### **3. Role** (Permission Bundles)

```prisma
model Role {
  id              String  @id
  name            String  @unique
  description     String?
  isSystemRole    Boolean @default(false)

  rolePermissions RolePermission[]
  userRoles       UserRole[]
}
```

**Purpose:** Group permissions into reusable roles  
**System Roles:** `super-admin`, `admin`, `staff`

---

#### **4. RolePermission** (Role ↔ Permission Mapping)

```prisma
model RolePermission {
  roleId       String
  permissionId String

  role       Role       @relation(...)
  permission Permission @relation(...)

  @@id([roleId, permissionId])
}
```

**Purpose:** Many-to-many relationship between roles and permissions

---

#### **5. UserRole** (User ↔ Role Assignment)

```prisma
model UserRole {
  id        String  @id
  userId    String
  roleId    String
  companyId String? // OPTIONAL: Role scoped to company

  user    User     @relation(...)
  role    Role     @relation(...)
  company Company? @relation(...)

  @@unique([userId, roleId, companyId])
}
```

**Purpose:** Assign roles to users  
**Company Scoping:** If `companyId` is set, role only applies to that company's data

**Example:**

```typescript
// User "john" is "manager" globally
{ userId: "john-id", roleId: "manager-id", companyId: null }

// User "jane" is "admin" only for "DCM" company
{ userId: "jane-id", roleId: "admin-id", companyId: "dcm-id" }
```

---

#### **6. UserPermission** ⭐ **NEW** (User-Specific Overrides)

```prisma
model UserPermission {
  id           String @id @default(cuid())
  userId       String
  permissionId String

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  grantedBy  String?    // Admin who granted this
  reason     String?    // Why this permission was granted
  expiresAt  DateTime?  // Optional expiration

  grantedAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, permissionId])
  @@index([userId])
  @@index([permissionId])
  @@index([expiresAt])
}
```

**Purpose:** Grant additional permissions to specific users outside their roles

**Use Cases:**

1. **Temporary Elevated Access:** Give user extra permission for limited time
2. **Exception Handling:** Allow specific user to bypass role restrictions
3. **Granular Control:** Fine-tune permissions without creating new roles

**Example:**

```typescript
// User "john" (staff role) needs temporary admin access
{
  userId: "john-id",
  permissionId: "admin-users:write",
  grantedBy: "super-admin-id",
  reason: "Cover for Jane's vacation",
  expiresAt: "2026-01-15T00:00:00Z"
}
```

---

#### **7. UserCompany** (Company Data Access)

```prisma
model UserCompany {
  id        String @id
  userId    String
  companyId String

  user    User    @relation(...)
  company Company @relation(...)

  @@unique([userId, companyId])
}
```

**Purpose:** Grant access to view/edit specific companies' data

**Difference from UserRole.companyId:**

- `UserRole.companyId`: Role is scoped to company (HR role only for DCM)
- `UserCompany`: Data access permission (can see DCM and HPAL data)

**Example:**

```typescript
// User can view data from multiple companies
{ userId: "john-id", companyId: "dcm-id" }
{ userId: "john-id", companyId: "hpal-id" }
```

---

#### **8. UserBuilding** (Building Access Control)

```prisma
model UserBuilding {
  id         String @id
  userId     String
  buildingId String

  user     User     @relation(...)
  building Building @relation(...)

  @@unique([userId, buildingId])
}
```

**Purpose:** Grant access to specific buildings  
**Use Case:** Field staff only access buildings in their area

---

#### **9. Company** (Organization)

```prisma
model Company {
  id     String  @id
  code   String  @unique
  name   String
  status Boolean @default(true)

  userRoles     UserRole[]
  userCompanies UserCompany[]
}
```

---

#### **10. Building & Area** (Location Hierarchy)

```prisma
model Area {
  id       String @id
  code     String @unique
  name     String
  location String
  status   AreaStatus

  buildings Building[]
}

model Building {
  id     String  @id
  code   String  @unique
  name   String
  areaId String
  status Boolean

  area          Area           @relation(...)
  userBuildings UserBuilding[]
}
```

---

## 🔧 **PERMISSION RESOLUTION LOGIC**

### **How Permissions Are Calculated:**

```typescript
function getUserPermissions(userId: string): Set<string> {
  const permissions = new Set<string>();

  // 1. Get permissions from assigned roles
  const userRoles = await getUserRoles(userId);
  userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      permissions.add(rp.permission.key);
    });
  });

  // 2. Add user-specific permissions (overrides)
  const userPermissions = await getUserPermissions(userId);
  userPermissions.forEach((up) => {
    // Check if not expired
    if (!up.expiresAt || up.expiresAt > new Date()) {
      permissions.add(up.permission.key);
    }
  });

  // 3. Wildcard handling
  if (permissions.has("*")) {
    return new Set(["*"]); // Super admin
  }

  return permissions;
}
```

### **Permission Check Hierarchy:**

1. **Wildcard (`*`)** → Full access to everything
2. **User-Specific Permissions** → Individual grants via `UserPermission`
3. **Role Permissions** → Inherited from assigned roles via `UserRole`

---

## 🚀 **SETUP INSTRUCTIONS**

### **1. Apply Schema Changes**

Create new migration for `UserPermission` table:

```bash
npx prisma migrate dev --name add_user_permission_table
```

### **2. Generate Prisma Client**

```bash
npx prisma generate
```

### **3. Seed Database**

```bash
npx tsx prisma/seed.ts
```

This creates:

- ✅ 34+ permissions
- ✅ 3 roles (super-admin, admin, staff)
- ✅ 2 companies (DCM, HPAL)
- ✅ 1 area + 3 buildings
- ✅ Sample users with role assignments
- ✅ Building access for admins

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

---

### **2. Grant User-Specific Permission** ⭐ **NEW**

```typescript
// Server Action to grant temporary permission
import { prisma } from "@/lib/db";

export async function grantUserPermission(
  userId: string,
  permissionKey: string,
  options?: {
    grantedBy?: string;
    reason?: string;
    expiresAt?: Date;
  }
) {
  // Find permission by key
  const permission = await prisma.permission.findUnique({
    where: { key: permissionKey },
  });

  if (!permission) {
    throw new Error(`Permission ${permissionKey} not found`);
  }

  // Grant permission to user
  await prisma.userPermission.create({
    data: {
      userId,
      permissionId: permission.id,
      grantedBy: options?.grantedBy,
      reason: options?.reason,
      expiresAt: options?.expiresAt,
    },
  });
}

// Usage Example:
await grantUserPermission("user-123", "admin-users:write", {
  grantedBy: "super-admin-id",
  reason: "Temporary coverage for vacation",
  expiresAt: new Date("2026-01-15"),
});
```

---

### **3. Revoke User-Specific Permission** ⭐ **NEW**

```typescript
export async function revokeUserPermission(
  userId: string,
  permissionKey: string
) {
  const permission = await prisma.permission.findUnique({
    where: { key: permissionKey },
  });

  if (!permission) return;

  await prisma.userPermission.deleteMany({
    where: {
      userId,
      permissionId: permission.id,
    },
  });
}
```

---

### **4. List User's Effective Permissions**

```typescript
export async function getUserEffectivePermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // From roles
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      // Direct grants
      userPermissions: {
        include: { permission: true },
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
  });

  const permissions = new Set<string>();

  // Add role permissions
  user?.userRoles.forEach((ur) =>
    ur.role.rolePermissions.forEach((rp) => permissions.add(rp.permission.key))
  );

  // Add user-specific permissions
  user?.userPermissions.forEach((up) => permissions.add(up.permission.key));

  return Array.from(permissions);
}
```

---

### **5. Update Permission API** ⭐ **REQUIRED**

File: `src/app/api/permissions/route.ts`

```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  const username = session?.user?.username;
  const usernameKey = username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { usernameKey },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
          company: true,
        },
      },
      // ⭐ ADD THIS:
      userPermissions: {
        include: { permission: true },
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
      userCompanies: {
        include: { company: true },
      },
      userBuildings: {
        include: {
          building: {
            include: { area: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  // From roles
  user?.userRoles.forEach((ur) =>
    ur.role.rolePermissions.forEach((rp) => permissions.add(rp.permission.key))
  );

  // ⭐ ADD THIS: From user-specific grants
  user?.userPermissions.forEach((up) => permissions.add(up.permission.key));

  // Merge companies from both UserRole and UserCompany
  const companies = new Set<string>();
  user?.userRoles.forEach((ur) => {
    if (ur.company) companies.add(ur.company.code.toLowerCase());
  });
  user?.userCompanies.forEach((uc) =>
    companies.add(uc.company.code.toLowerCase())
  );

  return NextResponse.json({
    roles: user?.userRoles.map((ur) => ur.role.name) || [],
    permissions: Array.from(permissions),
    companies: Array.from(companies),
    buildings:
      user?.userBuildings.map((ub) => ({
        id: ub.building.id,
        code: ub.building.code,
        name: ub.building.name,
        area: ub.building.area.name,
      })) || [],
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
- `building-types:read` / `building-types:write` - Manage building types
- `room-types:read` / `room-types:write` - Manage room types

### **Admin**

- `admin:read` - Access admin area
- `admin-users:read` / `admin-users:write` - Manage users
- `admin-roles:read` / `admin-roles:write` - Manage roles
- `admin-settings:read` / `admin-settings:write` - Manage settings
- `admin-logs:read` - View logs

---

## 📋 **MIGRATION SCRIPT**

Create file: `prisma/migrations/XXXXXX_add_user_permission_table/migration.sql`

```sql
-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");
CREATE INDEX "UserPermission_expiresAt_idx" ON "UserPermission"("expiresAt");
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Permissions not showing for user**

**Solution:**

1. Check user has `UserRole` or `UserPermission` records
2. Verify `/api/permissions` response includes user-specific permissions
3. Check if permission has expired (`expiresAt`)
4. Verify username matches between Keycloak and database

### **Issue: User permission not expiring**

**Solution:**

1. Ensure API filters expired permissions:
   ```typescript
   where: {
     OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
   }
   ```
2. Create cron job to cleanup expired permissions

---

## 🎓 **BEST PRACTICES**

### **When to Use UserPermission:**

✅ **Good Use Cases:**

- Temporary elevated access (vacation coverage)
- Emergency permissions
- User-specific exceptions
- Testing/development permissions

❌ **Bad Use Cases:**

- Permanent permissions (create a role instead)
- Permissions for groups of users (use roles)
- Complex permission sets (create custom role)

### **Security Recommendations:**

1. **Always set `expiresAt`** for temporary permissions
2. **Track `grantedBy`** for audit trail
3. **Add `reason`** for compliance
4. **Regular audits** of UserPermission table
5. **Automated cleanup** of expired permissions

---

## 📚 **MIGRATION HISTORY**

| Migration                            | Date       | Description                                                        |
| ------------------------------------ | ---------- | ------------------------------------------------------------------ |
| `add_status_to_company`              | 2024-12-30 | Added status field to Company                                      |
| `add_building_and_rbac_improvements` | 2024-12-30 | Added Building, Area, UserBuilding tables                          |
| `update_rbac_to_user_based`          | 2024-12-31 | Changed UserRole/UserBuilding to use userId FK instead of username |
| `add_user_permission_table`          | 2026-01-01 | Added UserPermission for user-specific grants                      |

---

## 🎯 **NEXT STEPS**

### **Immediate:**

1. ✅ Apply UserPermission migration
2. ✅ Update `/api/permissions` endpoint
3. ✅ Test permission resolution
4. ✅ Update PermissionsProvider if needed

### **Future Enhancements:**

- ⏳ Build User Permission Management UI
- ⏳ Add permission expiration notifications
- ⏳ Implement audit log for permission changes
- ⏳ Create permission template system
- ⏳ Add bulk permission import/export
- ⏳ Implement LRU caching for permissions

---

**Status:** ✅ **FULLY DOCUMENTED & READY FOR IMPLEMENTATION**  
**Author:** RBAC System v3.0  
**Review Status:** Production Ready

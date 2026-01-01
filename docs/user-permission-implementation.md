# 🎯 **IMPLEMENTATION GUIDE: UserPermission Feature**

**Date:** 2026-01-01  
**Status:** Ready to Implement  
**Estimated Time:** 30 minutes

---

## 📋 **WHAT'S NEW**

### **Feature: User-Specific Permission Grants**

Allows administrators to grant **additional permissions** to specific users outside their assigned roles.

**Use Cases:**

1. **Temporary Elevated Access** - Coverage for vacation/sick leave
2. **Exception Handling** - Special cases that don't fit standard roles
3. **Granular Control** - Fine-tune permissions without creating new roles

---

## ✅ **STEP-BY-STEP IMPLEMENTATION**

### **Step 1: Apply Database Migration** (5 min)

#### **Option A: Let Prisma Create Migration (Recommended)**

```bash
# This will detect schema changes and create migration automatically
npx prisma migrate dev --name add_user_permission_table
```

#### **Option B: Manual Migration (If needed)**

Create file: `prisma/migrations/[timestamp]_add_user_permission_table/migration.sql`

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
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key"
    ON "UserPermission"("userId", "permissionId");

-- AddForeignKey
ALTER TABLE "UserPermission"
    ADD CONSTRAINT "UserPermission_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission"
    ADD CONSTRAINT "UserPermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

Then apply:

```bash
npx prisma migrate deploy
```

---

### **Step 2: Generate Prisma Client** (1 min)

```bash
npx prisma generate
```

---

### **Step 3: Update Permission API** (10 min)

File: `src/app/api/permissions/route.ts`

**Find this section (around line 24-51):**

```typescript
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
    userBuildings: {
      include: {
        building: {
          include: { area: true },
        },
      },
    },
  },
});
```

**Add `userPermissions` and `userCompanies` includes:**

```typescript
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
    // ⭐ ADD THIS:
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
```

**Find permission resolution section (around line 69-85):**

```typescript
// Process roles and permissions
user.userRoles.forEach((ur) => {
  // Add role name (unique)
  if (!roles.includes(ur.role.name)) {
    roles.push(ur.role.name);
  }

  // Add permissions from role
  ur.role.rolePermissions.forEach((rp) => {
    permissions.add(rp.permission.key);
  });

  // Add company access (unique)
  if (ur.company && !companies.includes(ur.company.code.toLowerCase())) {
    companies.push(ur.company.code.toLowerCase());
  }
});
```

**Add user-specific permissions AFTER this block:**

```typescript
// ⭐ ADD THIS: Process user-specific permission grants
user.userPermissions?.forEach((up) => {
  permissions.add(up.permission.key);
});

// ⭐ ADD THIS: Merge companies from UserCompany table
user.userCompanies?.forEach((uc) => {
  if (!companies.includes(uc.company.code.toLowerCase())) {
    companies.push(uc.company.code.toLowerCase());
  }
});
```

---

### **Step 4: Restart Dev Server** (1 min)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### **Step 5: Test the Feature** (10 min)

#### **A. Grant Permission via Prisma Studio**

```bash
npx prisma studio
```

1. Open `UserPermission` table
2. Click "Add record"
3. Fill in:
   - `userId`: [select a user]
   - `permissionId`: [select a permission]
   - `grantedBy`: "system-admin"
   - `reason`: "Test user-specific permission"
   - `expiresAt`: [leave empty or set future date]
4. Save

#### **B. Test via Code (Future - in User Management UI)**

```typescript
// Example: Grant temporary admin access
import { prisma } from "@/lib/db";

async function grantTempPermission() {
  const user = await prisma.user.findUnique({
    where: { usernameKey: "d12345" },
  });

  const permission = await prisma.permission.findUnique({
    where: { key: "admin-users:write" },
  });

  if (user && permission) {
    await prisma.userPermission.create({
      data: {
        userId: user.id,
        permissionId: permission.id,
        grantedBy: "super-admin",
        reason: "Temporary coverage",
        expiresAt: new Date("2026-01-15"),
      },
    });
  }
}
```

#### **C. Verify in Browser**

1. Login as the user
2. Open browser console
3. Check permissions context:
   ```javascript
   // In React DevTools or console:
   // Should see the new permission in the list
   ```

---

## 🎨 **FUTURE ENHANCEMENTS** (Optional)

### **1. User Permission Management UI** (Future Task)

Add to User Management page:

- **View User Permissions** - Show both role and user-specific permissions
- **Grant Permission** - Dialog to add user-specific permission
- **Revoke Permission** - Remove user-specific permission
- **Expiration Indicator** - Show which permissions will expire soon

### **2. Automatic Cleanup Job** (Future Task)

```typescript
// cron/cleanup-expired-permissions.ts
import { prisma } from "@/lib/db";

export async function cleanupExpiredPermissions() {
  const result = await prisma.userPermission.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  console.log(`Cleaned up ${result.count} expired permissions`);
}

// Schedule this to run daily
```

### **3. Permission Audit Log** (Future Task)

Track all permission changes:

- Who granted/revoked
- When
- Reason
- Expiration

---

## 📊 **DECISION MATRIX**

| Scenario                                      | Use Role              | Use UserPermission       |
| --------------------------------------------- | --------------------- | ------------------------ |
| User needs admin access permanently           | ✅ Assign admin role  | ❌                       |
| User needs temporary elevated access (1 week) | ❌                    | ✅ Grant with expiration |
| Group of users need same permissions          | ✅ Create/assign role | ❌                       |
| One user needs exception to role rules        | ❌/⚠️                 | ✅                       |
| User has vacation coverage responsibility     | ❌                    | ✅ With expiration       |
| Testing new permissions before creating role  | ❌                    | ✅ Temporary grant       |

---

## 🧪 **TESTING CHECKLIST**

- [ ] Migration applied successfully
- [ ] Prisma client regenerated
- [ ] `/api/permissions` includes user-specific permissions
- [ ] Expired permissions are filtered out
- [ ] Companies merged from both UserRole and UserCompany
- [ ] Permission resolution order: UserPermission > RolePermission
- [ ] User with user-specific permission can access protected features
- [ ] Revoked user permission removes access immediately

---

## 🚨 **ROLLBACK PLAN** (If Issues Occur)

If you encounter issues, you can rollback:

```bash
# See migration history
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 📈 **SUCCESS METRICS**

After implementation, you should be able to:

1. ✅ Grant temporary elevated access to users
2. ✅ Override role permissions for specific users
3. ✅ Track who granted permissions and why
4. ✅ Set expiration dates for permissions
5. ✅ Merge permissions from multiple sources (roles + user-specific)

---

**Next Action:** Run `npx prisma migrate dev --name add_user_permission_table`  
**Estimated Impact:** Low risk - additive change, no existing data affected  
**Rollback Available:** Yes - migration can be reverted if needed

# 🔐 Permission System Usage Guide

**Last Updated:** 2026-01-02  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 Overview

Dokumentasi ini menjelaskan cara menggunakan sistem permission di frontend untuk:

- **Hide/Show** tombol, menu, atau elemen UI
- **Disable** aksi berdasarkan permission
- **Filter** data berdasarkan company atau building access
- **Protect** halaman dari akses tidak sah

---

## 🧩 Komponen & Hooks yang Tersedia

### 1. `usePermissions()` Hook

Hook utama untuk mengakses semua data permission user.

```typescript
import { usePermissions } from "@/providers/permissions-provider";

const {
  permissions, // string[] - Semua permission keys
  roles, // string[] - Semua role names
  companies, // string[] - Company codes yang diakses
  buildings, // Building[] - Buildings yang diakses
  isLoading, // boolean - Status loading
  hasPermission, // (required?: string[]) => boolean
  hasCompanyAccess, // (companyCode: string) => boolean
  hasBuildingAccess, // (buildingCode: string) => boolean
} = usePermissions();
```

### 2. `<PermissionGate>` Component

Wrapper component untuk conditional rendering berdasarkan permission.

```typescript
import { PermissionGate } from "@/components/auth/permission-gate";

<PermissionGate
  permissions={["permission:key"]} // Required permissions (OR logic)
  fallback={<FallbackComponent />} // Optional: Show when no access
>
  <ProtectedContent />
</PermissionGate>;
```

### 3. `<AuthGuard>` Component

Page-level protection yang redirect ke `/no-access` jika tidak authorized.

```typescript
import { AuthGuard } from "@/components/auth/auth-guard";

// Sudah digunakan di (protected)/layout.tsx
<AuthGuard>{children}</AuthGuard>;
```

---

## 🎯 Use Cases & Examples

### Use Case 1: Hide/Show Button

**Skenario:** Tampilkan tombol "Add" hanya jika user punya permission `building:write`

#### Menggunakan `<PermissionGate>` (Recommended)

```tsx
"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function BuildingHeader() {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Buildings</h1>

      {/* Tombol hanya muncul jika punya building:write */}
      <PermissionGate permissions={["building:write"]}>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Building
        </Button>
      </PermissionGate>
    </div>
  );
}
```

#### Menggunakan `hasPermission()` Hook

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function BuildingHeader() {
  const { hasPermission, isLoading } = usePermissions();

  const canCreate = hasPermission(["building:write"]);

  if (isLoading) return <Skeleton className="h-10 w-32" />;

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Buildings</h1>

      {canCreate && (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Building
        </Button>
      )}
    </div>
  );
}
```

---

### Use Case 2: Disable Button (Instead of Hide)

**Skenario:** Tampilkan tombol tapi disable jika tidak punya permission

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ActionButtons() {
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission(["building:write"]);
  const canDelete = hasPermission(["building:delete"]);

  return (
    <div className="flex gap-2">
      {/* Disable dengan tooltip penjelasan */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            {" "}
            {/* Wrapper untuk disabled button */}
            <Button disabled={!canEdit}>Edit</Button>
          </span>
        </TooltipTrigger>
        {!canEdit && (
          <TooltipContent>
            Anda tidak memiliki akses untuk mengedit
          </TooltipContent>
        )}
      </Tooltip>

      <Button variant="destructive" disabled={!canDelete}>
        Delete
      </Button>
    </div>
  );
}
```

---

### Use Case 3: Multiple Permissions (OR Logic)

**Skenario:** Tampilkan jika user punya SALAH SATU dari beberapa permission

```tsx
"use client";

import { PermissionGate } from "@/components/auth/permission-gate";

export function AdminSection() {
  return (
    <div>
      {/* Muncul jika punya admin:read ATAU super-admin */}
      <PermissionGate permissions={["admin:read", "*"]}>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3>Admin Panel</h3>
          <p>Konten khusus admin</p>
        </div>
      </PermissionGate>
    </div>
  );
}
```

---

### Use Case 4: AND Logic (Semua Permission Required)

**Skenario:** Tampilkan HANYA jika user punya SEMUA permission yang diperlukan

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";

export function SuperAdminSection() {
  const { hasPermission } = usePermissions();

  // AND logic: harus punya kedua permission
  const hasFullAccess =
    hasPermission(["admin:read"]) && hasPermission(["admin-settings:write"]);

  if (!hasFullAccess) return null;

  return (
    <div className="p-4 bg-red-50 rounded-lg">
      <h3>Super Admin Only</h3>
      <p>Danger zone settings</p>
    </div>
  );
}
```

---

### Use Case 5: Row Actions di Data Table

**Skenario:** Tampilkan action buttons berbeda berdasarkan permission

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import { PermissionGate } from "@/components/auth/permission-gate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";

type Building = { id: string; name: string; code: string };

export function BuildingRowActions({ building }: { building: Building }) {
  const { hasPermission } = usePermissions();

  const canRead = hasPermission(["building:read"]);
  const canEdit = hasPermission(["building:write"]);
  const canDelete = hasPermission(["building:delete", "admin:read"]);

  // Jika tidak ada aksi sama sekali, hide dropdown
  if (!canRead && !canEdit && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canRead && (
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}

        {canEdit && (
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}

        {canDelete && (
          <DropdownMenuItem className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Use Case 6: Conditional Table Column

**Skenario:** Tampilkan kolom "Actions" hanya jika user punya permission untuk aksi apapun

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import { ColumnDef } from "@tanstack/react-table";
import { Building } from "@/types/domain";
import { BuildingRowActions } from "./building-row-actions";

export function useBuildingColumns(): ColumnDef<Building>[] {
  const { hasPermission } = usePermissions();

  const canModify = hasPermission([
    "building:write",
    "building:delete",
    "admin:read",
  ]);

  const baseColumns: ColumnDef<Building>[] = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={row.original.status ? "text-green-600" : "text-red-600"}
        >
          {row.original.status ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Tambahkan kolom Actions hanya jika punya permission
  if (canModify) {
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <BuildingRowActions building={row.original} />,
    });
  }

  return baseColumns;
}
```

---

### Use Case 7: Company-Based Data Filter

**Skenario:** Filter data berdasarkan company access user

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CompanyFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { companies, hasCompanyAccess } = usePermissions();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select Company" />
      </SelectTrigger>
      <SelectContent>
        {/* Hanya tampilkan company yang user punya akses */}
        {companies.map((code) => (
          <SelectItem key={code} value={code}>
            {code.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Penggunaan dengan data filtering
export function DataPage() {
  const { hasCompanyAccess } = usePermissions();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [data, setData] = useState<Item[]>([]);

  // Filter data berdasarkan company access
  const filteredData = data.filter((item) =>
    hasCompanyAccess(item.companyCode)
  );

  return (
    <div>
      <CompanyFilter value={selectedCompany} onChange={setSelectedCompany} />
      <DataTable data={filteredData} />
    </div>
  );
}
```

---

### Use Case 8: Building-Based Access

**Skenario:** Tampilkan konten berdasarkan building access

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";

export function BuildingDashboard() {
  const { buildings, hasBuildingAccess, isLoading } = usePermissions();

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {buildings.map((building) => (
        <div key={building.id} className="p-4 border rounded-lg">
          <h3 className="font-semibold">{building.name}</h3>
          <p className="text-sm text-muted-foreground">Code: {building.code}</p>
          <p className="text-sm text-muted-foreground">Area: {building.area}</p>
        </div>
      ))}

      {/* Cek akses ke building tertentu */}
      {hasBuildingAccess("DORM-A") && (
        <div className="p-4 border-2 border-primary rounded-lg">
          <h3>Special Access: DORM-A</h3>
        </div>
      )}
    </div>
  );
}
```

---

### Use Case 9: Form Field Based on Permission

**Skenario:** Tampilkan field tertentu hanya untuk admin

```tsx
"use client";

import { usePermissions } from "@/providers/permissions-provider";
import { PermissionGate } from "@/components/auth/permission-gate";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function BuildingForm({
  form,
}: {
  form: UseFormReturn<BuildingFormData>;
}) {
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(["admin:read"]);

  return (
    <form>
      {/* Field standar - semua user */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Building Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Field admin-only */}
      <PermissionGate permissions={["admin:read"]}>
        <FormField
          control={form.control}
          name="internalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Code (Admin Only)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PermissionGate>

      {/* Switch yang disabled untuk non-admin */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!isAdmin}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </form>
  );
}
```

---

### Use Case 10: Fallback Content

**Skenario:** Tampilkan konten alternatif jika tidak punya akses

```tsx
"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export function ReportsSection() {
  return (
    <PermissionGate
      permissions={["reports:read"]}
      fallback={
        <Alert variant="default" className="border-yellow-200 bg-yellow-50">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Anda tidak memiliki akses ke bagian Reports. Hubungi administrator
            untuk mendapatkan akses.
          </AlertDescription>
        </Alert>
      }
    >
      <div>
        <h2>Reports Dashboard</h2>
        {/* Konten reports */}
      </div>
    </PermissionGate>
  );
}
```

---

## 📊 Permission Keys Reference

### General

| Key                  | Description                          |
| -------------------- | ------------------------------------ |
| `*`                  | Wildcard - Full access (super admin) |
| `home:read`          | Access home page                     |
| `dashboard:read`     | Access dashboard                     |
| `reports:read`       | View reports                         |
| `notifications:read` | View notifications                   |

### Booking

| Key                            | Description            |
| ------------------------------ | ---------------------- |
| `booking:read`                 | View bookings          |
| `booking:create`               | Create booking         |
| `booking:update`               | Update booking         |
| `booking:delete`               | Delete booking         |
| `booking-request:read`         | View booking requests  |
| `booking-request:create`       | Create booking request |
| `booking-occupant-status:read` | View occupant status   |
| `booking-mine:read`            | View my bookings       |

### Property

| Key                                            | Description               |
| ---------------------------------------------- | ------------------------- |
| `property:read`                                | View properties (general) |
| `companies:read` / `companies:write`           | Manage companies          |
| `area:read` / `area:write`                     | Manage areas              |
| `building:read` / `building:write`             | Manage buildings          |
| `building-types:read` / `building-types:write` | Manage building types     |
| `room-types:read` / `room-types:write`         | Manage room types         |

### Admin

| Key                                            | Description        |
| ---------------------------------------------- | ------------------ |
| `admin:read`                                   | Access admin area  |
| `admin-users:read` / `admin-users:write`       | Manage users       |
| `admin-roles:read` / `admin-roles:write`       | Manage roles       |
| `admin-settings:read` / `admin-settings:write` | Manage settings    |
| `admin-logs:read`                              | View activity logs |

---

## ⚠️ Best Practices

### ✅ DO

```tsx
// 1. Selalu cek isLoading sebelum render conditional
const { hasPermission, isLoading } = usePermissions();
if (isLoading) return <Skeleton />;

// 2. Gunakan PermissionGate untuk UI sederhana
<PermissionGate permissions={["admin:read"]}>
  <AdminButton />
</PermissionGate>

// 3. Gunakan hasPermission() untuk logic kompleks
const canPerformAction = hasPermission(["perm:a"]) && someOtherCondition;

// 4. Berikan fallback yang informatif
<PermissionGate permissions={["..."]} fallback={<NoAccessMessage />}>
```

### ❌ DON'T

```tsx
// 1. Jangan hardcode permission checks di banyak tempat
// Buruk:
if (permissions.includes("admin:read")) { ... }
// Baik:
if (hasPermission(["admin:read"])) { ... }

// 2. Jangan lupa handle loading state
// Buruk:
const canEdit = hasPermission(["edit"]); // Mungkin false saat loading
// Baik:
if (isLoading) return <Skeleton />;
const canEdit = hasPermission(["edit"]);

// 3. Jangan expose sensitive data hanya dengan hide UI
// Selalu validasi di server juga!
```

---

## 🔧 Troubleshooting

### Issue: Permissions selalu kosong

**Penyebab:** User tidak terdaftar di database atau tidak punya role

**Solusi:**

1. Cek apakah user ada di tabel `User`
2. Cek apakah user punya `UserRole`
3. Cek response dari `/api/permissions`

```typescript
// Debug di console
const { permissions, roles } = usePermissions();
console.log("Permissions:", permissions);
console.log("Roles:", roles);
```

### Issue: PermissionGate tidak render children

**Penyebab:** Permission key salah atau user tidak punya permission

**Solusi:**

1. Cek permission key di database (tabel `Permission`)
2. Cek apakah role user punya permission tersebut (tabel `RolePermission`)
3. Tambahkan fallback untuk debugging:

```tsx
<PermissionGate
  permissions={["some:permission"]}
  fallback={<div>No access to: some:permission</div>}
>
  <Content />
</PermissionGate>
```

### Issue: Flash of unauthorized content

**Penyebab:** Komponen render sebelum permissions loaded

**Solusi:** Selalu cek `isLoading`:

```tsx
const { hasPermission, isLoading } = usePermissions();

if (isLoading) {
  return <Skeleton className="h-10 w-full" />;
}

return hasPermission(["admin:read"]) ? <AdminContent /> : null;
```

---

## 📚 Related Documentation

- `auth-and-rbac-implementation.md` - Full RBAC system documentation
- `user-permission-implementation.md` - User-specific permissions
- `structure.md` - Project structure overview

---

**Author:** Permission System Team  
**Review Status:** ✅ Approved for Production

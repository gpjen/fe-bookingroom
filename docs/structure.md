# 📁 Struktur Proyek fe-bookingroom

**Last Updated:** 2026-01-02  
**Version:** 2.0.0

## 📋 Ringkasan

Proyek **fe-bookingroom** adalah aplikasi Booking Room / Property Management System berbasis **Next.js 16+ (App Router)** dengan:

- TypeScript untuk type safety
- Tailwind CSS v4 untuk styling
- Prisma v7 dengan PostgreSQL untuk database
- Keycloak + NextAuth untuk autentikasi
- shadcn/ui + Radix untuk komponen UI

Alias impor `@/*` mengarah ke `src/*` untuk referensi path yang konsisten.

---

## 🌳 Pohon Direktori

```
fe-bookingroom/
├── prisma/
│   ├── schema.prisma         # Definisi semua model database
│   ├── seed.ts               # Script seeding data awal
│   └── migrations/           # File migrasi database
│
├── prisma.config.ts          # Konfigurasi Prisma v7 (datasource, migrations)
│
├── public/
│   ├── bg.webp               # Background image
│   ├── logo_lg.png           # Logo besar
│   └── logo_sm.png           # Logo kecil
│
├── src/
│   ├── app/
│   │   ├── (protected)/      # Route yang memerlukan autentikasi
│   │   │   ├── layout.tsx    # Layout dengan sidebar & header
│   │   │   ├── home/         # Halaman home/landing
│   │   │   ├── dashboard/    # Dashboard analytics
│   │   │   ├── booking/      # Fitur booking
│   │   │   │   ├── request/          # Booking request
│   │   │   │   ├── occupant-status/  # Status penghuni
│   │   │   │   └── mine/            # My bookings
│   │   │   ├── properties/   # Property management
│   │   │   │   ├── companies/        # CRUD Companies
│   │   │   │   ├── areas/           # CRUD Areas
│   │   │   │   ├── buildings/       # CRUD Buildings
│   │   │   │   ├── building-types/  # CRUD Building Types
│   │   │   │   └── room-types/      # CRUD Room Types
│   │   │   ├── admin/        # Admin area
│   │   │   │   ├── users/           # User management
│   │   │   │   ├── roles/           # Role management
│   │   │   │   ├── settings/        # System settings
│   │   │   │   └── logs/            # Activity logs
│   │   │   ├── notifications/# Notification center
│   │   │   └── reports/      # Reports
│   │   │
│   │   ├── _actions/         # Global server actions
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth endpoints
│   │   │   └── permissions/  # Permission API
│   │   ├── no-access/        # Access denied page
│   │   ├── globals.css       # Global styles & Tailwind
│   │   ├── layout.tsx        # Root layout
│   │   ├── providers.tsx     # Root providers (SessionProvider)
│   │   ├── page.tsx          # Landing/login page
│   │   └── not-found.tsx     # 404 page
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (47 files)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── form.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── ... (40+ more)
│   │   ├── layout/           # Layout components
│   │   │   ├── app-header.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-shell.tsx
│   │   │   ├── notification-dropdown.tsx
│   │   │   └── sidebar.tsx
│   │   ├── auth/             # Auth components
│   │   │   ├── auth-guard.tsx
│   │   │   ├── permission-gate.tsx
│   │   │   └── user-menu.tsx
│   │   ├── booking/          # Booking-related components
│   │   │   ├── booking-request-form.tsx
│   │   │   ├── room-availability-dialog.tsx
│   │   │   └── form-parts/
│   │   ├── maps/             # Map components (Leaflet)
│   │   │   ├── map-input.tsx
│   │   │   └── map-control.tsx
│   │   ├── settings/         # Settings components
│   │   │   ├── lang-select.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── home/             # Home page components
│   │   └── common/           # Shared generic components
│   │
│   ├── providers/            # Context providers
│   │   ├── permissions-provider.tsx   # RBAC context
│   │   ├── lang-provider.tsx          # i18n context
│   │   └── theme-provider.tsx         # Theme context
│   │
│   ├── lib/
│   │   ├── db.ts             # Prisma client initialization
│   │   ├── utils.ts          # Utility functions (cn, etc)
│   │   ├── keycloak.ts       # Keycloak configuration
│   │   ├── api/
│   │   │   └── client.ts     # API fetch helper
│   │   └── auth/
│   │       └── (auth helpers)
│   │
│   ├── config/
│   │   ├── index.ts          # App configuration
│   │   └── route-permissions.ts  # Route-based permission mapping
│   │
│   ├── hooks/
│   │   └── use-mobile.ts     # Mobile detection hook
│   │
│   ├── i18n/                 # Internationalization
│   │   ├── en.ts             # English translations
│   │   ├── id.ts             # Indonesian translations
│   │   ├── zh.ts             # Chinese translations
│   │   └── server.ts         # Server-side i18n
│   │
│   ├── types/
│   │   ├── auth.ts           # Auth types
│   │   ├── domain.ts         # Domain entity types
│   │   └── sidebar-types.ts  # Sidebar navigation types
│   │
│   ├── features/             # Feature modules (placeholder)
│   ├── auth.ts               # NextAuth configuration
│   └── proxy.ts              # API proxy config
│
├── docs/                     # Development documentation
│   ├── structure.md          # This file
│   ├── auth-and-rbac-implementation.md
│   ├── prisma.md
│   ├── companies-server-actions.md
│   ├── property_schema_design.md
│   └── user-permission-implementation.md
│
├── .env                      # Prisma CLI environment
├── .env.local                # Runtime environment (Next.js)
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── components.json           # shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── postcss.config.mjs        # PostCSS configuration
├── eslint.config.mjs         # ESLint configuration
├── deploy.sh                 # Deployment script
└── ecosystem.config.js       # PM2 configuration
```

---

## 📂 Penjelasan Direktori

### **Root Files**

| File                  | Keterangan                                         |
| --------------------- | -------------------------------------------------- |
| `prisma.config.ts`    | Konfigurasi Prisma v7 (datasource URL, migrations) |
| `components.json`     | Konfigurasi shadcn/ui                              |
| `deploy.sh`           | Script deploy ke server                            |
| `ecosystem.config.js` | PM2 process manager config                         |

### **prisma/**

| Path            | Keterangan                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| `schema.prisma` | Definisi semua model: User, Role, Permission, Company, Area, Building, etc |
| `seed.ts`       | Script seeding data awal (permissions, roles, companies, sample users)     |
| `migrations/`   | History migrasi database                                                   |

### **src/app/**

| Path                     | Keterangan                                              |
| ------------------------ | ------------------------------------------------------- |
| `(protected)/`           | Route Group untuk halaman yang memerlukan login         |
| `(protected)/layout.tsx` | Layout dengan AppShell (sidebar, header, notifications) |
| `api/auth/`              | NextAuth.js API routes                                  |
| `api/permissions/`       | API untuk fetch user permissions dari database          |
| `_actions/`              | Shared server actions                                   |
| `no-access/`             | Halaman akses ditolak (403)                             |

### **src/components/**

| Path        | Keterangan                                                    |
| ----------- | ------------------------------------------------------------- |
| `ui/`       | 47 komponen shadcn/ui (Button, Input, Dialog, DataTable, etc) |
| `layout/`   | Komponen layout (Header, Sidebar, Notification Dropdown)      |
| `auth/`     | Komponen autentikasi (AuthGuard, PermissionGate, UserMenu)    |
| `booking/`  | Komponen fitur booking                                        |
| `maps/`     | Komponen peta Leaflet untuk input polygon/lokasi              |
| `settings/` | Komponen pengaturan (Theme, Language)                         |

### **src/providers/**

| File                       | Keterangan                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| `permissions-provider.tsx` | Context untuk RBAC (hasPermission, hasCompanyAccess, hasBuildingAccess) |
| `lang-provider.tsx`        | Context untuk multi-language (en, id, zh)                               |
| `theme-provider.tsx`       | Context untuk dark/light theme                                          |

### **src/lib/**

| Path            | Keterangan                                     |
| --------------- | ---------------------------------------------- |
| `db.ts`         | Inisialisasi PrismaClient dengan adapter-pg    |
| `utils.ts`      | Utility functions (`cn()` untuk class merging) |
| `keycloak.ts`   | Konfigurasi Keycloak client                    |
| `api/client.ts` | HTTP client dengan auth header                 |

### **src/config/**

| File                   | Keterangan                           |
| ---------------------- | ------------------------------------ |
| `index.ts`             | Base URL, app name, etc              |
| `route-permissions.ts` | Mapping route → required permissions |

### **src/i18n/**

Multi-language support dengan file per bahasa:

- `en.ts` - English
- `id.ts` - Indonesian
- `zh.ts` - Chinese

---

## 🗃️ Database Schema (Overview)

### **RBAC Models**

- `Role` - Group permissions
- `Permission` - Individual access rights (34+)
- `RolePermission` - Role ↔ Permission mapping
- `User` - Central identity (synced from Keycloak)
- `UserRole` - User ↔ Role assignment (optional company scope)
- `UserPermission` - User-specific permission grants
- `UserCompany` - Multi-company data access
- `UserBuilding` - Building-level access

### **Property Models**

- `Company` - Organizations
- `Area` - Geographical regions (hierarchical, with polygon)
- `Building` - Physical buildings
- `BuildingType` - Building categories (Office, Dormitory, etc)
- `RoomType` - Room categories with bed config

### **System Models**

- `SystemSetting` - Application configuration (singleton)
- `Notification` - Notification messages
- `NotificationRecipient` - User-specific notification status

---

## ⚙️ Tech Stack

| Category      | Technology              | Version |
| ------------- | ----------------------- | ------- |
| Framework     | Next.js                 | 16.1.1  |
| Language      | TypeScript              | 5.x     |
| UI Library    | React                   | 19.2.3  |
| Styling       | Tailwind CSS            | 4.x     |
| UI Components | shadcn/ui + Radix       | Latest  |
| Database      | PostgreSQL + Prisma     | 7.x     |
| Auth          | NextAuth + Keycloak     | 4.24    |
| Forms         | React Hook Form + Zod   | Latest  |
| Tables        | TanStack Table          | 8.x     |
| Charts        | Recharts                | 3.x     |
| Maps          | Leaflet + React-Leaflet | 5.x     |
| Notifications | Sonner                  | 2.x     |
| PDF           | @react-pdf/renderer     | 4.x     |

---

## 🔧 Konvensi Teknis

### **Routing**

- Gunakan **App Router** dengan route groups `(protected)`
- Pages adalah Server Components secara default
- Client Components ditandai dengan `"use client"`

### **Server Actions**

Setiap modul CRUD mengikuti pola:

```
module/
├── page.tsx                    # Server Component (fetch data)
├── _components/
│   ├── module-table.tsx        # Client Component (interactive)
│   └── module-form.tsx         # Client Component (dialog form)
└── _actions/
    └── module.actions.ts       # Server Actions (CRUD)
```

### **Styling**

- Global styles di `globals.css`
- Komponen menggunakan Tailwind classes
- Utility `cn()` untuk conditional classes

### **Auth & Permissions**

```typescript
// Protect component based on permission
<PermissionGate permissions={["admin:read"]}>
  <AdminContent />
</PermissionGate>

// Check permission in code
const { hasPermission } = usePermissions();
if (hasPermission(["admin:read"])) { ... }
```

### **Imports**

```typescript
// ✅ Use aliases
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { usePermissions } from "@/providers/permissions-provider";

// ❌ Avoid relative paths for deep imports
import { Button } from "../../../components/ui/button";
```

---

## 📜 NPM Scripts

```bash
npm run dev           # Development server
npm run dev:insecure  # Dev with TLS bypass (for self-signed certs)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint check
npm run db:seed       # Run database seeder
npm run db:migrate    # Run Prisma migrations
```

---

## 🔐 Environment Variables

### `.env.local` (Runtime - Next.js)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# Keycloak
KEYCLOAK_CLIENT_ID=your-client
KEYCLOAK_CLIENT_SECRET=your-secret
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/your-realm

# API
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### `.env` (Prisma CLI)

```env
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public
```

---

## 🎯 Status Fitur

| Module                    | Status         |
| ------------------------- | -------------- |
| Authentication (Keycloak) | ✅ Done        |
| RBAC System (v3.0)        | ✅ Done        |
| Permission API            | ✅ Done        |
| Companies CRUD            | ✅ Done        |
| Areas CRUD                | ✅ Done        |
| Buildings CRUD            | ✅ Done        |
| Building Types CRUD       | ✅ Done        |
| Room Types CRUD           | ✅ Done        |
| User Management           | ✅ Done        |
| Role Management           | ✅ Done        |
| System Settings           | ✅ Done        |
| Notifications             | ✅ Done        |
| Booking Request           | 🔄 In Progress |
| Occupant Status           | 🔄 In Progress |
| Reports                   | ⏳ Planned     |

---

## 📚 Dokumentasi Terkait

- `auth-and-rbac-implementation.md` - Sistem RBAC lengkap
- `prisma.md` - Setup Prisma v7
- `companies-server-actions.md` - Contoh implementasi Server Actions
- `property_schema_design.md` - Desain schema property
- `user-permission-implementation.md` - Guide implementasi UserPermission

# Companies Module - Server Actions Implementation

## 📋 Overview

Module Companies telah direfactor menggunakan **Next.js 14+ Server Actions** untuk CRUD operations dengan database PostgreSQL via Prisma ORM.

## 🏗️ Architecture

```
properties/companies/
├── page.tsx                          # Server Component (SSR)
├── _components/
│   ├── companies-table.tsx           # Client Component (Interactive Table)
│   └── companies-form.tsx            # Client Component (Form Dialog)
└── _actions/
    └── companies.actions.ts          # Server Actions (CRUD)
```

## 🔄 Data Flow

```
User Interaction (Client)
    ↓
Client Component (companies-table.tsx)
    ↓
Server Action (createCompany/updateCompany/deleteCompany)
    ↓
Validation (Zod Schema)
    ↓
Database Operation (Prisma)
    ↓
Revalidate Path
    ↓
UI Auto-Updates
```

## 🎯 Available Actions

### 1. Get Companies

```typescript
const result = await getCompanies();
// Returns: { success: true, data: Company[] } | { success: false, error: string }
```

### 2. Create Company

```typescript
const result = await createCompany({
  code: "DCM",
  name: "PT. Dharma Cipta Mulia",
  status: true,
});
```

### 3. Update Company

```typescript
const result = await updateCompany(id, {
  code: "DCM",
  name: "PT. Dharma Cipta Mulia Updated",
  status: true,
});
```

### 4. Delete Company

```typescript
const result = await deleteCompany(id);
// Will check for related UserRoles before deleting
```

### 5. Toggle Status

```typescript
const result = await toggleCompanyStatus(id);
```

## 🛡️ Validations

### Code Field

- Min: 2 characters
- Max: 10 characters
- Pattern: `^[A-Z0-9-]+$` (uppercase letters, numbers, dash only)
- Must be unique

### Name Field

- Min: 3 characters
- Max: 100 characters

### Status Field

- Boolean (true = Aktif, false = Tidak Aktif)

## ⚠️ Business Rules

1. **Unique Code**: Kode perusahaan harus unik
2. **Delete Protection**: Perusahaan tidak dapat dihapus jika masih memiliki UserRoles terkait
3. **Auto Uppercase**: Kode otomatis dikonversi ke uppercase

## 🗄️ Database Schema

```prisma
model Company {
  id        String    @id @default(cuid())
  code      String    @unique
  name      String
  status    Boolean   @default(true)
  userRoles UserRole[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

## 🎨 UI Components

### CompaniesTable (Client Component)

- **Features**:
  - Data table with pagination
  - Search by name
  - Filter by status
  - Sortable columns
  - Row actions (Edit/Delete)
  - Delete confirmation dialog

### CompaniesForm (Client Component)

- **Features**:
  - React Hook Form integration
  - Zod validation
  - Auto uppercase for code
  - Loading states
  - Error handling

## 🚀 Usage Example

### In a Server Component

```typescript
import { getCompanies } from "./_actions/companies.actions";

export default async function Page() {
  const result = await getCompanies();

  if (!result.success) {
    return <Error message={result.error} />;
  }

  return <CompaniesTable initialData={result.data} />;
}
```

### In a Client Component

```typescript
"use client";

import { createCompany } from "./_actions/companies.actions";
import { useTransition } from "react";

export function MyComponent() {
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createCompany({
        code: "TEST",
        name: "Test Company",
        status: true,
      });

      if (result.success) {
        console.log("Created:", result.data);
      }
    });
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

## 📦 Dependencies

- `@prisma/client` - ORM
- `zod` - Validation
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Zod integration
- `sonner` - Toast notifications
- `@tanstack/react-table` - Data table

## 🔧 Maintenance

### Adding New Field

1. Update Prisma schema
2. Run migration: `npx prisma migrate dev`
3. Update validation schema in `companies.actions.ts`
4. Update form in `companies-form.tsx`
5. Update table columns in `companies-table.tsx`

### Debug Mode

Check server logs for error details:

```
[CREATE_COMPANY_ERROR] ...
[UPDATE_COMPANY_ERROR] ...
[DELETE_COMPANY_ERROR] ...
```

## ✅ Testing Checklist

- [ ] Create company with valid data
- [ ] Create company with duplicate code (should fail)
- [ ] Update company code to existing code (should fail)
- [ ] Delete company with related users (should fail)
- [ ] Delete company without relations (should succeed)
- [ ] Toggle status
- [ ] Search by name
- [ ] Filter by status
- [ ] Sort by columns
- [ ] Pagination

## 🔐 Security

- ✅ Server-side validation
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React)
- ✅ CSRF protection (Next.js)
- ✅ Type safety (TypeScript)

## 📈 Performance

- ✅ Server-Side Rendering (SSR)
- ✅ Automatic caching
- ✅ Optimistic updates
- ✅ Lazy loading (Suspense)
- ✅ Optimized queries (select specific fields)

---

**Last Updated:** 2025-12-30  
**Author:** Server Actions Refactor  
**Version:** 1.0.0

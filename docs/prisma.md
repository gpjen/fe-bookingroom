# Prisma ORM (v7) – Setup dan Penggunaan

## Ringkasan
- Konfigurasi Prisma v7 menggunakan `prisma.config.ts` (bukan `url` di `schema.prisma`).
- Koneksi Postgres di-setup via env `DATABASE_URL` dan adapter `@prisma/adapter-pg`.
- Model didefinisikan di `prisma/schema.prisma` dalam satu file (praktik umum Prisma).
- Migrasi dan seed dijalankan dengan perintah Prisma CLI.

## Struktur Direktori
```
prisma/
  ├─ schema.prisma          # definisi model
  ├─ prisma.config.ts       # konfigurasi CLI/migrate (v7)
  ├─ migrations/            # file migrasi yang dihasilkan
  └─ seed.js                # script seeding awal
src/lib/db.ts               # inisialisasi PrismaClient dengan adapter-pg
```

## Environment
- Aplikasi: gunakan `.env.local` untuk variabel runtime Next.js.
- CLI Prisma: memuat env dari `.env` saat generate/migrate/seed.

Contoh:
```
# .env.local (dipakai aplikasi)
DATABASE_URL=postgresql://it-apps:TempPass123!@192.168.130.105:5433/booking-room?schema=public

# .env (dipakai Prisma CLI)
DATABASE_URL=postgresql://it-apps:TempPass123!@192.168.130.105:5433/booking-room?schema=public
```

## Konfigurasi Prisma v7
`prisma.config.ts`:
```ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

## Inisialisasi PrismaClient
`src/lib/db.ts`:
```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Definisi Model
- Satu file `schema.prisma` untuk semua model.
- Contoh model role management:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Role {
  id              String          @id @default(cuid())
  name            String          @unique
  description     String?
  rolePermissions RolePermission[]
  userRoles       UserRole[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Permission {
  id              String          @id @default(cuid())
  key             String          @unique
  description     String?
  rolePermissions RolePermission[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

model Company {
  id        String    @id @default(cuid())
  code      String    @unique
  name      String
  userRoles UserRole[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model UserRole {
  id         String   @id @default(cuid())
  username   String
  roleId     String
  companyId  String?
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  company    Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  assignedAt DateTime @default(now())
  @@unique([username, roleId, companyId])
  @@index([username])
}
```

### Menambah Model Baru
1. Tambahkan blok `model` baru di `schema.prisma` mengikuti pola di atas.
2. Jalankan migrasi:
   - `npx prisma migrate dev --name add_<nama_model>`
3. Generate client:
   - `npx prisma generate`

## Migrasi
- Buat/menerapkan migrasi dari perubahan skema:
```
npx prisma migrate dev --name init_roles
```
- Regenerasi client:
```
npx prisma generate
```

## Seeder
- Script: `prisma/seed.js` mengisi permissions, roles, role-permissions, companies, dan assign super-admin.
- Jalankan seed:
```
npx prisma db seed
```
- Script seed di `package.json`:
```
"scripts": { "db:seed": "prisma db seed" },
"prisma": { "seed": "node prisma/seed.js" }
```

## Penggunaan di API/Server
Contoh CRUD roles:
```ts
// GET /api/admin/roles
const items = await prisma.role.findMany({ orderBy: { name: 'asc' } })

// POST /api/admin/roles
await prisma.role.create({ data: { name, description } })
```
Set permissions untuk role:
```ts
const perms = await prisma.permission.findMany({ where: { key: { in: keys } }, select: { id: true } })
const data = perms.map(({ id }: { id: string }) => ({ roleId, permissionId: id }))
await prisma.$transaction([
  prisma.rolePermission.deleteMany({ where: { roleId } }),
  prisma.rolePermission.createMany({ data, skipDuplicates: true }),
])
```

## Tip TypeScript
- Hindari mengimpor tipe model langsung dari `@prisma/client` (tidak diekspor sebagai nama model). Gunakan:
  - `select` untuk tipe eksplisit hasil query (`{ id: string }`)
  - namespace util: `Prisma.<Model>GetPayload<{ select: ... }>` jika diperlukan

## Catatan Versi
- Prisma v7 memindahkan datasource URL ke `prisma.config.ts`. Jangan gunakan `url = env("DATABASE_URL")` di `schema.prisma`.
- Untuk Postgres, gunakan `@prisma/adapter-pg` dan pasang `adapter` di `PrismaClient`.

## Troubleshooting
- Error “Missing DATABASE_URL” saat generate: pastikan `.env` berisi `DATABASE_URL` dan `prisma.config.ts` membaca nilai tersebut.
- Jika migrasi gagal, cek koneksi DB (`host`, `port`, `database`, `user`, `password`) dan hak akses.

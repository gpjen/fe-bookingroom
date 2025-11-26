# Struktur Proyek fe-bookingroom

## Ringkasan
Proyek diinisialisasi dengan Next.js App Router, TypeScript, Tailwind, dan ESLint. Alias impor `@/*` mengarah ke `src/*` agar referensi path konsisten.

## Pohon Direktori
```
fe-bookingroom/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (dashboard)/dashboard/page.tsx
│  │  ├─ (management)/buildings/page.tsx
│  │  ├─ (booking)/bookings/page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  └─ common/.gitkeep
│  ├─ features/
│  │  ├─ booking/.gitkeep
│  │  ├─ management/.gitkeep
│  │  └─ auth/.gitkeep
│  ├─ lib/
│  │  └─ api/client.ts
│  ├─ config/
│  │  └─ index.ts
│  └─ types/
│     └─ domain.ts
├─ eslint.config.mjs
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
├─ README.md
├─ tsconfig.json
└─ docs/
   └─ structure.md
```

## Penjelasan Direktori
- `src/app`: Halaman dan layout berbasis App Router. Route group `(dashboard)`, `(management)`, `(booking)` memisahkan konteks fitur.
- `src/components/common`: Komponen UI generik lintas fitur. Nanti akan ditambah `components/ui` untuk shadcn/ui.
- `src/features/*`: Modul fitur terisolasi (booking, management, auth) menyimpan komponen spesifik fitur, hooks, dan layanan.
- `src/lib/api/client.ts`: Helper fetch API dengan dukungan header `Authorization` dan base URL dari environment.
- `src/config/index.ts`: Konfigurasi aplikasi seperti nama app dan base URL API.
- `src/types/domain.ts`: Definisi tipe domain (Building, Floor, Room, Asset, Booking, Rule, AuditLog).
- `public`: Aset statis.
- `docs`: Dokumentasi pengembangan.

## Konvensi Teknis
- App Router dan Server Components sebagai default; gunakan Client Components untuk interaksi form, state lokal, dan event.
- Styling dengan Tailwind di `globals.css`. Komponen aksesibel akan memakai Radix melalui shadcn/ui.
- Alias impor: gunakan `@/lib`, `@/features/...`, `@/components/...` untuk rute impor.
- API: gunakan `apiFetch(path, options)` untuk semua panggilan ke backend agar konsisten.
- Tipe: semua tipe domain didefinisikan di `src/types` dan diimpor lintas fitur.

## Variabel Lingkungan
Buat file `.env.local` saat menghubungkan ke backend:
```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

## Langkah Berikut
- Integrasi autentikasi Keycloak (pilihan: NextAuth Provider vs keycloak-js) dan middleware proteksi route.
- Inisialisasi shadcn/ui dan menambahkan komponen dasar (Button, Input, Form, Table).
- Menyusun halaman manajemen gedung/kamar/aset dan kalender booking.

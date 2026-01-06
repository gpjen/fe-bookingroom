# 📋 Perencanaan Fitur Booking Room

**Dokumen**: Analisis & Roadmap Implementasi  
**Tanggal**: 6 Januari 2026  
**Status**: Draft v2 - Updated dengan Klarifikasi  
**Last Updated**: 6 Januari 2026, 15:53

---

## 1. Ringkasan Eksekutif

### Kondisi Saat Ini

Modul booking sudah memiliki **UI lengkap** dengan mock data, namun **belum terintegrasi dengan database**. Semua komponen frontend sudah dibuat dan berfungsi dengan data dummy.

### Tujuan

Mengintegraskan UI booking yang sudah ada dengan backend (Prisma + PostgreSQL) sehingga staff dapat melakukan booking room untuk karyawan dan tamu.

---

## 2. Klarifikasi Requirement (Confirmed)

### 2.1 Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STATUS BOOKING                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [PENDING] ──approve──► [APPROVED] ──(auto)──► Occupancy    │
│      │                       │                  created      │
│      │                       │                               │
│      └──reject───► [REJECTED]│                               │
│                              └──cancel──► [CANCELLED]        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  NOTE: Check-in/Check-out dihandle di level Occupancy,      │
│        BUKAN di Booking. Booking hanya sampai APPROVED.      │
└─────────────────────────────────────────────────────────────┘
```

**Status Booking (Simplified):**
| Status | Deskripsi |
|--------|-----------|
| `PENDING` | Menunggu approval |
| `APPROVED` | Disetujui, occupancy dibuat |
| `REJECTED` | Ditolak oleh admin |
| `CANCELLED` | Dibatalkan oleh requester/admin |

### 2.2 Business Rules (Confirmed)

| Rule                    | Value           | Notes                                |
| ----------------------- | --------------- | ------------------------------------ |
| **Maksimal Orang**      | 20 orang        | Per booking request                  |
| **Minimal Booking**     | H-1 (besok)     | Tidak bisa booking untuk hari ini    |
| **Maksimal Durasi**     | 90 hari         | Sudah diimplementasi di UI           |
| **Booking untuk Siapa** | Orang lain      | Staff membuat booking untuk occupant |
| **Tamu (Guest)**        | Wajib Companion | Harus ada info pendamping karyawan   |
| **Attachments**         | Bebas           | Gambar, video, atau dokumen          |

### 2.3 Occupant Type

| Type       | Keterangan             | Companion Required     |
| ---------- | ---------------------- | ---------------------- |
| `EMPLOYEE` | Karyawan perusahaan    | ❌ Tidak               |
| `GUEST`    | Tamu/Vendor/Contractor | ✅ Wajib ada companion |

**Companion** = Karyawan perusahaan yang bertanggung jawab atas tamu.

---

## 3. Database Schema Update

### 3.1 Tambah Enum BookingStatus

```prisma
enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### 3.2 Model Booking (Existing - Sudah Lengkap)

```prisma
model Booking {
  id   String @id @default(cuid())
  code String @unique  // Auto-generated: BK-YYYYMMDD-XXX

  // Requester = Staff yang membuat booking
  requesterUserId     String
  requesterName       String
  requesterNik        String?
  requesterEmail      String?
  requesterPhone      String?
  requesterCompany    String?
  requesterDepartment String?
  requesterPosition   String?

  // Companion = Pendamping untuk tamu (wajib jika ada tamu)
  companionUserId     String?
  companionName       String?
  companionNik        String?
  companionEmail      String?
  companionPhone      String?
  companionCompany    String?
  companionDepartment String?

  // Booking Period
  checkInDate  DateTime @db.Date
  checkOutDate DateTime @db.Date
  purpose      String?
  projectCode  String?

  // Status
  status BookingStatus @default(PENDING)

  // Approval
  approvedBy String?
  approvedAt DateTime?

  // Rejection
  rejectedBy      String?
  rejectedAt      DateTime?
  rejectionReason String?

  // Cancellation
  cancelledBy        String?
  cancelledAt        DateTime?
  cancellationReason String?

  notes String?

  // Relations
  occupancies Occupancy[]
  attachments BookingAttachment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3.3 Flow: Booking → Occupancy

```
1. Staff submit booking (PENDING)
       ↓
2. Admin approve booking (APPROVED)
       ↓
3. System auto-create Occupancy per bed:
   - Status: RESERVED (jika future date)
   - Link ke booking
       ↓
4. Check-in/Check-out dihandle via Occupancy management
   (sudah ada di room-detail-sheet)
```

---

## 4. Alur Booking (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                      ALUR BOOKING                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. STAFF MEMILIH FILTER                                     │
│     ├── Area (wajib)                                         │
│     ├── Check-in: minimal besok                              │
│     ├── Check-out: maksimal 90 hari dari check-in            │
│     ├── Jumlah orang: 1-20 max                               │
│     └── Spesifikasi kamar (opsional)                         │
│                    ↓                                         │
│  2. SISTEM QUERY KETERSEDIAAN                                │
│     └── Cek occupancy existing dalam range                   │
│                    ↓                                         │
│  3. STAFF PILIH BED                                          │
│     ├── Pilih bed yang available dalam range                 │
│     └── Max selection = jumlah orang                         │
│                    ↓                                         │
│  4. STAFF ISI DATA OCCUPANT (per bed)                        │
│     ├── NIK (search IAM/existing)                            │
│     ├── Nama, Gender, Email, Phone                           │
│     ├── Company, Department                                  │
│     ├── Type: EMPLOYEE atau GUEST                            │
│     └── Jika ada GUEST → Wajib isi Companion                 │
│                    ↓                                         │
│  5. REVIEW & SUBMIT                                          │
│     ├── Summary booking                                      │
│     ├── Upload dokumen (opsional)                            │
│     └── Submit → Status PENDING                              │
│                    ↓                                         │
│  6. ADMIN APPROVAL                                           │
│     ├── Review booking request                               │
│     ├── Approve → APPROVED → Create Occupancies              │
│     └── Reject → REJECTED dengan alasan                      │
│                    ↓                                         │
│  7. OCCUPANCY MANAGEMENT (Existing)                          │
│     ├── Check-in saat tiba                                   │
│     ├── Check-out saat pulang                                │
│     └── Transfer jika perlu pindah                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. API Design (Refined)

### 5.1 `getAvailableRooms`

```typescript
// Input
interface GetAvailableRoomsParams {
  areaId: string;
  buildingId?: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomTypes?: string[]; // Filter by room type
  genderPolicy?: string; // Filter by gender policy
}

// Output: Room dengan status ketersediaan per bed dalam range
interface RoomAvailabilityResult {
  id: string;
  code: string;
  name: string;
  floor: number;
  building: { id: string; name: string; code: string };
  area: { id: string; name: string };
  roomType: { id: string; code: string; name: string };
  genderPolicy: "MALE_ONLY" | "FEMALE_ONLY" | "MIX" | "FLEXIBLE";
  currentGender: string | null;
  capacity: number;
  availableBeds: number; // Count of available beds in range
  beds: BedAvailabilityResult[];
  facilities: string[];
  images: { filePath: string; isPrimary: boolean }[];
}

interface BedAvailabilityResult {
  id: string;
  code: string;
  label: string;
  isAvailable: boolean; // Available dalam range yang diminta
  // Timeline untuk visualisasi
  occupancies: {
    id: string;
    checkInDate: Date;
    checkOutDate: Date;
    status: string;
    occupantName?: string;
  }[];
}
```

### 5.2 `createBookingRequest`

```typescript
interface CreateBookingInput {
  // Period
  checkInDate: Date;
  checkOutDate: Date;

  // Purpose
  purpose?: string;
  projectCode?: string;
  notes?: string;

  // Companion (wajib jika ada tamu)
  companion?: {
    userId?: string;
    name: string;
    nik: string;
    email?: string;
    phone?: string;
    company?: string;
    department?: string;
  };

  // Occupants (1 per bed, max 20)
  occupants: {
    bedId: string;
    type: "EMPLOYEE" | "GUEST";
    name: string;
    nik?: string;
    gender: "MALE" | "FEMALE";
    email?: string;
    phone?: string;
    company?: string;
    department?: string;
  }[];

  // Attachments (di-upload terpisah, kirim ID-nya)
  attachmentIds?: string[];
}

// Validation Rules:
// - Min occupants: 1
// - Max occupants: 20
// - checkInDate >= tomorrow
// - checkOutDate <= checkInDate + 90 days
// - Jika ada occupant type GUEST → companion wajib diisi
// - Semua bed harus available dalam range
```

### 5.3 `approveBooking`

```typescript
interface ApproveBookingInput {
  bookingId: string;
  notes?: string;
}

// Flow saat approve:
// 1. Update booking status → APPROVED
// 2. Create Occupancy untuk setiap occupant
//    - Status: RESERVED (future date)
//    - Link ke booking
// 3. Kirim notifikasi ke requester
```

### 5.4 `rejectBooking`

```typescript
interface RejectBookingInput {
  bookingId: string;
  reason: string; // Wajib
}
```

### 5.5 `cancelBooking`

```typescript
interface CancelBookingInput {
  bookingId: string;
  reason: string; // Wajib
}

// Bisa di-cancel oleh:
// - Requester (sebelum APPROVED)
// - Admin (kapan saja)
```

---

## 6. Roadmap Implementasi (Updated)

### Fase 1: Backend Core (Prioritas Tinggi)

| #   | Task                                  | Effort | File                 |
| --- | ------------------------------------- | ------ | -------------------- |
| 1.1 | Tambah enum `BookingStatus` di schema | 15min  | `schema.prisma`      |
| 1.2 | Buat types & schemas                  | 30min  | `booking.types.ts`   |
| 1.3 | API: `getAvailableRooms()`            | 2 jam  | `booking.actions.ts` |
| 1.4 | API: `createBookingRequest()`         | 2 jam  | `booking.actions.ts` |
| 1.5 | API: `getMyBookings()`                | 1 jam  | `booking.actions.ts` |
| 1.6 | API: `getBookingById()`               | 30min  | `booking.actions.ts` |

### Fase 2: Admin Approval

| #   | Task                                         | Effort | File                 |
| --- | -------------------------------------------- | ------ | -------------------- |
| 2.1 | API: `getPendingBookings()`                  | 1 jam  | `booking.actions.ts` |
| 2.2 | API: `approveBooking()` + create occupancies | 2 jam  | `booking.actions.ts` |
| 2.3 | API: `rejectBooking()`                       | 30min  | `booking.actions.ts` |
| 2.4 | API: `cancelBooking()`                       | 30min  | `booking.actions.ts` |
| 2.5 | Admin Approval UI                            | 3 jam  | `booking/admin/`     |

### Fase 3: Frontend Integration

| #   | Task                                | Effort | File                     |
| --- | ----------------------------------- | ------ | ------------------------ |
| 3.1 | Replace mock data di room-search    | 2 jam  | `room-search.tsx`        |
| 3.2 | Integrate timeline dengan real data | 2 jam  | `timeline.tsx`           |
| 3.3 | Connect booking submit ke API       | 2 jam  | `booking-request-sheet/` |
| 3.4 | My Bookings page                    | 2 jam  | `booking/mine/`          |

### Fase 4: Attachments

| #   | Task                          | Effort | File                     |
| --- | ----------------------------- | ------ | ------------------------ |
| 4.1 | Upload attachment API         | 1 jam  | `attachment.actions.ts`  |
| 4.2 | Attachment UI di booking form | 1 jam  | `booking-request-sheet/` |

### Fase 5: Polish

| #   | Task                        | Effort |
| --- | --------------------------- | ------ |
| 5.1 | Error handling & validation | 2 jam  |
| 5.2 | Loading states              | 1 jam  |
| 5.3 | Edge case testing           | 2 jam  |

---

## 7. Estimasi Timeline

| Fase                         | Durasi           | Kumulatif |
| ---------------------------- | ---------------- | --------- |
| Fase 1: Backend Core         | 1 hari           | 1 hari    |
| Fase 2: Admin Approval       | 1 hari           | 2 hari    |
| Fase 3: Frontend Integration | 1 hari           | 3 hari    |
| Fase 4: Attachments          | 0.5 hari         | 3.5 hari  |
| Fase 5: Polish               | 0.5 hari         | 4 hari    |
| **Total**                    | **4 hari kerja** |           |

---

## 8. File Structure (Proposed)

```
src/app/(protected)/
├── home/                          # Booking Search (existing)
│   └── _components/
│       ├── mock-data.ts           # ❌ Akan dihapus
│       └── ... (existing)
│
├── booking/
│   ├── _actions/
│   │   ├── booking.types.ts       # Types & schemas
│   │   ├── booking.actions.ts     # Server actions
│   │   └── attachment.actions.ts  # Attachment upload
│   │
│   ├── mine/                      # My Bookings
│   │   └── page.tsx
│   │
│   ├── request/                   # Existing booking request
│   │   └── ...
│   │
│   └── admin/                     # Admin Approval (NEW)
│       ├── page.tsx               # List pending bookings
│       └── _components/
│           ├── booking-list.tsx
│           └── approval-dialog.tsx
```

---

## 9. Komponen UI yang Sudah Ada

### 9.1 Struktur File Saat Ini

```
src/app/(protected)/home/_components/
├── mock-data.ts                   # ❌ Data dummy (akan diganti dengan API)
├── room-search.tsx                # ✅ Form pencarian & filter (29KB)
├── room-availability-timeline.tsx # ✅ Timeline ketersediaan (17KB)
├── room-card.tsx                  # ✅ Card info room (9KB)
├── room-detail-dialog.tsx         # ✅ Dialog detail & pilih bed (14KB)
├── selection-summary-bar.tsx      # ✅ Summary bed terpilih (6KB)
├── booking-request-types.ts       # ✅ Type definitions
├── booking-request-sheet/         # ✅ Sheet booking multi-step
│   ├── index.tsx                  # Main sheet (14KB)
│   ├── bed-selection-grid.tsx     # Grid pilih bed (8KB)
│   ├── booking-review-step.tsx    # Review sebelum submit (12KB)
│   └── occupant-details-form.tsx  # Form data penghuni (33KB)
├── quick-request-widget.tsx       # Widget request saya
└── booking-guide.tsx              # Panduan booking (25KB)
```

### 9.2 Mock Data Types

```typescript
// Dari mock-data.ts - akan di-mapping ke real data
export type RoomType = "standard" | "vip" | "vvip";
export type RoomAllocation = "employee" | "guest";
export type RoomGender = "male" | "female" | "mix" | "flexible";
export type RoomStatus = "available" | "partial" | "full" | "maintenance";
export type BedStatus = "available" | "occupied" | "reserved" | "maintenance";
```

---

## 10. Next Steps

1. ✅ **Review dokumen ini** - Konfirmasi requirement
2. ⏳ **Mulai Fase 1** - Backend Core
3. ⏳ **Testing** - Setiap fase

---

## 11. Pertanyaan Remaining

1. **Notifikasi** - Ditunda untuk nanti (in-app + email)
2. **Siapa yang bisa approve?** - Admin dengan permission tertentu?
3. **Cancellation policy** - Bisa cancel sampai kapan?

---

**Dokumen ini akan di-update sesuai progress implementasi.**

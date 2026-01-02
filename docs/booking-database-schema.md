# 🏨 Booking Room Database Schema - Dokumentasi Lengkap

**Last Updated:** 2026-01-02  
**Version:** 3.1.0  
**Status:** 📋 Final Review

---

## 📋 Daftar Isi

1. [Overview Sistem](#overview-sistem)
2. [Hierarki & Struktur](#hierarki--struktur)
3. [Detail Tabel](#detail-tabel)
   - [BuildingImage (Foto Gedung)](#1-buildingimage-foto-gedung)
   - [Room (Kamar)](#2-room-kamar)
   - [RoomImage (Foto Kamar)](#3-roomimage-foto-kamar)
   - [Bed (Tempat Tidur)](#4-bed-tempat-tidur)
   - [Booking (Pemesanan)](#5-booking-pemesanan)
   - [BookingAttachment (Lampiran)](#6-bookingattachment-lampiran)
   - [Occupancy (Penghuni)](#7-occupancy-penghuni)
   - [OccupancyLog (Audit Trail)](#8-occupancylog-audit-trail)
4. [Occupant Types](#occupant-types)
5. [Companion (Pendamping Tamu)](#companion-pendamping-tamu)
6. [Room Access Rules](#room-access-rules)
7. [Gender Policy](#gender-policy)
8. [Booking Lifecycle](#booking-lifecycle)
9. [Transfer & Checkout Mechanism](#transfer--checkout-mechanism)
10. [Room Edit Lock](#room-edit-lock)
11. [Status Workflow](#status-workflow)
12. [Contoh Skenario](#contoh-skenario)
13. [Prisma Schema](#prisma-schema)

---

## 🎯 Overview Sistem

### Fitur Utama

| Fitur                    | Deskripsi                                             |
| ------------------------ | ----------------------------------------------------- |
| **Booking per Bed**      | Reservasi per tempat tidur                            |
| **2 Tipe Occupant**      | EMPLOYEE (auto IAM) & GUEST (manual)                  |
| **Pendamping Wajib**     | Tamu wajib punya karyawan pendamping                  |
| **Direct Placement**     | Admin bisa langsung placement tanpa booking           |
| **Media (Foto)**         | Upload foto untuk gedung, kamar, dan lampiran booking |
| **Booking Attachments**  | File pendukung untuk booking                          |
| **Cancel/Reschedule**    | Bisa cancel atau ubah tanggal sebelum check-in        |
| **Early Checkout**       | Checkout lebih awal oleh admin/occupant               |
| **Transfer Occupant**    | Pindahkan penghuni ke bed lain                        |
| **Complete Audit Trail** | Log semua aktivitas                                   |
| **Room Lock**            | Room tidak bisa diedit saat ada penghuni              |

---

## 🏗️ Hierarki & Struktur

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE SCHEMA                              │
└─────────────────────────────────────────────────────────────────┘

Area
└── Building
    ├── BuildingImage[]           ← Foto gedung
    │
    └── Room
        ├── RoomImage[]           ← Foto kamar
        ├── roomType              → RoomType (fasilitas bawaan)
        ├── allowedOccupantType   ← EMPLOYEE_ONLY | ALL
        ├── isBookable            ← Bisa di-booking?
        │
        └── Bed
            └── Occupancy
                ├── booking?      → Booking (optional)
                ├── occupantType  ← EMPLOYEE | GUEST
                └── logs[]        → OccupancyLog (audit)

Booking
├── requester info (SNAPSHOT - tidak ada FK)
├── companion info              ← WAJIB jika ada GUEST
├── attachments[]               ← File pendukung
└── occupancies[]
```

---

## 📊 Detail Tabel

### 1. BuildingImage (Foto Gedung)

**Tujuan:** Menyimpan foto/gambar untuk gedung

| Field        | Type     | Deskripsi      | Contoh                              |
| ------------ | -------- | -------------- | ----------------------------------- |
| `id`         | String   | Primary key    |                                     |
| `buildingId` | String   | FK ke Building |                                     |
| `url`        | String   | URL gambar     | "https://storage.../building-a.jpg" |
| `caption`    | String?  | Keterangan     | "Tampak depan"                      |
| `isPrimary`  | Boolean  | Foto utama?    | true/false                          |
| `order`      | Int      | Urutan display | 1, 2, 3                             |
| `createdAt`  | DateTime |                |                                     |
| `updatedAt`  | DateTime |                |                                     |

---

### 2. Room (Kamar)

**Tujuan:** Menyimpan data kamar dengan aturan akses

```
┌─────────────────────────────────────────────────────────────┐
│                         ROOM                                 │
├─────────────────────────────────────────────────────────────┤
│ Room 101 [EMPLOYEE_ONLY, Bookable]                          │
│ ├── floorNumber: 1                                          │
│ ├── roomType: Standard → amenities dari RoomType           │
│ ├── allowedOccupantType: EMPLOYEE_ONLY                     │
│ ├── isBookable: true                                        │
│ ├── genderPolicy: MALE_ONLY                                 │
│ └── images: [foto1.jpg, foto2.jpg]                         │
│                                                              │
│ Room 102 [ALL, Not Bookable - Admin Only]                   │
│ ├── allowedOccupantType: ALL                                │
│ ├── isBookable: false  ← Hanya admin bisa placement        │
│ └── ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

| Field                     | Type     | Deskripsi        | Contoh                                |
| ------------------------- | -------- | ---------------- | ------------------------------------- |
| `id`                      | String   | Primary key      |                                       |
| `buildingId`              | String   | FK ke Building   |                                       |
| `roomTypeId`              | String   | FK ke RoomType   |                                       |
| `code`                    | String   | Kode unik        | "R-101"                               |
| `name`                    | String   | Nama display     | "Kamar 101"                           |
| `floorNumber`             | Int      | Nomor lantai     | 1, 2, 3                               |
| `floorName`               | String?  | Nama lantai      | "Lantai 1"                            |
| `description`             | String?  | Deskripsi        |                                       |
| **`allowedOccupantType`** | Enum     | Siapa boleh      | EMPLOYEE_ONLY, ALL                    |
| **`isBookable`**          | Boolean  | Bisa di-booking? | true = booking, false = admin only    |
| `genderPolicy`            | Enum     | Aturan gender    | MALE_ONLY, FEMALE_ONLY, MIX, FLEXIBLE |
| `currentGender`           | String?  | Gender saat ini  | "MALE", null                          |
| `pricePerBed`             | Decimal? | Harga override   | 150000.00                             |
| `status`                  | Enum     | Status           | ACTIVE, INACTIVE, MAINTENANCE         |

**Catatan:**

- **Fasilitas** diambil dari `RoomType.defaultAmenities` (tidak duplikasi di Room)
- **Foto** disimpan di tabel `RoomImage` terpisah

---

### 3. RoomImage (Foto Kamar)

**Tujuan:** Menyimpan foto/gambar untuk kamar

| Field       | Type     | Deskripsi      | Contoh                            |
| ----------- | -------- | -------------- | --------------------------------- |
| `id`        | String   | Primary key    |                                   |
| `roomId`    | String   | FK ke Room     |                                   |
| `url`       | String   | URL gambar     | "https://storage.../room-101.jpg" |
| `caption`   | String?  | Keterangan     | "Tampak dari pintu"               |
| `isPrimary` | Boolean  | Foto utama?    | true/false                        |
| `order`     | Int      | Urutan display | 1, 2, 3                           |
| `createdAt` | DateTime |                |                                   |
| `updatedAt` | DateTime |                |                                   |

---

### 4. Bed (Tempat Tidur)

**Target booking**

| Field      | Type    | Deskripsi                                           |
| ---------- | ------- | --------------------------------------------------- |
| `id`       | String  | Primary key                                         |
| `roomId`   | String  | FK ke Room                                          |
| `code`     | String  | Kode unik ("R-101-A")                               |
| `label`    | String  | Label display ("Bed A")                             |
| `position` | Int     | Urutan (1, 2, 3)                                    |
| `bedType`  | String? | Override tipe                                       |
| `status`   | Enum    | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, BLOCKED |
| `notes`    | String? | Catatan                                             |

---

### 5. Booking (Pemesanan)

**Tujuan:** Menyimpan request booking

**⚠️ PENTING: Requester Info adalah SNAPSHOT (tidak ada FK ke Company)**

```
┌─────────────────────────────────────────────────────────────┐
│                        BOOKING                               │
├─────────────────────────────────────────────────────────────┤
│ Booking #BK-2026-001                                         │
│ ├── Requester (SNAPSHOT - tidak ada FK):                    │
│ │   ├── requesterUserId: "usr-xxx"                          │
│ │   ├── requesterName: "Ahmad Fauzi"                        │
│ │   ├── requesterNik: "12345"                               │
│ │   ├── requesterEmail: "ahmad@company.com"                 │
│ │   ├── requesterPhone: "081xxx"                            │
│ │   ├── requesterCompany: "PT. DCM" (snapshot, bukan FK)   │
│ │   └── requesterDepartment: "HR Department"               │
│ │                                                            │
│ ├── Companion (Pendamping):    ← WAJIB jika ada tamu       │
│ │   ├── companionUserId: "usr-001"                         │
│ │   ├── companionName: "Budi Santoso"                       │
│ │   └── ...                                                  │
│ │                                                            │
│ ├── Attachments:               ← File pendukung            │
│ │   ├── surat_tugas.pdf                                     │
│ │   └── ijin_keluar.pdf                                     │
│ │                                                            │
│ ├── Approval:                                                │
│ │   ├── approvedBy / rejectedBy                             │
│ │   ├── approvedAt / rejectedAt                             │
│ │   └── rejectionReason                                     │
│ │                                                            │
│ └── Occupancies:                                             │
│     ├── Budi (EMPLOYEE) → R-101-A                           │
│     └── John Doe (GUEST) → R-102-A                          │
└─────────────────────────────────────────────────────────────┘
```

| Field                         | Type      | Deskripsi               | Contoh                           |
| ----------------------------- | --------- | ----------------------- | -------------------------------- |
| `id`                          | String    | Primary key             |                                  |
| `code`                        | String    | Kode booking            | "BK-2026-0001"                   |
| **Requester Info (SNAPSHOT)** |           | Tidak ada FK ke Company |                                  |
| `requesterUserId`             | String    | User ID pemohon         |                                  |
| `requesterName`               | String    | Nama pemohon            | "Ahmad Fauzi"                    |
| `requesterNik`                | String?   | NIK pemohon             | "12345"                          |
| `requesterEmail`              | String?   | Email                   |                                  |
| `requesterPhone`              | String?   | Telepon                 |                                  |
| `requesterCompany`            | String?   | Nama company (snapshot) | "PT. DCM"                        |
| `requesterDepartment`         | String?   | Departemen              | "HR"                             |
| `requesterPosition`           | String?   | Jabatan                 | "Staff"                          |
| **Companion Info**            |           | ⚠️ Wajib jika ada GUEST |                                  |
| `companionUserId`             | String?   | User ID pendamping      |                                  |
| `companionName`               | String?   | Nama pendamping         | "Budi Santoso"                   |
| `companionNik`                | String?   | NIK pendamping          | "12345"                          |
| `companionEmail`              | String?   | Email                   |                                  |
| `companionPhone`              | String?   | Telepon                 |                                  |
| `companionCompany`            | String?   | Company (snapshot)      |                                  |
| `companionDepartment`         | String?   | Department              |                                  |
| **Booking Period**            |           |                         |                                  |
| `checkInDate`                 | Date      | Tanggal masuk           | 2026-01-10                       |
| `checkOutDate`                | Date      | Tanggal keluar          | 2026-01-15                       |
| `purpose`                     | String?   | Tujuan                  | "Training"                       |
| `projectCode`                 | String?   | Kode proyek             |                                  |
| **Status & Approval**         |           |                         |                                  |
| `status`                      | Enum      | Status                  | PENDING, APPROVED, REJECTED, etc |
| `approvedBy`                  | String?   | User ID approver        |                                  |
| `approvedAt`                  | DateTime? | Waktu approve           |                                  |
| `rejectedBy`                  | String?   | User ID yang reject     |                                  |
| `rejectedAt`                  | DateTime? | Waktu reject            |                                  |
| `rejectionReason`             | String?   | Alasan ditolak          |                                  |
| **Cancellation**              |           |                         |                                  |
| `cancelledBy`                 | String?   | User ID yang cancel     |                                  |
| `cancelledAt`                 | DateTime? | Waktu cancel            |                                  |
| `cancellationReason`          | String?   | Alasan cancel           |                                  |
| **General**                   |           |                         |                                  |
| `notes`                       | String?   | Catatan                 |                                  |
| `createdAt`                   | DateTime  |                         |                                  |
| `updatedAt`                   | DateTime  |                         |                                  |

---

### 6. BookingAttachment (Lampiran)

**Tujuan:** Menyimpan file pendukung untuk booking (surat tugas, ijin, dll)

| Field            | Type     | Deskripsi        | Contoh                       |
| ---------------- | -------- | ---------------- | ---------------------------- |
| `id`             | String   | Primary key      |                              |
| `bookingId`      | String   | FK ke Booking    |                              |
| `fileName`       | String   | Nama file asli   | "surat_tugas.pdf"            |
| `fileUrl`        | String   | URL file         | "https://storage.../xxx.pdf" |
| `fileType`       | String   | MIME type        | "application/pdf"            |
| `fileSize`       | Int      | Ukuran (bytes)   | 102400                       |
| `description`    | String?  | Keterangan       | "Surat tugas dari atasan"    |
| `uploadedBy`     | String   | User ID uploader |                              |
| `uploadedByName` | String   | Nama uploader    |                              |
| `createdAt`      | DateTime |                  |                              |

---

### 7. Occupancy (Penghuni)

**Tujuan:** Menyimpan siapa yang menempati bed

```
┌─────────────────────────────────────────────────────────────┐
│                      OCCUPANCY                               │
├─────────────────────────────────────────────────────────────┤
│ EMPLOYEE via Booking:                                        │
│ ├── bookingId: "BK-2026-001"                                │
│ ├── bedId: "R-101-A"                                        │
│ ├── occupantType: EMPLOYEE                                  │
│ ├── occupantUserId: "usr-123" ← FK untuk link ke IAM       │
│ └── occupantName: "Budi Santoso" (auto)                     │
│                                                              │
│ GUEST via Booking:                                           │
│ ├── bookingId: "BK-2026-001"                                │
│ ├── occupantType: GUEST                                     │
│ ├── occupantUserId: NULL                                    │
│ └── occupantName: "John Doe" (manual)                       │
│                                                              │
│ Direct Placement by Admin:                                   │
│ ├── bookingId: NULL                                         │
│ ├── createdBy: "admin-001"  ← Audit                        │
│ └── createdByName: "Admin HR"                               │
└─────────────────────────────────────────────────────────────┘
```

| Field                                  | Type      | Deskripsi                                       |
| -------------------------------------- | --------- | ----------------------------------------------- |
| `id`                                   | String    | Primary key                                     |
| `bookingId`                            | String?   | FK ke Booking (nullable = direct placement)     |
| `bedId`                                | String    | FK ke Bed                                       |
| **Occupant Type**                      |           |                                                 |
| `occupantType`                         | Enum      | EMPLOYEE atau GUEST                             |
| **Occupant Data**                      |           |                                                 |
| `occupantUserId`                       | String?   | FK ke User (EMPLOYEE only)                      |
| `occupantName`                         | String    | Nama                                            |
| `occupantNik`                          | String?   | NIK/KTP                                         |
| `occupantGender`                       | Enum      | MALE, FEMALE                                    |
| `occupantPhone`                        | String?   | Telepon                                         |
| `occupantEmail`                        | String?   | Email                                           |
| `occupantCompany`                      | String?   | Perusahaan                                      |
| `occupantDepartment`                   | String?   | Departemen                                      |
| `occupantPosition`                     | String?   | Jabatan                                         |
| **Stay Period**                        |           |                                                 |
| `checkInDate`                          | Date      | Tanggal masuk                                   |
| `checkOutDate`                         | Date      | Tanggal keluar (bisa diubah)                    |
| `originalCheckOutDate`                 | Date?     | Tanggal keluar awal (sebelum perubahan)         |
| `actualCheckIn`                        | DateTime? | Waktu check-in aktual                           |
| `actualCheckOut`                       | DateTime? | Waktu check-out aktual                          |
| **Status**                             |           |                                                 |
| `status`                               | Enum      | PENDING, RESERVED, CHECKED_IN, CHECKED_OUT, etc |
| `qrCode`                               | String?   | QR untuk scan                                   |
| **Audit - Created (Direct Placement)** |           |                                                 |
| `createdBy`                            | String?   | User ID admin                                   |
| `createdByName`                        | String?   | Nama admin                                      |
| **Transfer Info**                      |           |                                                 |
| `transferredFromBedId`                 | String?   | Bed sebelumnya                                  |
| `transferReason`                       | String?   | Alasan pindah                                   |
| `transferredAt`                        | DateTime? | Waktu pindah                                    |
| `transferredBy`                        | String?   | User ID                                         |
| `transferredByName`                    | String?   | Nama                                            |
| **Checkout Info**                      |           |                                                 |
| `checkoutReason`                       | String?   | Alasan checkout                                 |
| `checkoutBy`                           | String?   | User ID                                         |
| `checkoutByName`                       | String?   | Nama                                            |
| **General**                            |           |                                                 |
| `notes`                                | String?   | Catatan                                         |

---

### 8. OccupancyLog (Audit Trail)

**Tujuan:** Menyimpan semua aktivitas terkait Occupancy

```
┌─────────────────────────────────────────────────────────────┐
│                    OCCUPANCY LOG                             │
├─────────────────────────────────────────────────────────────┤
│ Log 1: CREATED                                               │
│ ├── action: "CREATED"                                       │
│ └── notes: "Direct placement untuk tamu VIP"               │
│                                                              │
│ Log 2: CHECKED_IN                                            │
│ ├── action: "CHECKED_IN"                                    │
│ └── performedAt: "2026-01-10 14:30"                         │
│                                                              │
│ Log 3: DATE_CHANGED                                          │
│ ├── action: "DATE_CHANGED"                                  │
│ ├── previousCheckOutDate: "2026-01-15"                      │
│ ├── newCheckOutDate: "2026-01-20"                           │
│ └── reason: "Perpanjangan training"                         │
│                                                              │
│ Log 4: TRANSFERRED                                           │
│ ├── action: "TRANSFERRED"                                   │
│ ├── fromBedId: "R-101-A"                                    │
│ ├── toBedId: "R-102-A"                                      │
│ └── reason: "AC rusak"                                       │
│                                                              │
│ Log 5: EARLY_CHECKOUT                                        │
│ ├── action: "EARLY_CHECKOUT"                                │
│ ├── originalCheckOutDate: "2026-01-15"                      │
│ ├── actualCheckOutDate: "2026-01-12"                        │
│ └── reason: "Keperluan mendadak"                            │
└─────────────────────────────────────────────────────────────┘
```

| Field                   | Type     | Deskripsi              | Contoh               |
| ----------------------- | -------- | ---------------------- | -------------------- |
| `id`                    | String   | Primary key            |                      |
| `occupancyId`           | String   | FK ke Occupancy        |                      |
| **Action**              |          |                        |                      |
| `action`                | Enum     | Jenis aksi             | Lihat tabel di bawah |
| **Transfer Details**    |          |                        |                      |
| `fromBedId`             | String?  | Bed asal               | "R-101-A"            |
| `toBedId`               | String?  | Bed tujuan             | "R-102-A"            |
| **Date Change Details** |          |                        |                      |
| `previousCheckInDate`   | Date?    | Tanggal masuk sebelum  |                      |
| `newCheckInDate`        | Date?    | Tanggal masuk sesudah  |                      |
| `previousCheckOutDate`  | Date?    | Tanggal keluar sebelum |                      |
| `newCheckOutDate`       | Date?    | Tanggal keluar sesudah |                      |
| **Performer**           |          |                        |                      |
| `performedBy`           | String   | User ID pelaku         |                      |
| `performedByName`       | String   | Nama pelaku            | "Admin HR"           |
| `performedAt`           | DateTime | Waktu aksi             |                      |
| **Details**             |          |                        |                      |
| `reason`                | String?  | Alasan                 |                      |
| `notes`                 | String?  | Catatan tambahan       |                      |
| `metadata`              | Json?    | Data tambahan          |                      |

**Action Types:**

| Action           | Kapan               | Data Tambahan                                     |
| ---------------- | ------------------- | ------------------------------------------------- |
| `CREATED`        | Occupancy dibuat    | -                                                 |
| `CHECKED_IN`     | Check-in            | -                                                 |
| `DATE_CHANGED`   | Tanggal diubah      | previous/newCheckInDate, previous/newCheckOutDate |
| `TRANSFERRED`    | Pindah bed          | fromBedId, toBedId                                |
| `EARLY_CHECKOUT` | Checkout lebih awal | previousCheckOutDate, actualCheckOutDate          |
| `CHECKED_OUT`    | Checkout normal     | -                                                 |
| `CANCELLED`      | Dibatalkan          | -                                                 |
| `STATUS_CHANGED` | Status lain berubah | -                                                 |

---

## 👥 Occupant Types

### EMPLOYEE (Karyawan)

```
Input NIK → Fetch IAM API → Auto-fill data
```

### GUEST (Tamu)

```
Manual input semua field
```

**PENTING:** Jika booking ada GUEST, maka **Companion (Pendamping) WAJIB diisi**

---

## 🤝 Companion (Pendamping Tamu)

### Aturan

1. **WAJIB** jika booking memiliki occupant dengan `occupantType: GUEST`
2. **Pendamping HARUS karyawan** (punya NIK yang valid di IAM)
3. 1 pendamping bisa untuk banyak tamu dalam 1 booking
4. Data pendamping di-fetch dari IAM berdasarkan NIK

---

## 📅 Booking vs Occupancy Dates

### Konsep Penting

**Booking dates = RANGE (batas waktu)**  
**Occupancy dates = Individual (bisa berbeda-beda dalam range)**

```
┌─────────────────────────────────────────────────────────────────┐
│              BOOKING vs OCCUPANCY DATES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BOOKING #BK-2026-001                                            │
│  ├── checkInDate: 10 Jan   ← BATAS AWAL (minimum)               │
│  └── checkOutDate: 20 Jan  ← BATAS AKHIR (maximum)              │
│                                                                  │
│  Timeline Filter: [==========10 Jan ════════════ 20 Jan=========]│
│                                                                  │
│  OCCUPANTS (dalam RANGE booking):                                │
│                                                                  │
│  Occupant 1: [████ 10-15 Jan ████]                              │
│              ✅ Valid (dalam range)                              │
│                                                                  │
│  Occupant 2:      [████ 12-18 Jan ████]                         │
│              ✅ Valid (dalam range)                              │
│                                                                  │
│  Occupant 3: [██████████ 10-20 Jan ██████████]                  │
│              ✅ Valid (full range)                               │
│                                                                  │
│  Occupant 4: [█ 9 Jan █]───                                      │
│              ❌ INVALID (sebelum range start)                   │
│                                                                  │
│  Occupant 5:                          ───[█ 25 Jan █]           │
│              ❌ INVALID (melewati range end)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Aturan Validasi

```typescript
// Occupancy dates HARUS dalam range Booking
function validateOccupancyDates(booking: Booking, occupancy: Occupancy) {
  if (occupancy.checkInDate < booking.checkInDate) {
    throw new Error("Check-in occupant tidak boleh sebelum tanggal booking");
  }

  if (occupancy.checkOutDate > booking.checkOutDate) {
    throw new Error("Check-out occupant tidak boleh melewati tanggal booking");
  }

  if (occupancy.checkInDate >= occupancy.checkOutDate) {
    throw new Error("Check-in harus sebelum check-out");
  }
}
```

### Contoh Skenario

**Booking untuk Training 10 hari:**

```
BOOKING #BK-2026-001
├── Period: 10 Jan - 20 Jan (10 hari)
├── Purpose: "Training Batch 1"
│
├── Occupant 1: Budi (Trainer)
│   └── Stay: 10 Jan - 20 Jan (full, ikut semua sesi)
│
├── Occupant 2: Andi (Peserta sesi 1)
│   └── Stay: 10 Jan - 15 Jan (hanya minggu 1)
│
├── Occupant 3: Citra (Peserta sesi 2)
│   └── Stay: 15 Jan - 20 Jan (hanya minggu 2)
│
└── Occupant 4: John (Tamu, presentasi saja)
    └── Stay: 12 Jan - 13 Jan (hanya 1 malam)
```

### Flow Admin saat Pilih Kamar

```
1. Admin filter timeline:
   - Area: MESS LQ
   - Tanggal: 10 Jan - 20 Jan (ini jadi RANGE booking)

2. Sistem tampilkan availability dalam range tersebut

3. Admin pilih room & bed untuk tiap occupant

4. Untuk tiap occupant, admin bisa set:
   - Check-in date (min: 10 Jan, tidak boleh kurang)
   - Check-out date (max: 20 Jan, tidak boleh lebih)

5. Sistem validasi: semua occupant dates dalam range
```

---

## 🏠 Room Access Rules

| Room.allowedOccupantType | EMPLOYEE | GUEST          |
| ------------------------ | -------- | -------------- |
| **EMPLOYEE_ONLY**        | ✅ Boleh | ❌ Tidak boleh |
| **ALL**                  | ✅ Boleh | ✅ Boleh       |

| Room.isBookable | Meaning                           |
| --------------- | --------------------------------- |
| **true**        | User bisa request booking         |
| **false**       | Hanya admin bisa direct placement |

---

## 👫 Gender Policy

| Policy        | Behavior                  |
| ------------- | ------------------------- |
| `MALE_ONLY`   | Hanya pria                |
| `FEMALE_ONLY` | Hanya wanita              |
| `MIX`         | Campur boleh              |
| `FLEXIBLE`    | First occupant menentukan |

---

## 📅 Booking Lifecycle

### Fase 1: Sebelum Check-in

**Selama belum check-in, booking BISA:**

- ❌ **Dibatalkan** (cancel)
- 📅 **Diubah tanggalnya** (reschedule)

```
┌────────────────────────────────────────────────────────────────┐
│                 BEFORE CHECK-IN ACTIONS                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CANCEL:                                                         │
│ ├── Status: PENDING/APPROVED → CANCELLED                       │
│ ├── Bed status: RESERVED → AVAILABLE                           │
│ ├── cancelledBy: admin/user                                    │
│ ├── cancelledAt: timestamp                                     │
│ └── cancellationReason: "Acara dibatalkan"                     │
│                                                                 │
│ RESCHEDULE (Ubah Tanggal):                                      │
│ ├── Update: checkInDate dan/atau checkOutDate                  │
│ ├── Log: DATE_CHANGED                                          │
│ └── Cek availability dulu                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Fase 2: Setelah Check-in

**Setelah check-in, occupancy BISA:**

- 📅 **Perpanjang** (extend checkout date)
- ⬅️ **Early checkout** (checkout lebih awal)
- 🔄 **Transfer** (pindah bed/room)

```
┌────────────────────────────────────────────────────────────────┐
│                  AFTER CHECK-IN ACTIONS                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ EXTEND (Perpanjang):                                            │
│ ├── Update: checkOutDate → tanggal baru                        │
│ ├── Log: DATE_CHANGED                                          │
│ └── Cek availability dulu                                       │
│                                                                 │
│ EARLY CHECKOUT:                                                 │
│ ├── Oleh: Admin ATAU Occupant                                  │
│ ├── originalCheckOutDate: simpan tanggal awal                  │
│ ├── actualCheckOut: tanggal aktual checkout                    │
│ ├── checkoutReason: "Keperluan mendadak"                       │
│ ├── Bed status: OCCUPIED → AVAILABLE                           │
│ └── Log: EARLY_CHECKOUT                                         │
│                                                                 │
│ TRANSFER:                                                        │
│ ├── Update: bedId → bed baru                                   │
│ ├── Old bed: OCCUPIED → AVAILABLE                               │
│ ├── New bed: AVAILABLE → OCCUPIED                               │
│ └── Log: TRANSFERRED                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Siapa yang Bisa Checkout?

| Actor                | Bisa Checkout?                       |
| -------------------- | ------------------------------------ |
| **Admin**            | ✅ Ya (force checkout dengan alasan) |
| **Occupant sendiri** | ✅ Ya (self checkout)                |
| **Sistem**           | ✅ Ya (auto checkout di hari H)      |

---

## 🔄 Transfer & Checkout Mechanism

### Transfer Occupant (Pindah Kamar)

```
┌────────────────────────────────────────────────────────────────┐
│                    TRANSFER FLOW                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ BEFORE:                                                         │
│ Occupancy #occ-001                                              │
│ ├── bedId: "R-101-A"                                           │
│ └── status: CHECKED_IN                                         │
│                                                                 │
│ ADMIN ACTION: Transfer ke R-102-A                               │
│ Reason: "AC kamar R-101 rusak"                                 │
│                                                                 │
│ AFTER:                                                          │
│ Occupancy #occ-001 (UPDATED)                                   │
│ ├── bedId: "R-102-A"                                           │
│ ├── transferredFromBedId: "R-101-A"                            │
│ ├── transferReason: "AC kamar R-101 rusak"                     │
│ ├── transferredAt: timestamp                                    │
│ ├── transferredBy: "admin-001"                                  │
│ └── transferredByName: "Admin HR"                               │
│                                                                 │
│ Bed Status:                                                      │
│ R-101-A: OCCUPIED → AVAILABLE                                   │
│ R-102-A: AVAILABLE → OCCUPIED                                   │
│                                                                 │
│ OccupancyLog: action=TRANSFERRED                                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Early Checkout

```
┌────────────────────────────────────────────────────────────────┐
│                   EARLY CHECKOUT FLOW                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SEBELUM:                                                        │
│ Occupancy: checkOutDate = 15 Jan, status = CHECKED_IN          │
│                                                                 │
│ ACTION: Checkout di 12 Jan                                      │
│ By: Admin atau Occupant sendiri                                 │
│ Reason: "Keperluan keluarga mendadak"                          │
│                                                                 │
│ SESUDAH:                                                        │
│ Occupancy (UPDATED):                                            │
│ ├── status: CHECKED_OUT                                        │
│ ├── originalCheckOutDate: 15 Jan (simpan tanggal awal)         │
│ ├── actualCheckOut: 12 Jan timestamp                           │
│ ├── checkoutReason: "Keperluan keluarga mendadak"              │
│ ├── checkoutBy: user-id                                        │
│ └── checkoutByName: "Budi" atau "Admin HR"                      │
│                                                                 │
│ Bed: OCCUPIED → AVAILABLE                                       │
│                                                                 │
│ OccupancyLog: action=EARLY_CHECKOUT                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Room Edit Lock

### Aturan

**Room TIDAK BISA diedit jika masih ada occupant aktif di dalamnya**

### Implementasi

```typescript
async function canEditRoom(roomId: string): Promise<boolean> {
  const activeOccupants = await prisma.occupancy.count({
    where: {
      bed: { roomId: roomId },
      status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
    },
  });

  return activeOccupants === 0;
}
```

---

## 📈 Status Workflow

### Booking Status

```
PENDING ─────► APPROVED ─────► (occupancies handle the rest)
    │                │
    ▼                ▼
REJECTED        CANCELLED
```

### Occupancy Status

```
Via Booking:
PENDING → RESERVED → CHECKED_IN → CHECKED_OUT

Direct Placement:
CHECKED_IN (langsung) → CHECKED_OUT

Other:
CANCELLED, NO_SHOW
```

### Bed Status

```
AVAILABLE ←→ RESERVED ←→ OCCUPIED
     ↑                      ↓
     └──────────────────────┘

Special: MAINTENANCE, BLOCKED
```

---

## 📝 Contoh Skenario

### Skenario 1: Early Checkout oleh Occupant

```
Occupancy: Budi, R-101-A, Check-out plan: 15 Jan

12 Jan: Budi perlu pulang mendadak
├── Budi klik "Checkout Sekarang"
├── Input alasan: "Ada keperluan keluarga"
├── Sistem update:
│   ├── status: CHECKED_OUT
│   ├── originalCheckOutDate: 15 Jan
│   ├── actualCheckOut: 12 Jan 10:00
│   ├── checkoutReason: "Ada keperluan keluarga"
│   ├── checkoutBy: "budi-user-id"
│   └── checkoutByName: "Budi Santoso"
│
└── Bed R-101-A: OCCUPIED → AVAILABLE
```

### Skenario 2: Cancel Booking Sebelum Check-in

```
Booking BK-001: Approved, CheckIn: 15 Jan

13 Jan: Acara dibatalkan
├── Admin klik "Cancel Booking"
├── Input alasan: "Acara training dibatalkan"
├── Sistem update:
│   ├── Booking status: CANCELLED
│   ├── cancelledBy: admin-id
│   ├── cancelledAt: 13 Jan 14:00
│   ├── cancellationReason: "Acara training dibatalkan"
│   │
│   └── Semua Occupancy:
│       ├── status: CANCELLED
│       └── Bed: RESERVED → AVAILABLE
```

---

## 📋 Prisma Schema

### Enums

```prisma
enum OccupantType {
  EMPLOYEE
  GUEST
}

enum AllowedOccupantType {
  EMPLOYEE_ONLY
  ALL
}

enum RoomStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

enum GenderPolicy {
  MALE_ONLY
  FEMALE_ONLY
  MIX
  FLEXIBLE
}

enum BedStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  MAINTENANCE
  BLOCKED
}

enum BookingStatus {
  PENDING
  APPROVED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  REJECTED
  EXPIRED
}

enum OccupancyStatus {
  PENDING
  RESERVED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

enum Gender {
  MALE
  FEMALE
}

enum OccupancyLogAction {
  CREATED
  CHECKED_IN
  DATE_CHANGED
  TRANSFERRED
  EARLY_CHECKOUT
  CHECKED_OUT
  CANCELLED
  STATUS_CHANGED
}
```

### BuildingImage

```prisma
model BuildingImage {
  id          String   @id @default(cuid())
  buildingId  String
  url         String
  caption     String?
  isPrimary   Boolean  @default(false)
  order       Int      @default(0)

  building    Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([buildingId])
  @@index([isPrimary])
}
```

### Room

```prisma
model Room {
  id                  String              @id @default(cuid())
  buildingId          String
  roomTypeId          String

  code                String              @unique
  name                String
  floorNumber         Int                 @default(1)
  floorName           String?
  description         String?

  allowedOccupantType AllowedOccupantType @default(ALL)
  isBookable          Boolean             @default(true)

  genderPolicy        GenderPolicy        @default(MIX)
  currentGender       String?

  pricePerBed         Decimal?            @db.Decimal(12, 2)
  status              RoomStatus          @default(ACTIVE)

  building            Building            @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  roomType            RoomType            @relation(fields: [roomTypeId], references: [id])
  beds                Bed[]
  images              RoomImage[]

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([buildingId])
  @@index([buildingId, floorNumber])
  @@index([status])
  @@index([allowedOccupantType])
  @@index([isBookable])
}
```

### RoomImage

```prisma
model RoomImage {
  id        String   @id @default(cuid())
  roomId    String
  url       String
  caption   String?
  isPrimary Boolean  @default(false)
  order     Int      @default(0)

  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([roomId])
  @@index([isPrimary])
}
```

### Bed

```prisma
model Bed {
  id          String      @id @default(cuid())
  roomId      String
  code        String      @unique
  label       String
  position    Int
  bedType     String?
  status      BedStatus   @default(AVAILABLE)
  notes       String?

  room        Room        @relation(fields: [roomId], references: [id], onDelete: Cascade)
  occupancies Occupancy[]

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([roomId])
  @@index([status])
}
```

### Booking

```prisma
model Booking {
  id                    String        @id @default(cuid())
  code                  String        @unique

  // Requester (SNAPSHOT - no FK to Company)
  requesterUserId       String
  requesterName         String
  requesterNik          String?
  requesterEmail        String?
  requesterPhone        String?
  requesterCompany      String?       // Snapshot, not FK
  requesterDepartment   String?
  requesterPosition     String?

  // Companion (Required if has GUEST)
  companionUserId       String?
  companionName         String?
  companionNik          String?
  companionEmail        String?
  companionPhone        String?
  companionCompany      String?
  companionDepartment   String?

  // Booking Period
  checkInDate           DateTime      @db.Date
  checkOutDate          DateTime      @db.Date
  purpose               String?
  projectCode           String?

  // Status
  status                BookingStatus @default(PENDING)

  // Approval
  approvedBy            String?
  approvedAt            DateTime?

  // Rejection
  rejectedBy            String?
  rejectedAt            DateTime?
  rejectionReason       String?

  // Cancellation
  cancelledBy           String?
  cancelledAt           DateTime?
  cancellationReason    String?

  notes                 String?

  // Relations
  occupancies           Occupancy[]
  attachments           BookingAttachment[]

  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([code])
  @@index([requesterUserId])
  @@index([status])
  @@index([checkInDate])
  @@index([checkOutDate])
}
```

### BookingAttachment

```prisma
model BookingAttachment {
  id              String   @id @default(cuid())
  bookingId       String

  fileName        String
  fileUrl         String
  fileType        String
  fileSize        Int
  description     String?

  uploadedBy      String
  uploadedByName  String

  booking         Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())

  @@index([bookingId])
}
```

### Occupancy

```prisma
model Occupancy {
  id                      String          @id @default(cuid())
  bookingId               String?
  bedId                   String

  // Occupant Type & Identity
  occupantType            OccupantType
  occupantUserId          String?
  occupantName            String
  occupantNik             String?
  occupantGender          Gender
  occupantPhone           String?
  occupantEmail           String?
  occupantCompany         String?
  occupantDepartment      String?
  occupantPosition        String?

  // Stay Period
  checkInDate             DateTime        @db.Date
  checkOutDate            DateTime        @db.Date
  originalCheckOutDate    DateTime?       @db.Date  // If changed
  actualCheckIn           DateTime?
  actualCheckOut          DateTime?

  // Status
  status                  OccupancyStatus @default(PENDING)
  qrCode                  String?         @unique

  // Audit - Created (Direct Placement)
  createdBy               String?
  createdByName           String?

  // Transfer Info
  transferredFromBedId    String?
  transferReason          String?
  transferredAt           DateTime?
  transferredBy           String?
  transferredByName       String?

  // Checkout Info
  checkoutReason          String?
  checkoutBy              String?
  checkoutByName          String?

  notes                   String?

  // Relations
  booking                 Booking?        @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  bed                     Bed             @relation(fields: [bedId], references: [id])
  logs                    OccupancyLog[]

  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt

  @@index([bookingId])
  @@index([bedId])
  @@index([occupantType])
  @@index([occupantUserId])
  @@index([occupantNik])
  @@index([status])
  @@index([checkInDate])
  @@index([checkOutDate])
}
```

### OccupancyLog

```prisma
model OccupancyLog {
  id                    String             @id @default(cuid())
  occupancyId           String

  action                OccupancyLogAction

  // Transfer details
  fromBedId             String?
  toBedId               String?

  // Date change details
  previousCheckInDate   DateTime?          @db.Date
  newCheckInDate        DateTime?          @db.Date
  previousCheckOutDate  DateTime?          @db.Date
  newCheckOutDate       DateTime?          @db.Date

  // Performer
  performedBy           String
  performedByName       String
  performedAt           DateTime           @default(now())

  // Details
  reason                String?
  notes                 String?
  metadata              Json?

  occupancy             Occupancy          @relation(fields: [occupancyId], references: [id], onDelete: Cascade)

  @@index([occupancyId])
  @@index([action])
  @@index([performedAt])
}
```

---

## 🎯 Ringkasan Final v3.1

### Tabel yang Perlu Dibuat

| Tabel                 | Fungsi                                     |
| --------------------- | ------------------------------------------ |
| **BuildingImage**     | Foto gedung                                |
| **RoomImage**         | Foto kamar                                 |
| **Bed**               | Tempat tidur (target booking)              |
| **Booking**           | Pemesanan + requester snapshot + companion |
| **BookingAttachment** | File pendukung booking                     |
| **Occupancy**         | Penghuni bed                               |
| **OccupancyLog**      | Audit trail                                |

### Key Changes v3.1

| Change               | Detail                                                 |
| -------------------- | ------------------------------------------------------ |
| Requester = Snapshot | Tidak ada FK ke Company                                |
| Rejection fields     | `rejectedBy`, `rejectedAt`, `rejectionReason`          |
| Cancellation fields  | `cancelledBy`, `cancelledAt`, `cancellationReason`     |
| BookingAttachment    | Tabel baru untuk file pendukung                        |
| Early checkout       | `originalCheckOutDate`, `checkoutBy`, `checkoutByName` |
| OccupancyLog actions | + `DATE_CHANGED`, `EARLY_CHECKOUT`                     |

---

**Version:** 3.1.0  
**Status:** ✅ Ready for Final Review  
**Next Step:** Approve lalu implementasi ke Prisma

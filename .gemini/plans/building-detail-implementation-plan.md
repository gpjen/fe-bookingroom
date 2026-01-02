# Building Detail Management - Implementation Plan

**Version:** 1.0.0
**Created:** 2026-01-02
**Status:** Planning

---

## 📋 Overview

Halaman Building Detail (`/properties/buildings/[id]`) adalah halaman manajemen komprehensif untuk satu gedung. Halaman ini menampilkan dan mengelola:

- Informasi gedung (overview, lokasi, peta)
- Lantai dan Ruangan (dengan bed dan occupancy)
- Fasilitas/Galeri (CRUD BuildingImage)
- Penanggung Jawab (UserBuilding - akses user ke gedung)

---

## 🔍 Current State Analysis

### Struktur File Saat Ini:

```
buildings/[id]/
├── page.tsx                    # Main page with tabs
├── _components/
│   ├── building-header.tsx     # Header dengan nama gedung
│   ├── building-stats.tsx      # Statistik (rooms, beds, occupancy)
│   ├── building-floors.tsx     # Tab: Lantai & Kamar (MOCK DATA)
│   ├── building-overview.tsx   # Tab: Informasi gedung
│   ├── building-facilities.tsx # Tab: Galeri/Fasilitas (MOCK DATA)
│   ├── building-pic.tsx        # Tab: Penanggung Jawab (MOCK DATA)
│   ├── facility-form.tsx       # Form untuk fasilitas
│   ├── form-room.tsx           # Form untuk ruangan
│   ├── pic-form.tsx            # Form untuk PIC
│   └── room-detail-sheet.tsx   # Detail sheet ruangan
```

### Database Models (Prisma):

| Model           | Table           | Status            | Description                    |
| --------------- | --------------- | ----------------- | ------------------------------ |
| `Building`      | buildings       | ✅ Migrated       | Gedung dengan lokasi (lat/lng) |
| `BuildingImage` | building_images | ⚠️ Need Migration | Foto/galeri gedung             |
| `Room`          | rooms           | ⚠️ Need Migration | Ruangan dalam gedung           |
| `RoomImage`     | room_images     | ⚠️ Need Migration | Foto ruangan                   |
| `Bed`           | beds            | ⚠️ Need Migration | Tempat tidur dalam ruangan     |
| `RoomType`      | room_types      | ⚠️ Need Migration | Master tipe ruangan            |
| `UserBuilding`  | user_buildings  | ✅ Existing       | Akses user ke gedung           |
| `Occupancy`     | occupancies     | ⚠️ Need Migration | Penghuni bed                   |
| `Booking`       | bookings        | ⚠️ Need Migration | Pemesanan                      |

---

## 🎯 Implementation Phases

### Phase 1: Database Migration & Basic Structure

**Priority:** Critical
**Duration:** 1-2 hours

Tasks:

1. Run Prisma migration untuk semua model baru
2. Buat server actions untuk Building Detail:
   - `getBuildingDetail(id)` - Get full building dengan relations
   - `getBuildingStats(id)` - Get statistik (count rooms, beds, occupancy)

Files to create:

```
buildings/[id]/_actions/
├── building-detail.schema.ts
└── building-detail.actions.ts
```

---

### Phase 2: Overview Tab Refactoring

**Priority:** High
**Duration:** 2-3 hours

Refactor `building-overview.tsx` untuk:

1. Menampilkan informasi lengkap gedung dari database
2. Menampilkan peta lokasi (read-only) jika koordinat tersedia
3. Info Area parent, Tipe bangunan
4. Timestamps (created, updated)

Schema needs:

- `getBuildingDetail(id)` dengan relations ke Area dan BuildingType

UI Components:

- Card informasi dasar
- Peta lokasi (static MapPointInput readOnly)
- Info metadata

---

### Phase 3: Building Images/Gallery (Fasilitas Tab)

**Priority:** High
**Duration:** 3-4 hours

Rename "Fasilitas" menjadi "Galeri" dan implementasi CRUD `BuildingImage`:

Tasks:

1. Buat server actions:

   - `getBuildingImages(buildingId)`
   - `createBuildingImage(data)`
   - `updateBuildingImage(id, data)`
   - `deleteBuildingImage(id)`
   - `setPrimaryImage(id)` - Set gambar utama

2. Buat schema:

   - `BuildingImageFormSchema` (url, caption, isPrimary, order)

3. Update komponen:

   - `building-facilities.tsx` → `building-gallery.tsx`
   - `facility-form.tsx` → `gallery-form.tsx`

4. UI Features:
   - Grid galeri dengan thumbnail
   - Upload gambar (atau URL input)
   - Set sebagai foto utama
   - Drag & drop untuk reorder
   - Delete dengan konfirmasi

Files structure:

```
buildings/[id]/
├── _actions/
│   ├── building-images.schema.ts
│   └── building-images.actions.ts
├── _components/
│   ├── building-gallery.tsx
│   └── gallery-form.tsx
```

---

### Phase 4: PIC / User Access Management

**Priority:** High
**Duration:** 3-4 hours

Implementasi CRUD `UserBuilding` - Penanggung Jawab Gedung:

Tasks:

1. Buat server actions:

   - `getBuildingUsers(buildingId)` - List user dengan akses
   - `addUserToBuilding(buildingId, userId)`
   - `removeUserFromBuilding(userBuildingId)`
   - `getUsersForSelect()` - Dropdown user selection

2. Update komponen:

   - `building-pic.tsx` - Refactor dari mock data
   - `pic-form.tsx` - Form untuk tambah user

3. UI Features:
   - List user dengan role info
   - Search/select user untuk ditambahkan
   - Konfirmasi hapus akses
   - Filter by role (jika ada role info)

Notes:

- `UserBuilding` hanya menyimpan `userId` dan `buildingId`
- Role info diambil dari `User.userRoles`

---

### Phase 5: Rooms Management (Lantai & Kamar Tab)

**Priority:** Critical
**Duration:** 6-8 hours

Implementasi penuh Room Management:

#### 5.1 Room Type Master Data

Pastikan `RoomType` sudah ada (bisa manual insert atau buat CRUD terpisah):

- Standard Room (4 beds)
- Deluxe Room (2 beds)
- Single Room (1 bed)
- VIP Suite (1 bed)

#### 5.2 Server Actions

```typescript
// Room Actions
getRoomsByBuilding(buildingId);
getRoomsGroupedByFloor(buildingId);
createRoom(data);
updateRoom(id, data);
deleteRoom(id);
toggleRoomStatus(id);

// Room Type Actions
getRoomTypesForSelect();
```

#### 5.3 Room Schema

```typescript
interface RoomFormInput {
  code: string; // Required, unique
  name: string; // Required
  buildingId: string; // Required
  roomTypeId: string; // Required
  floorNumber: number; // Required (1-99)
  floorName?: string; // Optional
  description?: string;
  allowedOccupantType: "EMPLOYEE_ONLY" | "ALL";
  isBookable: boolean;
  genderPolicy: "MALE_ONLY" | "FEMALE_ONLY" | "MIX" | "FLEXIBLE";
  pricePerBed?: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}
```

#### 5.4 UI Components

- `building-floors.tsx` - Refactor:
  - Accordion per lantai
  - Grid ruangan per lantai
  - Stats per lantai (rooms, beds, occupancy)
- `room-card.tsx` - Kartu ruangan:
  - Nama & kode
  - Tipe ruangan
  - Kapasitas (beds)
  - Status (color coded)
  - Occupancy indicator
- `room-form.tsx` - Form CRUD:
  - Semua field dari schema
  - Select RoomType
  - Validasi
- `room-detail-sheet.tsx` - Detail ruangan:
  - Informasi lengkap
  - List Beds dengan status
  - Occupants saat ini
  - Quick actions (add occupant, transfer, etc.)

---

### Phase 6: Bed Management

**Priority:** High
**Duration:** 4-5 hours

Implementasi Bed dalam Room:

#### 6.1 Server Actions

```typescript
getBedsByRoom(roomId);
createBed(data);
updateBed(id, data);
deleteBed(id);
updateBedStatus(id, status);
```

#### 6.2 Bed Schema

```typescript
interface BedFormInput {
  code: string; // Required, unique (auto-generate option)
  roomId: string; // Required
  label: string; // Required (e.g., "Bed A", "Bunk 1-Upper")
  position: number; // Required (order)
  bedType?: string; // Single, Double, Bunk
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
  notes?: string;
}
```

#### 6.3 Automatic Bed Generation

Saat Room dibuat, auto-generate beds berdasarkan `RoomType.bedsPerRoom`:

- Jika RoomType.bedsPerRoom = 4, buat 4 beds otomatis
- Label default: "Bed A", "Bed B", "Bed C", "Bed D"
- Status default: AVAILABLE

#### 6.4 UI in Room Detail Sheet

- List beds visual (grid atau list)
- Status badge per bed
- Occupant info jika occupied
- Quick actions: Block, Maintenance, etc.

---

### Phase 7: Occupancy Management

**Priority:** Critical
**Duration:** 6-8 hours

Implementasi Occupancy - mengelola penghuni bed:

#### 7.1 Server Actions

```typescript
// Occupancy CRUD
getOccupanciesByBed(bedId);
getActiveOccupanciesByRoom(roomId);
getOccupanciesByBuilding(buildingId);

// Direct Placement (tanpa booking)
createDirectOccupancy(data);

// Occupancy Operations
checkInOccupancy(occupancyId);
checkOutOccupancy(occupancyId, reason);
transferOccupancy(occupancyId, newBedId, reason);
cancelOccupancy(occupancyId, reason);
extendStay(occupancyId, newCheckOutDate);
```

#### 7.2 Occupancy Schema

```typescript
interface OccupancyFormInput {
  bedId: string;
  occupantType: "EMPLOYEE" | "GUEST";
  occupantUserId?: string; // For EMPLOYEE
  occupantName: string;
  occupantNik?: string;
  occupantGender: "MALE" | "FEMALE";
  occupantPhone?: string;
  occupantEmail?: string;
  occupantCompany?: string;
  occupantDepartment?: string;
  occupantPosition?: string;
  checkInDate: Date;
  checkOutDate: Date;
  notes?: string;
}
```

#### 7.3 Gender Policy Enforcement

Saat add occupancy, validasi:

- Jika room `genderPolicy` = MALE_ONLY → only male occupant
- Jika room `genderPolicy` = FEMALE_ONLY → only female occupant
- Jika room `genderPolicy` = FLEXIBLE → set `currentGender` on first occupant
- Jika room `genderPolicy` = MIX → allow any

#### 7.4 UI Components

- `occupancy-form.tsx` - Form add occupant
- `occupancy-card.tsx` - Card occupant di bed
- `transfer-dialog.tsx` - Dialog transfer ke bed lain
- `checkout-dialog.tsx` - Dialog checkout dengan reason

---

### Phase 8: Stats & Dashboard

**Priority:** Medium
**Duration:** 2-3 hours

Update `building-stats.tsx` dengan data real:

Statistik yang ditampilkan:

- Total Rooms
- Total Beds
- Occupied Beds (%)
- Available Beds
- Reserved Beds
- Maintenance Beds
- Active Occupants
- Guests vs Employees

---

### Phase 9: Room Images (Optional)

**Priority:** Low
**Duration:** 2-3 hours

Implementasi CRUD `RoomImage` di Room Detail:

- Sama seperti BuildingImage
- Attached ke Room

---

## 📊 Implementation Priority Matrix

| Phase | Nama             | Priority | Dependencies | Est. Hours |
| ----- | ---------------- | -------- | ------------ | ---------- |
| 1     | DB Migration     | Critical | None         | 1-2        |
| 2     | Overview Tab     | High     | Phase 1      | 2-3        |
| 3     | Gallery/Images   | High     | Phase 1      | 3-4        |
| 4     | PIC/User Access  | High     | Phase 1      | 3-4        |
| 5     | Rooms Management | Critical | Phase 1      | 6-8        |
| 6     | Bed Management   | High     | Phase 5      | 4-5        |
| 7     | Occupancy        | Critical | Phase 6      | 6-8        |
| 8     | Stats Dashboard  | Medium   | Phase 5-7    | 2-3        |
| 9     | Room Images      | Low      | Phase 5      | 2-3        |

**Total Estimated: 30-40 hours**

---

## 🔄 Recommended Order

1. **Phase 1** - Database Migration (MUST DO FIRST)
2. **Phase 2** - Overview Tab (simple, sets foundation)
3. **Phase 4** - PIC/User Access (simpler than rooms)
4. **Phase 3** - Gallery/Images (learn the pattern)
5. **Phase 5** - Rooms Management (core feature)
6. **Phase 6** - Beds (extends rooms)
7. **Phase 7** - Occupancy (extends beds)
8. **Phase 8** - Stats (uses all data)
9. **Phase 9** - Room Images (optional enhancement)

---

## 🧩 Technical Stack

- **Server Actions**: Next.js Server Actions (no API routes)
- **Validation**: Zod schemas
- **ORM**: Prisma
- **UI**: Shadcn/ui components
- **State**: React useState + optimistic updates
- **Form**: React Hook Form + Zod resolver

---

## 📝 Notes

1. **Mock Data Cleanup**: Semua komponen saat ini menggunakan mock data. Perlu diganti dengan server actions.

2. **Optimistic Updates**: Gunakan pattern yang sama seperti di Buildings CRUD - update UI dulu, sync ke server di background.

3. **Error Handling**: Semua actions return `ActionResponse<T>` type untuk konsistensi.

4. **Tab Renaming**:

   - "Fasilitas" → "Galeri" (BuildingImage)
   - "Lantai & Kamar" → tetap sama

5. **Bed Auto-Generation**: Saat create room, otomatis generate beds berdasarkan RoomType.bedsPerRoom

6. **Occupancy Logs**: Setiap perubahan status occupancy harus dicatat di `OccupancyLog`

---

## ✅ Acceptance Criteria

### Per Phase:

- [ ] Data tersimpan di database
- [ ] CRUD berfungsi dengan validasi
- [ ] UI update optimistic
- [ ] Error handling dengan toast
- [ ] Loading states

### Overall:

- [ ] Semua mock data dihapus
- [ ] Konsisten dengan pattern Companies/Buildings
- [ ] Responsive design
- [ ] Proper TypeScript types
- [ ] No console errors

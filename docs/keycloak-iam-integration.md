# IAM Employee Search Integration

## Arsitektur dengan Fallback

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARSITEKTUR PENCARIAN KARYAWAN (dengan Fallback)           │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────────┐
                           │   User ketik NIK     │
                           │   di Form            │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │   1. Search IAM      │
                           │   (Portal API)       │
                           └──────────┬───────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    ✅ Found                  ❌ Not Found
                         │                         │
                         ▼                         ▼
              ┌──────────────────┐      ┌──────────────────┐
              │ Return IAM Data  │      │ 2. Search Local  │
              │ (from Keycloak)  │      │ Occupant by NIK  │
              └──────────────────┘      └──────────┬───────┘
                                                   │
                                      ┌────────────┴────────────┐
                                      │                         │
                                 ✅ Found                  ❌ Not Found
                                      │                         │
                                      ▼                         ▼
                           ┌──────────────────┐      ┌──────────────────┐
                           │ Return Occupant  │      │ Return Empty     │
                           │ (from Database)  │      │ (User isi manual)│
                           └──────────────────┘      └──────────────────┘
```

---

## Flow Berdasarkan Tipe Penghuni

### Karyawan (EMPLOYEE)

```
1. Pilih Tipe: Karyawan
       │
       ▼
2. Ketik NIK
       │
       ▼
3. Search IAM (Portal API) ─── ✅ Found ──▶ Return dari IAM
       │
  ❌ Not Found
       │
       ▼
4. Search Local DB (EMPLOYEE) ─── ✅ Found ──▶ Return dari DB
       │
  ❌ Not Found
       │
       ▼
5. User isi manual
```

### Tamu (GUEST)

```
1. Pilih Tipe: Tamu
       │
       ▼
2. Ketik NIK/Identitas
       │
       ▼
3. Search Local DB (GUEST) ─── ✅ Found ──▶ Return dari DB
       │
  ❌ Not Found
       │
       ▼
4. Search Local DB (ANY) ─── ✅ Found ──▶ Return dari DB
       │
  ❌ Not Found
       │
       ▼
5. User isi manual
```

---

## Field yang Dapat Diedit

| Field         | Dari IAM     | Dari Database | Manual      |
| ------------- | ------------ | ------------- | ----------- |
| NIK/Username  | ❌ Read-only | ❌ Read-only  | ✅ Editable |
| Nama          | ❌ Read-only | ✅ Editable   | ✅ Editable |
| Tipe Penghuni | ❌ Locked    | ✅ Editable   | ✅ Editable |
| Jenis Kelamin | ✅ Editable  | ✅ Editable   | ✅ Editable |
| Perusahaan    | ❌ Read-only | ✅ Editable   | ✅ Editable |
| Departemen    | ❌ Read-only | ✅ Editable   | ✅ Editable |
| Telepon       | ✅ Editable  | ✅ Editable   | ✅ Editable |
| Email         | ✅ Editable  | ✅ Editable   | ✅ Editable |

---

## Prioritas Data Source

| Tipe         | Prioritas 1      | Prioritas 2         | Prioritas 3 |
| ------------ | ---------------- | ------------------- | ----------- |
| **EMPLOYEE** | IAM (Portal API) | Local DB (EMPLOYEE) | Manual      |
| **GUEST**    | Local DB (GUEST) | Local DB (ANY)      | Manual      |

---

## Response Mapping

### Source 1: IAM Portal API Response

```json
{
  "status": "success",
  "data": [
    {
      "username": "s0924000599",
      "email": "wahyu@example.com",
      "phone_number": "+62-82188162336",
      "name": "Wahyu Adi Susanto",
      "organization_name": "Health and Safety Environment",
      "section": "Health and Safety Environment",
      "unit": "Health and Safety Environment",
      "company": "PT. Karunia Permai Sentosa"
    }
  ]
}
```

### Source 2: Local Occupant Database

```json
{
  "id": "uuid-...",
  "nik": "S0924000599",
  "name": "Wahyu Adi Susanto",
  "email": "wahyu@example.com",
  "phone": "+62-821881633333",
  "company": "PT. Karunia Permai Sentosa",
  "department": "Health and Safety Environment",
  "gender": "MALE",
  "type": "EMPLOYEE"
}
```

### Unified Response Format

```typescript
interface EmployeeSearchResult {
  found: boolean;
  source: "iam" | "local" | null;
  data: {
    nik: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    department: string | null;
    gender: "MALE" | "FEMALE" | null; // Only from local
    type: "EMPLOYEE" | "GUEST" | null; // Only from local
  } | null;
}
```

---

## Server Action Implementation

```typescript
"use server";

export async function searchEmployeeByNIK(
  nik: string
): Promise<ActionResponse<EmployeeSearchResult>> {
  // 1. Validate NIK format (minimal 5 karakter)
  if (!nik || nik.trim().length < 3) {
    return { success: false, error: "NIK minimal 3 karakter" };
  }

  const normalizedNik = nik.trim().toUpperCase();

  // 2. Get session & token
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Session tidak valid" };
  }

  // =====================================
  // STEP 1: Search from IAM (Portal API)
  // =====================================
  try {
    const iamResponse = await fetch(
      `${process.env.IAM_PORTAL_API_URL}/iam/search-users/${normalizedNik}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        // Timeout 5 seconds
        signal: AbortSignal.timeout(5000),
      }
    );

    if (iamResponse.ok) {
      const iamData = await iamResponse.json();

      if (iamData.status === "success" && iamData.data?.length > 0) {
        const employee = iamData.data[0];
        return {
          success: true,
          data: {
            found: true,
            source: "iam",
            data: {
              nik: employee.username.toUpperCase(),
              name: employee.name,
              email: employee.email || null,
              phone: employee.phone_number || null,
              company: employee.company || null,
              department:
                employee.organization_name || employee.section || null,
              gender: null, // IAM tidak return gender
              type: "EMPLOYEE", // Dari IAM = pasti employee
            },
          },
        };
      }
    }
  } catch (error) {
    // IAM error/timeout - continue to local search
    console.warn("IAM search failed, falling back to local:", error);
  }

  // =====================================
  // STEP 2: Search from Local Occupant DB
  // =====================================
  const localOccupant = await prisma.occupant.findFirst({
    where: {
      nik: { equals: normalizedNik, mode: "insensitive" }, // Case insensitive
      deletedAt: null,
    },
  });

  if (localOccupant) {
    return {
      success: true,
      data: {
        found: true,
        source: "local",
        data: {
          nik: localOccupant.nik || normalizedNik,
          name: localOccupant.name,
          email: localOccupant.email || null,
          phone: localOccupant.phone || null,
          company: localOccupant.company || null,
          department: localOccupant.department || null,
          gender: localOccupant.gender,
          type: localOccupant.type,
        },
      },
    };
  }

  // =====================================
  // STEP 3: Not found anywhere
  // =====================================
  return {
    success: true,
    data: {
      found: false,
      source: null,
      data: null,
    },
  };
}
```

---

## UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ASSIGN OCCUPANT DIALOG                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔍 Cari Karyawan (NIK)                                         │
│  ┌──────────────────────────────────────┐  ┌─────────┐          │
│  │ S0924000599                          │  │ Cari 🔍 │          │
│  └──────────────────────────────────────┘  └─────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ✅ Ditemukan dari: IAM (Keycloak)                        │   │
│  │                                                          │   │
│  │   👤 Wahyu Adi Susanto                                   │   │
│  │   🏢 PT. Karunia Permai Sentosa                          │   │
│  │   📂 Health and Safety Environment                       │   │
│  │   📞 +62-821881633333                                    │   │
│  │                                                          │   │
│  │   [✓ Gunakan Data Ini]                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────── atau ───────────────                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📋 Ditemukan dari: Database Lokal                        │   │
│  │    (Pernah menginap sebelumnya)                          │   │
│  │                                                          │   │
│  │   👤 Wahyu Adi Susanto (Laki-laki)                       │   │
│  │   🏢 PT. XYZ                                              │   │
│  │   📂 IT Department                                        │   │
│  │                                                          │   │
│  │   [✓ Gunakan Data Ini]                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────── atau isi manual ────────────────               │
│                                                                  │
│  Tipe: [Karyawan ▼]     Gender: [-- Pilih -- ▼]                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Nama Lengkap *  │    │ NIK             │                     │
│  └─────────────────┘    └─────────────────┘                     │
│  ...                                                             │
│                                                                  │
│                              [Batal] [Check-in]                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## States UI

| State             | Tampilan                                     |
| ----------------- | -------------------------------------------- |
| **Initial**       | Input NIK kosong, form kosong                |
| **Searching**     | Loading spinner di tombol cari               |
| **Found (IAM)**   | Card hijau dengan badge "IAM"                |
| **Found (Local)** | Card biru dengan badge "Database Lokal"      |
| **Not Found**     | Warning message, user isi manual             |
| **Error**         | Error toast, user bisa retry atau isi manual |

---

## Environment Variables

```env
# Portal API untuk IAM
IAM_PORTAL_API_URL=https://portal.obi.com/api

# Optional: Timeout untuk API call (ms)
IAM_API_TIMEOUT=5000
```

---

## Files to Create/Modify

### New Files:

```
src/lib/iam/
├── types.ts              # Type definitions
├── iam.actions.ts        # Server action searchEmployeeByNIK
└── index.ts              # Exports
```

### Modify:

```
src/app/(protected)/properties/buildings/[id]/_components/
└── room-detail-sheet.tsx  # Update AssignOccupantDialog
```

---

## ✅ Checklist Implementasi

- [ ] Tambah env `IAM_PORTAL_API_URL` ke `.env.local`
- [ ] Buat `src/lib/iam/types.ts`
- [ ] Buat `src/lib/iam/iam.actions.ts` dengan:
  - [ ] Search IAM (Portal API)
  - [ ] Fallback ke local Occupant (case insensitive)
- [ ] Update `AssignOccupantDialog`:
  - [ ] Tambah NIK search input
  - [ ] Handling loading state
  - [ ] Display hasil dari IAM atau Local
  - [ ] Auto-fill form
- [ ] Testing:
  - [ ] NIK ada di IAM → return IAM data
  - [ ] NIK tidak ada di IAM tapi ada di local → return local
  - [ ] NIK tidak ada di keduanya → return empty
  - [ ] Portal API timeout → fallback ke local

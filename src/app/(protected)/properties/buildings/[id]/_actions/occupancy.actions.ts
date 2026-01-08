"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  ActionResponse,
  OccupancyData,
  BedWithOccupancy,
  AssignOccupantInput,
  assignOccupantSchema,
  TransferOccupantInput,
  transferOccupantSchema,
  CheckoutOccupantInput,
  checkoutOccupantSchema,
  OccupancyLogData,
  RoomHistoryFilter,
  OccupancyLogAction,
} from "./occupancy.types";

// ========================================
// HELPER: Get current user
// ========================================

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  // Use username (NIK) or email as ID
  const userId = session.user.username || session.user.email || "unknown";
  return {
    id: userId,
    name: session.user.name || session.user.email || "Unknown",
  };
}

// ========================================
// GET BEDS WITH ACTIVE OCCUPANCY
// ========================================

export async function getBedsWithOccupancy(
  roomId: string
): Promise<ActionResponse<BedWithOccupancy[]>> {
  try {
    const beds = await prisma.bed.findMany({
      where: { roomId, deletedAt: null },
      orderBy: { position: "asc" },
      select: {
        id: true,
        code: true,
        label: true,
        position: true,
        bedType: true,

        notes: true,
        occupancies: {
          where: {
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
          },
          orderBy: { checkInDate: "desc" },
          take: 1,
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            actualCheckIn: true,
            status: true,
            occupant: {
              select: {
                id: true,
                name: true,
                type: true,
                gender: true,
                company: true,
                nik: true,
              },
            },
          },
        },
        // Include pending booking requests (PENDING status bookings)
        requestItems: {
          where: {
            booking: {
              status: "PENDING", // Only pending bookings
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            bookingId: true,
            name: true,
            gender: true,
            type: true,
            checkInDate: true,
            checkOutDate: true,
            createdAt: true,
            booking: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    const result: BedWithOccupancy[] = beds.map((bed) => ({
      id: bed.id,
      code: bed.code,
      label: bed.label,
      position: bed.position,
      bedType: bed.bedType,

      notes: bed.notes,
      activeOccupancy: bed.occupancies[0]
        ? {
            id: bed.occupancies[0].id,
            occupant: {
              id: bed.occupancies[0].occupant.id,
              name: bed.occupancies[0].occupant.name,
              type: bed.occupancies[0].occupant.type,
              gender: bed.occupancies[0].occupant.gender,
              company: bed.occupancies[0].occupant.company,
              nik: bed.occupancies[0].occupant.nik,
            },
            checkInDate: bed.occupancies[0].checkInDate,
            checkOutDate: bed.occupancies[0].checkOutDate,
            actualCheckIn: bed.occupancies[0].actualCheckIn,
            status: bed.occupancies[0].status,
          }
        : null,
      pendingRequest: bed.requestItems[0]
        ? {
            id: bed.requestItems[0].id,
            bookingId: bed.requestItems[0].bookingId,
            bookingCode: bed.requestItems[0].booking.code,
            name: bed.requestItems[0].name,
            gender: bed.requestItems[0].gender,
            type: bed.requestItems[0].type,
            checkInDate: bed.requestItems[0].checkInDate,
            checkOutDate: bed.requestItems[0].checkOutDate,
            createdAt: bed.requestItems[0].createdAt,
          }
        : null,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("[GET_BEDS_WITH_OCCUPANCY_ERROR]", error);
    return { success: false, error: "Gagal mengambil data bed" };
  }
}

// ========================================
// GET ACTIVE OCCUPANCY FOR A BED
// ========================================

export async function getActiveOccupancy(
  bedId: string
): Promise<ActionResponse<OccupancyData | null>> {
  try {
    const occupancy = await prisma.occupancy.findFirst({
      where: {
        bedId,
        status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
      },
      orderBy: { checkInDate: "desc" },
      include: {
        occupant: true,
      },
    });

    if (!occupancy) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: occupancy.id,
        bookingId: occupancy.bookingId,
        occupantId: occupancy.occupantId,
        bedId: occupancy.bedId,
        occupant: {
          id: occupancy.occupant.id,
          type: occupancy.occupant.type,
          userId: occupancy.occupant.userId,
          nik: occupancy.occupant.nik,
          name: occupancy.occupant.name,
          gender: occupancy.occupant.gender,
          phone: occupancy.occupant.phone,
          email: occupancy.occupant.email,
          company: occupancy.occupant.company,
          department: occupancy.occupant.department,
          position: occupancy.occupant.position,
          photoUrl: occupancy.occupant.photoUrl,
          createdAt: occupancy.occupant.createdAt,
          updatedAt: occupancy.occupant.updatedAt,
        },
        checkInDate: occupancy.checkInDate,
        checkOutDate: occupancy.checkOutDate,
        actualCheckIn: occupancy.actualCheckIn,
        actualCheckOut: occupancy.actualCheckOut,
        status: occupancy.status,
        qrCode: occupancy.qrCode,
        notes: occupancy.notes,
        createdAt: occupancy.createdAt,
        updatedAt: occupancy.updatedAt,
      },
    };
  } catch (error) {
    console.error("[GET_ACTIVE_OCCUPANCY_ERROR]", error);
    return { success: false, error: "Gagal mengambil data penghuni" };
  }
}

// ========================================
// ASSIGN OCCUPANT TO BED (DIRECT PLACEMENT)
// ========================================

export async function assignOccupant(
  input: AssignOccupantInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Validate input
    const validated = assignOccupantSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check bed exists and is available
    const bed = await prisma.bed.findUnique({
      where: { id: data.bedId },
      select: {
        id: true,

        room: {
          select: {
            id: true,
            buildingId: true,
            genderPolicy: true,
            currentGender: true,
            building: {
              select: {
                areaId: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }



    // Check for date conflicts with existing/future reservations on this bed
    const requestedCheckIn = new Date(data.checkInDate);
    requestedCheckIn.setHours(0, 0, 0, 0);
    const requestedCheckOut = data.checkOutDate ? new Date(data.checkOutDate) : null;
    if (requestedCheckOut) {
      requestedCheckOut.setHours(23, 59, 59, 999);
    }

    // Find any occupancy that overlaps with the requested dates
    // Overlap conditions:
    // 1. Existing occupancy with no end date (indefinite) that started before requested checkout
    // 2. Existing occupancy that starts before requested checkout AND ends after requested checkin
    const overlappingOccupancies = await prisma.occupancy.findMany({
      where: {
        bedId: data.bedId,
        status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
        OR: [
          // Case 1: Indefinite stay (no checkout date) - overlaps if starts before our checkout (or anytime if we also have no checkout)
          {
            checkOutDate: null,
            checkInDate: requestedCheckOut 
              ? { lte: requestedCheckOut }
              : { lte: requestedCheckIn }, // If both indefinite, any overlap
          },
          // Case 2: Has checkout date - standard overlap check
          // Two reservations overlap if: existingStart < requestedEnd AND existingEnd > requestedStart
          {
            AND: [
              { checkOutDate: { not: null } },
              { checkOutDate: { gt: requestedCheckIn } },
              requestedCheckOut 
                ? { checkInDate: { lt: requestedCheckOut } }
                : {}, // If no checkout requested, any future reservation overlaps
            ],
          },
        ],
      },
      include: {
        occupant: {
          select: { name: true },
        },
      },
      take: 1,
    });

    if (overlappingOccupancies.length > 0) {
      const existing = overlappingOccupancies[0];
      const existingCheckIn = new Date(existing.checkInDate);
      const existingCheckOut = existing.checkOutDate ? new Date(existing.checkOutDate) : null;
      
      const dateInfo = existingCheckOut 
        ? `${existingCheckIn.toLocaleDateString('id-ID')} - ${existingCheckOut.toLocaleDateString('id-ID')}`
        : `mulai ${existingCheckIn.toLocaleDateString('id-ID')} (tanpa batas)`;
      
      return { 
        success: false, 
        error: `Bed sudah direservasi oleh ${existing.occupant.name} untuk periode ${dateInfo}` 
      };
    }

    // Check for pending booking requests (race condition prevention)
    const pendingBookingRequests = await prisma.bookingRequestItem.findMany({
      where: {
        bedId: data.bedId,
        booking: {
          status: "PENDING", // Only pending bookings
        },
        // Check date overlap
        OR: [
          // Request ends after our checkin AND starts before our checkout
          {
            checkOutDate: { gt: requestedCheckIn },
            checkInDate: requestedCheckOut 
              ? { lt: requestedCheckOut }
              : { lte: requestedCheckIn },
          },
        ],
      },
      include: {
        booking: {
          select: { code: true },
        },
      },
      take: 1,
    });

    if (pendingBookingRequests.length > 0) {
      const pending = pendingBookingRequests[0];
      const pendingCheckIn = new Date(pending.checkInDate);
      const pendingCheckOut = new Date(pending.checkOutDate);
      
      const dateInfo = `${pendingCheckIn.toLocaleDateString('id-ID')} - ${pendingCheckOut.toLocaleDateString('id-ID')}`;
      
      return { 
        success: false, 
        error: `Bed memiliki booking request pending (${pending.booking.code}) untuk ${pending.name} periode ${dateInfo}. Silakan approve/reject booking terlebih dahulu.` 
      };
    }

    // Find or create Occupant
    let occupant;
    
    if (data.occupantId) {
      // Use existing occupant
      occupant = await prisma.occupant.findUnique({
        where: { id: data.occupantId, deletedAt: null },
      });
      if (!occupant) {
        return { success: false, error: "Occupant tidak ditemukan" };
      }
    } else if (data.occupantNik) {
      // Find or create by NIK
      occupant = await prisma.occupant.findUnique({
        where: { nik: data.occupantNik },
      });
      
      if (occupant) {
        // Occupant exists - update with latest data from form
        // This ensures the occupant record stays up-to-date
        occupant = await prisma.occupant.update({
          where: { id: occupant.id },
          data: {
            // Update fields if provided (don't overwrite with empty values)
            ...(data.occupantName && { name: data.occupantName }),
            ...(data.occupantGender && { gender: data.occupantGender }),
            ...(data.occupantPhone !== undefined && { phone: data.occupantPhone || null }),
            ...(data.occupantEmail !== undefined && { email: data.occupantEmail || null }),
            ...(data.occupantCompany !== undefined && { company: data.occupantCompany || null }),
            ...(data.occupantDepartment !== undefined && { department: data.occupantDepartment || null }),
            // Update type if explicitly provided
            ...(data.occupantType && { type: data.occupantType }),
          },
        });
      } else {
        // Create new occupant
        if (!data.occupantName || !data.occupantGender) {
          return { success: false, error: "Nama dan gender wajib untuk occupant baru" };
        }
        occupant = await prisma.occupant.create({
          data: {
            type: data.occupantType || "EMPLOYEE",
            userId: data.occupantUserId || null,
            nik: data.occupantNik,
            name: data.occupantName,
            gender: data.occupantGender,
            phone: data.occupantPhone || null,
            email: data.occupantEmail || null,
            company: data.occupantCompany || null,
            department: data.occupantDepartment || null,
            position: data.occupantPosition || null,
          },
        });
      }
    } else {
      return { success: false, error: "Occupant ID atau NIK wajib diisi" };
    }

    // Check gender policy
    const room = bed.room;
    if (room.genderPolicy === "MALE_ONLY" && occupant.gender !== "MALE") {
      return { success: false, error: "Ruangan ini hanya untuk laki-laki" };
    }
    if (room.genderPolicy === "FEMALE_ONLY" && occupant.gender !== "FEMALE") {
      return { success: false, error: "Ruangan ini hanya untuk perempuan" };
    }
    if (room.genderPolicy === "FLEXIBLE" && room.currentGender) {
      if (room.currentGender !== occupant.gender) {
        return {
          success: false,
          error: `Ruangan ini saat ini untuk ${room.currentGender === "MALE" ? "laki-laki" : "perempuan"}`,
        };
      }
    }

    // Check if occupant already has active stay in SAME area
    const existingInSameArea = await prisma.occupancy.findFirst({
      where: {
        occupantId: occupant.id,
        status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
        bed: {
          room: {
            building: {
              areaId: room.building.areaId,
            },
          },
        },
      },
      include: {
        bed: {
          include: {
            room: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (existingInSameArea) {
      return {
        success: false,
        error: `${occupant.name} sudah memiliki penginapan aktif di ${existingInSameArea.bed.room.building.name}`,
      };
    }

    // Create occupancy using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine initial status
      const initialStatus = data.autoCheckIn ? "CHECKED_IN" : "RESERVED";

      // Create occupancy
      const newOccupancy = await tx.occupancy.create({
        data: {
          bedId: data.bedId,
          occupantId: occupant.id,
          bookingId: null, // Direct placement, no booking
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate || null, // null = indefinite
          actualCheckIn: data.autoCheckIn ? new Date() : null,
          status: initialStatus,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          notes: data.notes || null,
        },
      });

      // Update room currentGender if FLEXIBLE
      if (room.genderPolicy === "FLEXIBLE" && !room.currentGender) {
        await tx.room.update({
          where: { id: room.id },
          data: { currentGender: occupant.gender },
        });
      }

      // Create log
      await tx.occupancyLog.create({
        data: {
          occupancyId: newOccupancy.id,
          bedId: data.bedId,
          action: data.autoCheckIn ? "CHECKED_IN" : "CREATED",
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          notes: data.autoCheckIn
            ? "Direct check-in by admin"
            : "Direct placement by admin",
        },
      });

      return newOccupancy;
    });

    // Revalidate cache
    revalidatePath(`/properties/buildings/${bed.room.buildingId}`);

    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("[ASSIGN_OCCUPANT_ERROR]", error);
    return { success: false, error: "Gagal menambahkan penghuni" };
  }
}

// ========================================
// CHECK-IN OCCUPANT
// ========================================

export async function checkInOccupant(
  occupancyId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const occupancy = await prisma.occupancy.findUnique({
      where: { id: occupancyId },
      select: {
        id: true,
        status: true,
        bed: {
          select: {
            id: true,
            room: { select: { buildingId: true } },
          },
        },
      },
    });

    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    if (occupancy.status !== "RESERVED" && occupancy.status !== "PENDING") {
      return { success: false, error: "Status tidak valid untuk check-in" };
    }

    await prisma.$transaction(async (tx) => {
      // Update occupancy
      await tx.occupancy.update({
        where: { id: occupancyId },
        data: {
          status: "CHECKED_IN",
          actualCheckIn: new Date(),
        },
      });



      // Create log
      await tx.occupancyLog.create({
        data: {
          occupancyId,
          bedId: occupancy.bed.id, // Where this action occurred
          action: "CHECKED_IN",
          performedBy: currentUser.id,
          performedByName: currentUser.name,
        },
      });
    });

    revalidatePath(`/properties/buildings/${occupancy.bed.room.buildingId}`);

    return { success: true, data: { id: occupancyId } };
  } catch (error) {
    console.error("[CHECK_IN_OCCUPANT_ERROR]", error);
    return { success: false, error: "Gagal melakukan check-in" };
  }
}

// ========================================
// CHECK-OUT OCCUPANT
// ========================================

export async function checkOutOccupant(
  input: CheckoutOccupantInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const validated = checkoutOccupantSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const occupancy = await prisma.occupancy.findUnique({
      where: { id: input.occupancyId },
      select: {
        id: true,
        status: true,
        bed: {
          select: {
            id: true,
            roomId: true,
            room: {
              select: {
                id: true,
                buildingId: true,
                genderPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    if (occupancy.status === "CHECKED_OUT" || occupancy.status === "CANCELLED") {
      return { success: false, error: "Penghuni sudah checkout atau dibatalkan" };
    }

    await prisma.$transaction(async (tx) => {
      // Update occupancy
      await tx.occupancy.update({
        where: { id: input.occupancyId },
        data: {
          status: "CHECKED_OUT",
          actualCheckOut: new Date(),
          checkoutReason: input.reason || null,
          checkoutBy: currentUser.id,
          checkoutByName: currentUser.name,
        },
      });



      // Check if room has any more occupants (for FLEXIBLE gender policy)
      if (occupancy.bed.room.genderPolicy === "FLEXIBLE") {
        const remainingOccupants = await tx.occupancy.count({
          where: {
            bed: { roomId: occupancy.bed.roomId },
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            id: { not: input.occupancyId },
          },
        });

        if (remainingOccupants === 0) {
          // Reset room gender
          await tx.room.update({
            where: { id: occupancy.bed.room.id },
            data: { currentGender: null },
          });
        }
      }

      // Create log
      await tx.occupancyLog.create({
        data: {
          occupancyId: input.occupancyId,
          bedId: occupancy.bed.id, // Where this action occurred
          action: "CHECKED_OUT",
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          reason: input.reason || null,
        },
      });
    });

    revalidatePath(`/properties/buildings/${occupancy.bed.room.buildingId}`);

    return { success: true, data: { id: input.occupancyId } };
  } catch (error) {
    console.error("[CHECK_OUT_OCCUPANT_ERROR]", error);
    return { success: false, error: "Gagal melakukan checkout" };
  }
}

// ========================================
// TRANSFER OCCUPANT TO DIFFERENT BED
// ========================================

export async function transferOccupant(
  input: TransferOccupantInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const validated = transferOccupantSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { occupancyId, targetBedId, transferDate, newCheckOutDate, reason } = validated.data;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Get occupancy with occupant
    const occupancy = await prisma.occupancy.findUnique({
      where: { id: occupancyId },
      include: {
        occupant: true,
        bed: {
          select: {
            id: true,
            code: true,
            label: true,
            room: { select: { id: true, buildingId: true, name: true, genderPolicy: true } },
          },
        },
      },
    });

    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    if (occupancy.status !== "CHECKED_IN" && occupancy.status !== "RESERVED") {
      return { success: false, error: "Status tidak valid untuk transfer" };
    }

    // Validasi Tanggal Transfer
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transferDateObj = new Date(transferDate);
    transferDateObj.setHours(0, 0, 0, 0);
    const checkInDateObj = new Date(occupancy.checkInDate);
    checkInDateObj.setHours(0, 0, 0, 0);
    
    if (transferDateObj < checkInDateObj) {
      return { success: false, error: "Tanggal transfer tidak boleh sebelum tanggal check-in awal" };
    }

    // Get target bed
    const targetBed = await prisma.bed.findUnique({
      where: { id: targetBedId },
      select: {
        id: true,
        code: true,
        label: true,
        occupancies: {
          where: {
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            OR: [{ checkOutDate: null }, { checkOutDate: { gte: transferDateObj } }],
          },
          select: { id: true },
        },
        room: {
          select: {
            id: true,
            name: true,
            buildingId: true,
            genderPolicy: true,
            currentGender: true,
          },
        },
      },
    });

    if (!targetBed) {
      return { success: false, error: "Bed tujuan tidak ditemukan" };
    }

    if (targetBed.occupancies.length > 0) {
       return { success: false, error: "Bed tujuan tidak tersedia (sedang terisi/dipesan)" };
    }

    // Gender Policy Checks using Occupant data
    const targetRoom = targetBed.room;
    const occupantGender = occupancy.occupant.gender;
    
    if (targetRoom.genderPolicy === "MALE_ONLY" && occupantGender !== "MALE") {
      return { success: false, error: "Ruangan tujuan hanya untuk laki-laki" };
    }
    if (targetRoom.genderPolicy === "FEMALE_ONLY" && occupantGender !== "FEMALE") {
      return { success: false, error: "Ruangan tujuan hanya untuk perempuan" };
    }
    if (targetRoom.genderPolicy === "FLEXIBLE" && targetRoom.currentGender) {
      if (targetRoom.currentGender !== occupantGender) {
        return {
          success: false,
          error: `Ruangan tujuan saat ini untuk ${targetRoom.currentGender === "MALE" ? "laki-laki" : "perempuan"}`,
        };
      }
    }

    const oldBedId = occupancy.bedId;
    
    // Final check out date: use new one if provided, else use old one
    let finalCheckOutDate: Date | null = newCheckOutDate || occupancy.checkOutDate;
    // If checkout date exists and is before/equal to transfer start, clear it
    if (finalCheckOutDate && finalCheckOutDate <= transferDateObj) {
       finalCheckOutDate = null;
    }

    await prisma.$transaction(async (tx) => {
      // With Occupant model, transfer is simple: just update bedId
      // No need to create new Occupancy because occupant data is in separate table
      
      await tx.occupancy.update({
        where: { id: occupancyId },
        data: {
          bedId: targetBedId,
          checkOutDate: finalCheckOutDate,
          transferredFromBedId: oldBedId,
          transferReason: reason,
          transferredAt: new Date(),
          transferredBy: currentUser.id,
          transferredByName: currentUser.name,
        },
      });



      // Log transfer
      await tx.occupancyLog.create({
        data: {
          occupancyId: occupancyId,
          bedId: null, // Transfer uses fromBedId/toBedId
          action: "TRANSFERRED",
          fromBedId: oldBedId,
          toBedId: targetBedId,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          reason: reason,
        },
      });

      // Update room gender if flexible
      if (targetRoom.genderPolicy === "FLEXIBLE" && !targetRoom.currentGender) {
        await tx.room.update({
          where: { id: targetRoom.id },
          data: { currentGender: occupantGender },
        });
      }

      // Reset source room gender if it was flexible and no other occupants remain
      if (occupancy.bed.room.genderPolicy === "FLEXIBLE") {
        const remainingOccupants = await tx.occupancy.count({
          where: {
            bed: { roomId: occupancy.bed.room.id },
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            id: { not: occupancyId },
          },
        });

        if (remainingOccupants === 0) {
          await tx.room.update({
            where: { id: occupancy.bed.room.id },
            data: { currentGender: null },
          });
        }
      }
    });

    revalidatePath(`/properties/buildings/${occupancy.bed.room.buildingId}`);
    
    // Also revalidate target building if different
    if (occupancy.bed.room.buildingId !== targetBed.room.buildingId) {
       revalidatePath(`/properties/buildings/${targetBed.room.buildingId}`);
    }

    return { success: true, data: { id: occupancyId } };
  } catch (error) {
    console.error("[TRANSFER_OCCUPANT_ERROR]", error);
    return { success: false, error: "Gagal melakukan transfer" };
  }
}

// ========================================
// CANCEL OCCUPANCY (for RESERVED/PENDING)
// ========================================

export async function cancelOccupancy(
  occupancyId: string,
  reason?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const occupancy = await prisma.occupancy.findUnique({
      where: { id: occupancyId },
      select: {
        id: true,
        status: true,
        bed: {
          select: {
            id: true,
            roomId: true,
            room: {
              select: {
                id: true,
                buildingId: true,
                genderPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!occupancy) {
      return { success: false, error: "Data penghuni tidak ditemukan" };
    }

    if (occupancy.status !== "RESERVED" && occupancy.status !== "PENDING") {
      return {
        success: false,
        error: "Hanya reservasi yang pending atau reserved yang bisa dibatalkan",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Update occupancy
      await tx.occupancy.update({
        where: { id: occupancyId },
        data: {
          status: "CANCELLED",
          checkoutReason: reason || "Dibatalkan",
          checkoutBy: currentUser.id,
          checkoutByName: currentUser.name,
        },
      });



      // Check if room has any more occupants (for FLEXIBLE gender policy)
      if (occupancy.bed.room.genderPolicy === "FLEXIBLE") {
        const remainingOccupants = await tx.occupancy.count({
          where: {
            bed: { roomId: occupancy.bed.roomId },
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
            id: { not: occupancyId },
          },
        });

        if (remainingOccupants === 0) {
          await tx.room.update({
            where: { id: occupancy.bed.room.id },
            data: { currentGender: null },
          });
        }
      }

      // Create log
      await tx.occupancyLog.create({
        data: {
          occupancyId,
          bedId: occupancy.bed.id, // Where this action occurred
          action: "CANCELLED",
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          reason: reason || null,
        },
      });
    });

    revalidatePath(`/properties/buildings/${occupancy.bed.room.buildingId}`);

    return { success: true, data: { id: occupancyId } };
  } catch (error) {
    console.error("[CANCEL_OCCUPANCY_ERROR]", error);
    return { success: false, error: "Gagal membatalkan reservasi" };
  }
}

// ========================================
// GET AVAILABLE BEDS FOR TRANSFER
// ========================================

export async function getAvailableBedsForTransfer(
  currentBedId: string,
  occupantGender: "MALE" | "FEMALE"
): Promise<ActionResponse<{ id: string; code: string; label: string; roomName: string }[]>> {
  try {
    // Get current bed's room to know the building
    const currentBed = await prisma.bed.findUnique({
      where: { id: currentBedId },
      select: {
        room: {
          select: {
            buildingId: true,
            building: { select: { areaId: true } },
          },
        },
      },
    });

    if (!currentBed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    const areaId = currentBed.room.building.areaId;

    // Find available beds in all buildings within the same area that match gender policy (exclude deleted)
    const availableBeds = await prisma.bed.findMany({
      where: {
        id: { not: currentBedId },
        deletedAt: null,
        occupancies: {
          none: { status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] } },
        },
        room: {
          status: "ACTIVE",
          deletedAt: null,
          building: { areaId: areaId, deletedAt: null },
          OR: [
            { genderPolicy: "MIX" },
            { genderPolicy: occupantGender === "MALE" ? "MALE_ONLY" : "FEMALE_ONLY" },
            {
              genderPolicy: "FLEXIBLE",
              OR: [
                { currentGender: null },
                { currentGender: occupantGender },
              ],
            },
          ],
        },
      },
      select: {
        id: true,
        code: true,
        label: true,
        room: {
          select: {
            name: true,
            building: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: [
        { room: { building: { name: "asc" } } },
        { room: { floorNumber: "asc" } },
        { position: "asc" },
      ],
    });

    return {
      success: true,
      data: availableBeds.map((bed) => ({
        id: bed.id,
        code: bed.code,
        label: bed.label,
        roomName: bed.room.name,
        buildingName: bed.room.building.name,
        buildingCode: bed.room.building.code,
      })),
    };
  } catch (error) {
    console.error("[GET_AVAILABLE_BEDS_FOR_TRANSFER_ERROR]", error);
    return { success: false, error: "Gagal mengambil data bed" };
  }
}

// ========================================
// GET ROOM HISTORY (ACTIVITY LOG)
// ========================================

export async function getRoomHistory(
  roomId: string,
  filter?: RoomHistoryFilter
): Promise<ActionResponse<{ logs: OccupancyLogData[]; total: number }>> {
  try {
    const limit = filter?.limit || 20;
    const offset = filter?.offset || 0;

    // First, get all beds in this room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        beds: {
          select: { id: true },
        },
      },
    });

    if (!room) {
      return { success: false, error: "Ruangan tidak ditemukan" };
    }

    const bedIds = room.beds.map((b) => b.id);

    if (bedIds.length === 0) {
      return { success: true, data: { logs: [], total: 0 } };
    }

    // Build where clause - Include logs where:
    // 1. bedId is in this room (action occurred here)
    // 2. OR fromBedId is in this room (transferred OUT from here)
    // 3. OR toBedId is in this room (transferred IN to here)
    const baseConditions = [
      { bedId: { in: bedIds } },
      { fromBedId: { in: bedIds } },
      { toBedId: { in: bedIds } },
    ];

    // Build the final where clause with filters
    const whereClause: {
      OR: typeof baseConditions;
      action?: { in: OccupancyLogAction[] };
      performedAt?: { gte?: Date; lte?: Date };
    } = {
      OR: baseConditions,
    };

    if (filter?.actionFilter && filter.actionFilter.length > 0) {
      whereClause.action = { in: filter.actionFilter };
    }

    if (filter?.dateFrom || filter?.dateTo) {
      whereClause.performedAt = {};
      if (filter.dateFrom) {
        whereClause.performedAt.gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        whereClause.performedAt.lte = filter.dateTo;
      }
    }

    // Get total count
    const total = await prisma.occupancyLog.count({
      where: whereClause,
    });

    // Get logs with related data
    const logs = await prisma.occupancyLog.findMany({
      where: whereClause,
      orderBy: { performedAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        occupancyId: true,
        bedId: true,
        action: true,
        fromBedId: true,
        toBedId: true,
        previousCheckInDate: true,
        newCheckInDate: true,
        previousCheckOutDate: true,
        newCheckOutDate: true,
        performedBy: true,
        performedByName: true,
        performedAt: true,
        reason: true,
        notes: true,
        occupancy: {
          select: {
            id: true,
            bookingId: true,
            occupant: {
              select: {
                name: true,
                type: true,
                gender: true,
              },
            },
            booking: {
              select: {
                code: true,
              },
            },
            bed: {
              select: {
                id: true,
                code: true,
                label: true,
                room: {
                  select: {
                    name: true,
                    building: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get bed info for fromBedId and toBedId (with room and building)
    const allBedIds = new Set<string>();
    logs.forEach((log) => {
      if (log.fromBedId) allBedIds.add(log.fromBedId);
      if (log.toBedId) allBedIds.add(log.toBedId);
    });

    const bedsMap = new Map<
      string,
      { label: string; roomName: string; buildingName: string }
    >();
    if (allBedIds.size > 0) {
      const beds = await prisma.bed.findMany({
        where: { id: { in: Array.from(allBedIds) } },
        select: {
          id: true,
          label: true,
          room: {
            select: {
              name: true,
              building: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      beds.forEach((bed) => {
        bedsMap.set(bed.id, {
          label: bed.label,
          roomName: bed.room.name,
          buildingName: bed.room.building.name,
        });
      });
    }

    // Transform to OccupancyLogData
    const transformedLogs: OccupancyLogData[] = logs.map((log) => ({
      id: log.id,
      occupancyId: log.occupancyId,
      bedId: log.bedId,
      action: log.action as OccupancyLogAction,
      fromBedId: log.fromBedId,
      toBedId: log.toBedId,
      fromBedInfo: log.fromBedId ? bedsMap.get(log.fromBedId) || null : null,
      toBedInfo: log.toBedId ? bedsMap.get(log.toBedId) || null : null,
      previousCheckInDate: log.previousCheckInDate,
      newCheckInDate: log.newCheckInDate,
      previousCheckOutDate: log.previousCheckOutDate,
      newCheckOutDate: log.newCheckOutDate,
      performedBy: log.performedBy,
      performedByName: log.performedByName,
      performedAt: log.performedAt,
      reason: log.reason,
      notes: log.notes,
      occupancy: {
        id: log.occupancy.id,
        occupant: {
          name: log.occupancy.occupant.name,
          type: log.occupancy.occupant.type as "EMPLOYEE" | "GUEST",
          gender: log.occupancy.occupant.gender as "MALE" | "FEMALE",
        },
        bookingId: log.occupancy.bookingId,
        booking: log.occupancy.booking,
        bed: log.occupancy.bed,
      },
    }));

    return {
      success: true,
      data: {
        logs: transformedLogs,
        total,
      },
    };
  } catch (error) {
    console.error("[GET_ROOM_HISTORY_ERROR]", error);
    return { success: false, error: "Gagal mengambil riwayat" };
  }
}


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
      where: { roomId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        code: true,
        label: true,
        position: true,
        bedType: true,
        status: true,
        notes: true,
        occupancies: {
          where: {
            status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
          },
          orderBy: { checkInDate: "desc" },
          take: 1,
          select: {
            id: true,
            occupantName: true,
            occupantType: true,
            occupantGender: true,
            occupantCompany: true,
            checkInDate: true,
            checkOutDate: true,
            actualCheckIn: true,
            status: true,
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
      status: bed.status,
      notes: bed.notes,
      activeOccupancy: bed.occupancies[0]
        ? {
            id: bed.occupancies[0].id,
            occupantName: bed.occupancies[0].occupantName,
            occupantType: bed.occupancies[0].occupantType,
            occupantGender: bed.occupancies[0].occupantGender,
            occupantCompany: bed.occupancies[0].occupantCompany,
            checkInDate: bed.occupancies[0].checkInDate,
            checkOutDate: bed.occupancies[0].checkOutDate,
            actualCheckIn: bed.occupancies[0].actualCheckIn,
            status: bed.occupancies[0].status,
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
    });

    if (!occupancy) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: occupancy.id,
        bookingId: occupancy.bookingId,
        bedId: occupancy.bedId,
        occupantType: occupancy.occupantType,
        occupantUserId: occupancy.occupantUserId,
        occupantName: occupancy.occupantName,
        occupantNik: occupancy.occupantNik,
        occupantGender: occupancy.occupantGender,
        occupantPhone: occupancy.occupantPhone,
        occupantEmail: occupancy.occupantEmail,
        occupantCompany: occupancy.occupantCompany,
        occupantDepartment: occupancy.occupantDepartment,
        occupantPosition: occupancy.occupantPosition,
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
        status: true,
        room: {
          select: {
            id: true,
            buildingId: true,
            genderPolicy: true,
            currentGender: true,
          },
        },
      },
    });

    if (!bed) {
      return { success: false, error: "Bed tidak ditemukan" };
    }

    if (bed.status !== "AVAILABLE") {
      return { success: false, error: "Bed tidak tersedia" };
    }

    // Check gender policy
    const room = bed.room;
    if (room.genderPolicy === "MALE_ONLY" && data.occupantGender !== "MALE") {
      return { success: false, error: "Ruangan ini hanya untuk laki-laki" };
    }
    if (room.genderPolicy === "FEMALE_ONLY" && data.occupantGender !== "FEMALE") {
      return { success: false, error: "Ruangan ini hanya untuk perempuan" };
    }
    if (room.genderPolicy === "FLEXIBLE" && room.currentGender) {
      if (room.currentGender !== data.occupantGender) {
        return {
          success: false,
          error: `Ruangan ini saat ini untuk ${room.currentGender === "MALE" ? "laki-laki" : "perempuan"}`,
        };
      }
    }

    // Check if there's existing active occupancy
    const existingOccupancy = await prisma.occupancy.findFirst({
      where: {
        bedId: data.bedId,
        status: { in: ["PENDING", "RESERVED", "CHECKED_IN"] },
      },
    });

    if (existingOccupancy) {
      return { success: false, error: "Bed sudah memiliki penghuni aktif" };
    }

    // Create occupancy using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine initial status
      const initialStatus = data.autoCheckIn ? "CHECKED_IN" : "RESERVED";

      // Create occupancy
      const occupancy = await tx.occupancy.create({
        data: {
          bedId: data.bedId,
          bookingId: null, // Direct placement, no booking
          occupantType: data.occupantType,
          occupantUserId: data.occupantUserId || null,
          occupantName: data.occupantName,
          occupantNik: data.occupantNik || null,
          occupantGender: data.occupantGender,
          occupantPhone: data.occupantPhone || null,
          occupantEmail: data.occupantEmail || null,
          occupantCompany: data.occupantCompany || null,
          occupantDepartment: data.occupantDepartment || null,
          occupantPosition: data.occupantPosition || null,
          checkInDate: data.checkInDate,
          // If no checkOutDate provided, set a far future date (indefinite stay)
          checkOutDate: data.checkOutDate || new Date("2099-12-31"),
          actualCheckIn: data.autoCheckIn ? new Date() : null,
          status: initialStatus,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          notes: data.notes || null,
        },
      });

      // Update bed status
      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: data.autoCheckIn ? "OCCUPIED" : "RESERVED" },
      });

      // Update room currentGender if FLEXIBLE
      if (room.genderPolicy === "FLEXIBLE" && !room.currentGender) {
        await tx.room.update({
          where: { id: room.id },
          data: { currentGender: data.occupantGender },
        });
      }

      // Create log
      await tx.occupancyLog.create({
        data: {
          occupancyId: occupancy.id,
          bedId: data.bedId, // Where this action occurred
          action: data.autoCheckIn ? "CHECKED_IN" : "CREATED",
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          notes: data.autoCheckIn
            ? "Direct check-in by admin"
            : "Direct placement by admin",
        },
      });

      return occupancy;
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

      // Update bed status
      await tx.bed.update({
        where: { id: occupancy.bed.id },
        data: { status: "OCCUPIED" },
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

      // Update bed status to available
      await tx.bed.update({
        where: { id: occupancy.bed.id },
        data: { status: "AVAILABLE" },
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

    // Get occupancy
    const occupancy = await prisma.occupancy.findUnique({
      where: { id: occupancyId },
      include: {
        bed: {
          select: {
            id: true,
            code: true,
            label: true,
            room: { select: { buildingId: true, name: true } },
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

    if (transferDateObj < today) {
       // Allow retro-active transfer if admin needs to fix data, but generally warning.
       // For now, let's assume valid as per schema validation
    }
    
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
        status: true,
        room: {
          select: {
            id: true,
            name: true,
            buildingId: true, // Fix: Added buildingId
            genderPolicy: true,
            currentGender: true,
          },
        },
      },
    });

    if (!targetBed) {
      return { success: false, error: "Bed tujuan tidak ditemukan" };
    }

    // Note: status check skipped here because UI handles extensive availability checks
    // But double check just in case
    if (targetBed.status !== "AVAILABLE") {
       // Check if we are merging? No, simple logic for now.
       return { success: false, error: "Bed tujuan tidak tersedia" };
    }

    // Gender Policy Checks
    const targetRoom = targetBed.room;
    if (
      targetRoom.genderPolicy === "MALE_ONLY" &&
      occupancy.occupantGender !== "MALE"
    ) {
      return { success: false, error: "Ruangan tujuan hanya untuk laki-laki" };
    }
    if (
      targetRoom.genderPolicy === "FEMALE_ONLY" &&
      occupancy.occupantGender !== "FEMALE"
    ) {
      return { success: false, error: "Ruangan tujuan hanya untuk perempuan" };
    }
    if (targetRoom.genderPolicy === "FLEXIBLE" && targetRoom.currentGender) {
      if (targetRoom.currentGender !== occupancy.occupantGender) {
        return {
          success: false,
          error: `Ruangan tujuan saat ini untuk ${targetRoom.currentGender === "MALE" ? "laki-laki" : "perempuan"}`,
        };
      }
    }

    const oldBedId = occupancy.bedId;
    const isSameDayTransfer = transferDateObj.getTime() === checkInDateObj.getTime();
    
    // Determine new status based on transfer date
    // If transfer date is today or past, new occupancy is immediate (CHECKED_IN/RESERVED same as old)
    // If future, it's RESERVED.
    const isFutureTransfer = transferDateObj > today;
    const newOccupancyStatus = isFutureTransfer ? "RESERVED" : occupancy.status; 

    // Final check out date: use new one if provided, else use old one if consistent, else default (2099)
    let finalCheckOutDate = newCheckOutDate || occupancy.checkOutDate;
    if (finalCheckOutDate <= transferDateObj) {
       // If old checkout date is before new transfer start, we must extend it
       finalCheckOutDate = new Date("2099-12-31");
    }

    await prisma.$transaction(async (tx) => {
      
      if (isSameDayTransfer) {
        // SCENARIO A: MOVE (Correction/Immediate Move on arrival)
        // Just update the booking to point to new bed
        
        await tx.occupancy.update({
          where: { id: occupancyId },
          data: {
            bedId: targetBedId,
            checkInDate: transferDate, // Just in case slight adjustment
            checkOutDate: finalCheckOutDate,
            transferredFromBedId: oldBedId,
            transferReason: reason,
            transferredAt: new Date(),
            transferredBy: currentUser.id,
            transferredByName: currentUser.name,
          },
        });

        // Old Bed -> Available
        await tx.bed.update({
          where: { id: oldBedId },
          data: { status: "AVAILABLE" },
        });

        // New Bed -> Occupied/Reserved
        await tx.bed.update({
          where: { id: targetBedId },
          data: { status: occupancy.status === "CHECKED_IN" ? "OCCUPIED" : "RESERVED" },
        });

        // Log move (same-day transfer)
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

      } else {
        // SCENARIO B: SPLIT (Mid-stay transfer)
        // 1. Close old occupancy
        await tx.occupancy.update({
          where: { id: occupancyId },
          data: {
            status: isFutureTransfer ? occupancy.status : "CHECKED_OUT", // If future, status remains until date comes? No, simpler to checkout now effectively or split.
            // COMPLEXITY: handling future split is hard. Let's assume IMMEDIATE EFFECT for simplicity as per requirements (move "now" or "from date X effectively replacing old").
            // If transferDate is "tomorrow", old occupancy should end "tomorrow".
            checkOutDate: transferDate, 
            checkoutReason: `Transfer ke ${targetBed.room.name} - ${targetBed.code}`,
            checkoutBy: currentUser.id,
            checkoutByName: currentUser.name,
          }
        });

        // 2. Create new occupancy
        const newOccupancy = await tx.occupancy.create({
          data: {
            // Copy identity
            bookingId: occupancy.bookingId,
            occupantType: occupancy.occupantType,
            occupantUserId: occupancy.occupantUserId,
            occupantName: occupancy.occupantName,
            occupantNik: occupancy.occupantNik,
            occupantGender: occupancy.occupantGender,
            occupantPhone: occupancy.occupantPhone,
            occupantEmail: occupancy.occupantEmail,
            occupantCompany: occupancy.occupantCompany,
            occupantDepartment: occupancy.occupantDepartment,
            occupantPosition: occupancy.occupantPosition,
            
            // New Location
            bedId: targetBedId,
            
            // New Dates
            checkInDate: transferDate,
            checkOutDate: finalCheckOutDate,
            actualCheckIn: isFutureTransfer ? null : new Date(), // If immediate, auto check-in
            
            // Transfer Info
            transferredFromBedId: oldBedId,
            transferReason: reason,
            transferredAt: new Date(),
            transferredBy: currentUser.id,
            transferredByName: currentUser.name,
            
            status: newOccupancyStatus,
            
            createdBy: currentUser.id,
            createdByName: currentUser.name,
            notes: occupancy.notes,
          }
        });

        // 3. Update Bed Statuses
        // Old bed becomes available only if transfer is NOT in future (i.e. today/past)
        if (!isFutureTransfer) {
             await tx.bed.update({
                where: { id: oldBedId },
                data: { status: "AVAILABLE" },
            });
            await tx.bed.update({
                where: { id: targetBedId },
                data: { status: newOccupancyStatus === "CHECKED_IN" ? "OCCUPIED" : "RESERVED" },
            });
        } else {
            // Future transfer: Old bed stays occupied until date. New bed becomes RESERVED.
            // This requires a cron job or "Check Availability" logic to actually handle "RESERVED" slots blocking availability.
            // For now, let's mark new bed as RESERVED.
             await tx.bed.update({
                where: { id: targetBedId },
                data: { status: "RESERVED" },
            });
            // Old bed status doesn't change yet.
        }

        // Log transfer - single log attached to NEW occupancy
        // This log will appear in history of BOTH source and destination rooms
        // because query includes logs where fromBedId OR toBedId matches
        // Note: bedId is null for transfers, use fromBedId/toBedId instead
        await tx.occupancyLog.create({
          data: {
            occupancyId: newOccupancy.id,
            bedId: null, // Transfer uses fromBedId/toBedId
            action: "TRANSFERRED",
            fromBedId: oldBedId,
            toBedId: targetBedId,
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            reason: reason,
          },
        });

        // Also mark old occupancy as checked out (in the source room)
        await tx.occupancyLog.create({
          data: {
            occupancyId: occupancyId,
            bedId: oldBedId, // Checkout happened at old bed
            action: "CHECKED_OUT",
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            notes: `Check-out karena transfer ke ${targetBed.room.name}`,
          },
        });
      }

      // Update room gender if flexible
      if (targetRoom.genderPolicy === "FLEXIBLE" && !targetRoom.currentGender) {
        await tx.room.update({
          where: { id: targetRoom.id },
          data: { currentGender: occupancy.occupantGender },
        });
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

      // Update bed status
      await tx.bed.update({
        where: { id: occupancy.bed.id },
        data: { status: "AVAILABLE" },
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

    // Find available beds in all buildings within the same area that match gender policy
    const availableBeds = await prisma.bed.findMany({
      where: {
        id: { not: currentBedId },
        status: "AVAILABLE",
        room: {
          status: "ACTIVE",
          building: { areaId: areaId },
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
            occupantName: true,
            occupantType: true,
            occupantGender: true,
            bookingId: true,
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
        occupantName: log.occupancy.occupantName,
        occupantType: log.occupancy.occupantType as "EMPLOYEE" | "GUEST",
        occupantGender: log.occupancy.occupantGender as "MALE" | "FEMALE",
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


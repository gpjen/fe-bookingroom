/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type NotificationWithDetail = {
  id: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  notification: {
    id: string;
    title: string;
    message: string;
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
    category: "SYSTEM" | "BOOKING" | "MAINTENANCE";
    link: string | null;
    createdAt: Date;
  };
};

export async function getUserNotifications(userId: string) {
  if (!userId) return { success: false, error: "User ID wajib diisi" };

  try {
    const data: any = await prisma.notificationRecipient.findMany({
      where: { userId },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: data as NotificationWithDetail[] };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Gagal memuat notifikasi" };
  }
}

export async function markNotificationAsRead(recipientId: string) {
  try {
    await prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal update status notifikasi" };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notificationRecipient.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal update semua notifikasi" };
  }
}

// ==========================================
// NEW ACTIONS FOR DROPDOWN
// ==========================================

export async function getUnreadNotificationsCount(userId: string) {
  if (!userId) return { success: false, count: 0 };
  try {
    const count = await prisma.notificationRecipient.count({
      where: { userId, isRead: false },
    });
    return { success: true, count };
  } catch {
    return { success: false, count: 0 };
  }
}

export async function getRecentUnreadNotifications(userId: string, limit = 5) {
  if (!userId) return { success: false, data: [] };
  try {
    const data: any = await prisma.notificationRecipient.findMany({
      where: { userId, isRead: false },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
    return { success: true, data: data as NotificationWithDetail[] };
  } catch {
    return { success: false, data: [] };
  }
}

/**
 * Combined action to reduce network requests
 */
export async function getNotificationState(userId: string, limit = 10) {
  if (!userId) return { success: false, count: 0, data: [] };
  try {
     const [count, data] = await prisma.$transaction([
        prisma.notificationRecipient.count({
            where: { userId, isRead: false },
        }),
        prisma.notificationRecipient.findMany({
            where: { userId, isRead: false },
            include: { notification: true },
            orderBy: { createdAt: "desc" },
            take: limit,
        }) as any
     ]);
     
     return { success: true, count, data: data as unknown as NotificationWithDetail[] };
  } catch {
     return { success: false, count: 0, data: [] };
  }
}

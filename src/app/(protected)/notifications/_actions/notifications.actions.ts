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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

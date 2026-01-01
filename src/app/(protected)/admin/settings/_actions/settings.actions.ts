"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  systemSettingsSchema,
  type SystemSettingsInput,
  type ActionResponse,
} from "./settings.schema";

/**
 * Get system settings from database
 */
export async function getSystemSettings(): Promise<
  ActionResponse<SystemSettingsInput>
> {
  try {
    const settings = await prisma.systemSetting.findFirst({
      where: { id: 1 },
    });

    if (!settings) {
      // Fallback defaults if seeder hasn't run
      return {
        success: false,
        error: "Data konfigurasi belum diinisialisasi (jalankan seed data)",
      };
    }

    // Safe parse existing data to ensure type safety
    const parsed = systemSettingsSchema.safeParse(settings.config);

    if (!parsed.success) {
      console.error("[SETTINGS_PARSE_ERROR]", parsed.error);
      // Return error or partial defaults? Let's return error to force fix.
      return {
        success: false,
        error: "Format data konfigurasi di database tidak valid",
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("[GET_SETTINGS_ERROR]", error);
    return { success: false, error: "Gagal memuat pengaturan sistem" };
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(
  data: SystemSettingsInput
): Promise<ActionResponse<void>> {
  try {
    // 1. Validate input
    const validation = systemSettingsSchema.safeParse(data);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Data tidak valid";
      return { success: false, error: errorMessage };
    }

    // 2. Save to DB
    await prisma.systemSetting.upsert({
      where: { id: 1 },
      update: {
        config: validation.data,
      },
      create: {
        id: 1,
        config: validation.data,
      },
    });

    // 3. Revalidate paths that might rely on these settings
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout"); // Refresh layout in case appName changes

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[UPDATE_SETTINGS_ERROR]", error);
    return { success: false, error: "Terjadi kesalahan saat menyimpan pengaturan" };
  }
}

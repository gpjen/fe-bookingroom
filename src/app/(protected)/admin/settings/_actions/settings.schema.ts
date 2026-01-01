import { z } from "zod";

// ========================================
// SYSTEM SETTINGS SCHEMA
// ========================================

export const systemSettingsSchema = z.object({
  general: z.object({
    appName: z.string().min(1, "Nama aplikasi wajib diisi"),
    supportEmail: z.string().email("Email support tidak valid"),
    // Optional URL fields: allow empty string or valid URL
    supportWhatsapp: z
      .union([z.literal(""), z.string().trim().url("Link Whatsapp tidak valid")])
      .default(""),
    supportHelpdesk: z
      .union([z.literal(""), z.string().trim().url("Link Helpdesk tidak valid")])
      .default(""),
    timezone: z.string().default("Asia/Jakarta"),
    dateFormat: z.string().default("dd/MM/yyyy"),
  }),
  booking: z.object({
    allowWeekendBooking: z.boolean().default(false),
    requiresApproval: z.boolean().default(true),
    maxBookingDuration: z.coerce.number().min(1, "Durasi minimal 1 jam"),
    minAdvanceBooking: z.coerce.number().min(0),
    maxAdvanceBooking: z.coerce.number().min(1),
    operatingHoursStart: z.string().default("08:00"),
    operatingHoursEnd: z.string().default("18:00"),
  }),
  notifications: z.object({
    enableEmail: z.boolean().default(true),
    enablePush: z.boolean().default(true),
    reminderTime: z.string().default("30"),
  }),
  maintenance: z.object({
    enabled: z.boolean().default(false),
    message: z.string().default(""), // Ensure string
  }),
});

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

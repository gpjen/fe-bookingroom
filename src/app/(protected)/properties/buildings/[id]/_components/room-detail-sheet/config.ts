import { CheckCircle2, User, Clock, AlertCircle } from "lucide-react";

// ========================================
// BED STATUS CONFIG
// ========================================

export const bedStatusConfig = {
  AVAILABLE: {
    label: "Tersedia",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  OCCUPIED: {
    label: "Terisi",
    icon: User,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  RESERVED: {
    label: "Dipesan",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
  },
  PENDING_REQUEST: {
    label: "Menunggu Konfirmasi",
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
  },
} as const;

// ========================================
// HISTORY ACTION CONFIG
// ========================================

import { OccupancyLogAction } from "../../_actions/occupancy.types";

export const actionConfig: Record<
  OccupancyLogAction,
  { label: string; icon: string; color: string; bg: string }
> = {
  CREATED: {
    label: "Penempatan",
    icon: "📝",
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  CHECKED_IN: {
    label: "Check-In",
    icon: "✅",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  DATE_CHANGED: {
    label: "Perubahan Tanggal",
    icon: "�",
    color: "text-yellow-600",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  TRANSFERRED: {
    label: "Transfer",
    icon: "🔄",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  EARLY_CHECKOUT: {
    label: "Checkout Awal",
    icon: "⚡",
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  CHECKED_OUT: {
    label: "Check-Out",
    icon: "🚪",
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
  CANCELLED: {
    label: "Dibatalkan",
    icon: "❌",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  STATUS_CHANGED: {
    label: "Status Berubah",
    icon: "🔧",
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
};



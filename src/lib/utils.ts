import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (
  date: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale: string = "id-ID"
) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

export const formatDateTime = (
  date: string | number | Date,
  use12h: boolean = false,
  locale: string = "id-ID"
) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: use12h,
  }).format(new Date(date));

export const timeAgo = (date: string | number | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diff = (now.getTime() - past.getTime()) / 1000; // seconds

  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return "Kemarin";
  return `${Math.floor(diff / 86400)} hari lalu`;
};

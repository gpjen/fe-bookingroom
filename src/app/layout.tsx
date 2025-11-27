import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { cookies } from "next/headers";
import { getMessages } from "@/i18n/server";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-BOOKING",
  description: "Booking management Harita Lygend",
  icons: {
    icon: "/logo_sm.png",
    shortcut: "/logo_sm.png",
    apple: "/logo_lg.png",
  },
};

import { AppShell } from "@/components/layout/app-shell";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const themeFinal =
    store.get("app:theme")?.value === "dark" ? "dark" : "light";
  const themeMode = (store.get("app:themeMode")?.value || "light") as
    | "light"
    | "dark"
    | "system";
  const lang = (store.get("app:lang")?.value || "id") as "id" | "en" | "zh";
  const messages = getMessages(lang);
  return (
    <html lang={lang} className={themeFinal === "dark" ? "dark" : undefined}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black text-neutral-900 dark:text-zinc-50`}
      >
        <Providers
          initialTheme={themeMode}
          initialLang={lang}
          initialMessages={messages}
        >
          <AppShell>{children}</AppShell>
        </Providers>
        <Toaster duration={3000} />
      </body>
    </html>
  );
}

"use client";
import { ThemeProvider } from "@/providers/theme-provider";
import { LangProvider, type Lang } from "@/providers/lang-provider";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function Providers({
  children,
  initialTheme = "light",
  initialLang = "id" as Lang,
  initialMessages,
  session,
}: {
  children: React.ReactNode;
  initialTheme?: "light" | "dark" | "system";
  initialLang?: Lang;
  initialMessages?: Record<string, string>;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchInterval={60}>
      <ThemeProvider initialTheme={initialTheme}>
        <LangProvider
          initialLang={initialLang}
          initialMessages={initialMessages}
        >
          {children}
        </LangProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

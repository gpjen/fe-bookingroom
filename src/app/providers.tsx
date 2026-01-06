"use client";
import { ThemeProvider } from "@/providers/theme-provider";
import { LangProvider, type Lang } from "@/providers/lang-provider";
import { SessionProvider } from "next-auth/react";
import { SessionErrorHandler } from "@/components/auth/session-error-handler";
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
    <SessionProvider
      session={session}
      // Refetch session every 4 minutes (240 seconds)
      // Keycloak token expires every 5 minutes, so 4 minutes gives buffer
      refetchInterval={240}
      // Refetch when user returns to the tab (catches session expiry)
      refetchOnWindowFocus={true}
    >
      {/* Auto sign-out on session errors */}
      <SessionErrorHandler />
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

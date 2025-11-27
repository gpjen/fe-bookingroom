"use client";

import { useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";

/**
 * This component provides a global loading shell for the entire application.
 * It waits for the NextAuth session to be resolved before rendering any
 * page content, preventing UI flashes or errors related to session data.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}

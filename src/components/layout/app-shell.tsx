"use client";

import { useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * This component provides a global loading shell for the entire application.
 * It waits for the NextAuth session to be resolved before rendering any
 * page content, preventing UI flashes or errors related to session data.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession(); // Get data: session as well
  const router = useRouter();

  console.log("AppShell: useSession status =", status);
  console.log("AppShell: session expires =", session?.expires);

  useEffect(() => {
    // Fallback: If session exists but is expired, redirect
    if (session?.expires && new Date(session.expires) < new Date()) {
      console.log("AppShell: Session expired, redirecting to /");
      router.push("/");
      return;
    }

    if (status === "unauthenticated") {
      console.log("AppShell: Status is unauthenticated, redirecting to /");
      router.push("/"); // Redirect to login page if unauthenticated
    }
  }, [status, session?.expires, router]); // Add session.expires to dependency array

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}

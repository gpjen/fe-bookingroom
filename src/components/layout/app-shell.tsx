"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

/**
 * Loading Component dengan animasi elegan
 */
function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background blur circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main loading content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo container with animations */}
        <div className="relative">
          {/* Elegant rotating ring - single clean spinner */}
          <div className="absolute inset-0 -m-6">
            <svg className="h-40 w-40 animate-spin" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="70 200"
                className="text-primary/30"
              />
            </svg>
          </div>

          {/* Logo with fade in animation - no background */}
          <div className="relative h-28 w-28 animate-in fade-in zoom-in duration-700">
            <Image
              src="/logo_lg.png"
              alt="Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Loading text with smooth animation */}
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-100" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-200" />
          </div>

          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Memuat aplikasi...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * This component provides a global loading shell for the entire application.
 * It waits for the NextAuth session to be resolved before rendering any
 * page content, preventing UI flashes or errors related to session data.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
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
      router.push("/");
    }
  }, [status, session?.expires, router]);

  // HANYA tampilkan loading saat status === "loading"
  if (status === "loading") {
    return <LoadingScreen />;
  }

  // Render children tanpa animasi tambahan
  return <>{children}</>;
}

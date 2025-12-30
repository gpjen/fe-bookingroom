"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/providers/permissions-provider";
import { getRequiredPermissions } from "@/config/route-permissions";
import Image from "next/image";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { permissions, isLoading, hasPermission } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 1. Check if user has ANY permissions (basic login check)
    // If permissions array is empty (and loaded), it implies no access or not logged in properly with roles
    if (permissions.length === 0) {
      router.push("/no-access");
      return;
    }

    // 2. Check route-specific permissions
    const required = getRequiredPermissions(pathname);
    if (required && !hasPermission(required)) {
      router.push("/no-access");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.length, isLoading, pathname]); // ✅ Watch only length and pathname

  if (isLoading) {
    // Render a simple loading state or nothing while checking permissions
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
                sizes="120px"
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
              Memuat Halaman...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If we have permissions, or while we are redirecting (to avoid flash)
  if (permissions.length === 0) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/providers/permissions-provider";
import { getRequiredPermissions } from "@/config/route-permissions";

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
  }, [permissions, isLoading, router, pathname, hasPermission]);

  if (isLoading) {
    // Render a simple loading state or nothing while checking permissions
    return (
      <div className="h-screen w-full flex items-center justify-center bg-muted/20">
        Learning permissions...
      </div>
    );
  }

  // If we have permissions, or while we are redirecting (to avoid flash)
  if (permissions.length === 0) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { usePermissions } from "@/providers/permissions-provider";

type PermissionGateProps = {
  children: React.ReactNode;
  permissions: string[];
  fallback?: React.ReactNode;
};

export function PermissionGate({
  children,
  permissions: requiredPermissions,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    // Optionally render nothing or a skeleton while loading
    // For specific UI elements, it might be better to hide until loaded
    return null;
  }

  if (!hasPermission(requiredPermissions)) {
    return fallback;
  }

  return <>{children}</>;
}

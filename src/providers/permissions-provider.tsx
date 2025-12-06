"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type PermissionsContextType = {
  permissions: string[];
  roles: string[];
  companies: string[];
  isLoading: boolean;
  hasPermission: (required?: string[]) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const data = await res.json();
          setPermissions(data.permissions || []);
          setRoles(data.roles || []);
          setCompanies(data.companies || []);
        }
      } catch (error) {
        console.error("Failed to fetch permissions", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [session, status]);

  const hasPermission = (required?: string[]) => {
    if (!required || required.length === 0) return true;
    if (permissions.includes("*")) return true;
    return required.some((perm) => permissions.includes(perm));
  };

  return (
    <PermissionsContext.Provider
      value={{ permissions, roles, companies, isLoading, hasPermission }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}

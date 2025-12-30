"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useSession } from "next-auth/react";

type Building = {
  id: string;
  code: string;
  name: string;
  area: string;
};

type PermissionsContextType = {
  permissions: string[];
  roles: string[];
  companies: string[];
  buildings: Building[];
  isLoading: boolean;
  hasPermission: (required?: string[]) => boolean;
  hasCompanyAccess: (companyCode: string) => boolean;
  hasBuildingAccess: (buildingCode: string) => boolean;
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
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Use ref to track if fetch is in progress (prevents double call in Strict Mode)
  const isFetching = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      // ✅ Skip if already fetching
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const data = await res.json();
          setPermissions(data.permissions || []);
          setRoles(data.roles || []);
          setCompanies(data.companies || []);
          setBuildings(data.buildings || []);
        }
      } catch (error) {
        console.error("Failed to fetch permissions", error);
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    };

    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // ✅ Only watch status

  const hasPermission = (required?: string[]) => {
    if (!required || required.length === 0) return true;
    return required.some((perm) => permissions.includes(perm));
  };

  const hasCompanyAccess = (companyCode: string) => {
    return companies.includes(companyCode.toLowerCase());
  };

  const hasBuildingAccess = (buildingCode: string) => {
    return buildings.some(
      (b) => b.code.toLowerCase() === buildingCode.toLowerCase()
    );
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        roles,
        companies,
        buildings,
        isLoading,
        hasPermission,
        hasCompanyAccess,
        hasBuildingAccess,
      }}
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

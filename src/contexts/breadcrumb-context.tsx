"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

// ========================================
// TYPES
// ========================================

interface BreadcrumbOverride {
  [key: string]: string; // Maps ID/path segment to display label
}

interface BreadcrumbContextType {
  overrides: BreadcrumbOverride;
  setOverride: (key: string, label: string) => void;
  clearOverride: (key: string) => void;
  getLabel: (segment: string) => string | null;
}

// ========================================
// CONTEXT
// ========================================

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

// ========================================
// PROVIDER
// ========================================

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverride>({});

  const setOverride = useCallback((key: string, label: string) => {
    setOverrides((prev) => ({ ...prev, [key]: label }));
  }, []);

  const clearOverride = useCallback((key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const getLabel = useCallback(
    (segment: string) => {
      return overrides[segment] || null;
    },
    [overrides]
  );

  return (
    <BreadcrumbContext.Provider
      value={{ overrides, setOverride, clearOverride, getLabel }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error(
      "useBreadcrumbContext must be used within a BreadcrumbProvider"
    );
  }
  return context;
}

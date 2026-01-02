"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/contexts/breadcrumb-context";

/**
 * Hook to override breadcrumb label for a specific URL segment
 * @param segment - The URL segment to override (e.g., building ID)
 * @param label - The display label to show (e.g., building code)
 */
export function useBreadcrumbOverride(segment: string, label: string) {
  const { setOverride, clearOverride } = useBreadcrumbContext();

  useEffect(() => {
    if (segment && label) {
      setOverride(segment, label);
    }

    return () => {
      if (segment) {
        clearOverride(segment);
      }
    };
  }, [segment, label, setOverride, clearOverride]);
}

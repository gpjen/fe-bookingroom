"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapInputClient = dynamic(() => import("./map-input-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
});

interface MapInputProps {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function MapInput(props: MapInputProps) {
  return <MapInputClient {...props} />;
}

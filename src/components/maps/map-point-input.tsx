"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapPointInputClient = dynamic(() => import("./map-point-input-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapPointInputProps {
  value?: LatLng | null;
  onChange?: (value: LatLng | null) => void;
  readOnly?: boolean;
  defaultCenter?: LatLng;
  defaultZoom?: number;
}

export function MapPointInput(props: MapPointInputProps) {
  return <MapPointInputClient {...props} />;
}

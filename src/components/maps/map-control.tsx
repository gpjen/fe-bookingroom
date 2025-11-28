"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useMap } from "react-leaflet";

interface MapControlProps {
  position: L.ControlPosition;
  children: React.ReactNode;
  className?: string;
}

export function MapControl({ position, children, className }: MapControlProps) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(document.createElement("div"));
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    // Add leaflet-bar class for standard styling, but allow custom classes
    container.className = `leaflet-bar leaflet-control ${className || ""}`;

    // Prevent click propagation to the map
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const Control = L.Control.extend({
      onAdd: () => container,
      onRemove: () => {
        // Cleanup if needed
      },
    });

    const control = new Control({ position });
    control.addTo(map);
    controlRef.current = control;

    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
      }
    };
  }, [map, position, className]);

  return createPortal(children, containerRef.current);
}

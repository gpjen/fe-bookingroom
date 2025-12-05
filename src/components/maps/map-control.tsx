/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const controlRef = useRef<L.Control | null>(null);

  useLayoutEffect(() => {
    const div = document.createElement("div");
    // Add leaflet-bar class for standard styling, but allow custom classes
    div.className = `leaflet-bar leaflet-control ${className || ""}`;

    // Prevent click propagation to the map
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    const Control = L.Control.extend({
      onAdd: () => div,
      onRemove: () => {
        // Cleanup if needed
      },
    });

    const control = new Control({ position });
    control.addTo(map);
    controlRef.current = control;
    setContainer(div);

    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
        controlRef.current = null;
      }
      setContainer(null);
    };
  }, [map, position, className]);

  if (!container) return null;

  return createPortal(children, container);
}

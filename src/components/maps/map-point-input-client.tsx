import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MapControl } from "./map-control";

// Fix for Leaflet default icon not found
// @ts-expect-error Leaflet type issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapPointInputClientProps {
  value?: LatLng | null;
  onChange?: (value: LatLng | null) => void;
  readOnly?: boolean;
  defaultCenter?: LatLng;
  defaultZoom?: number;
}

// Component to handle map click events
function MapClickHandler({
  onLocationSelect,
  readOnly,
}: {
  onLocationSelect: (latlng: LatLng) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (!readOnly) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

// Reusable Map Component
function LeafletPointMap({
  value,
  onChange,
  readOnly,
  defaultCenter = { lat: -2.5, lng: 118 }, // Indonesia center
  defaultZoom = 5,
  onMapReady,
  onToggleFullscreen,
  isFullscreen,
}: MapPointInputClientProps & {
  onMapReady?: (map: L.Map) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const markerRef = useRef<L.Marker>(null);
  const [isMounted] = useState(typeof window !== "undefined");

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Fly to marker when value changes
  useEffect(() => {
    if (map && value) {
      map.flyTo([value.lat, value.lng], 15, { duration: 1 });
    }
  }, [map, value]);

  const handleLocationSelect = useCallback(
    (latlng: LatLng) => {
      if (onChange) {
        onChange(latlng);
      }
    },
    [onChange]
  );

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latlng: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (onChange) {
            onChange(latlng);
          }
          if (map) {
            map.flyTo([latlng.lat, latlng.lng], 17, { duration: 1.5 });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [map, onChange]);

  if (!isMounted)
    return <div className="h-full w-full bg-muted/20 animate-pulse" />;

  return (
    <MapContainer
      center={
        value ? [value.lat, value.lng] : [defaultCenter.lat, defaultCenter.lng]
      }
      zoom={value ? 15 : defaultZoom}
      style={{ height: "100%", width: "100%" }}
      ref={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Click handler */}
      <MapClickHandler
        onLocationSelect={handleLocationSelect}
        readOnly={readOnly}
      />

      {/* Marker for selected location */}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={customIcon}
          ref={markerRef}
          draggable={!readOnly}
          eventHandlers={{
            dragend: () => {
              const marker = markerRef.current;
              if (marker && onChange) {
                const latlng = marker.getLatLng();
                onChange({ lat: latlng.lat, lng: latlng.lng });
              }
            },
          }}
        />
      )}

      {/* Custom Controls */}
      <MapControl position="topleft" className="!border-0 !shadow-none">
        <div className="flex flex-col gap-1">
          {onToggleFullscreen && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-[30px] w-[30px] bg-white hover:bg-gray-100 shadow-sm border border-gray-300 rounded-[4px]"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-black" />
              ) : (
                <Maximize2 className="h-4 w-4 text-black" />
              )}
            </Button>
          )}
          {!readOnly && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-[30px] w-[30px] bg-white hover:bg-gray-100 shadow-sm border border-gray-300 rounded-[4px]"
              onClick={handleGetCurrentLocation}
              title="Gunakan Lokasi Saya"
            >
              <Navigation className="h-4 w-4 text-black" />
            </Button>
          )}
        </div>
      </MapControl>
    </MapContainer>
  );
}

export default function MapPointInputClient(props: MapPointInputClientProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  return (
    <div className="relative h-[300px] w-full rounded-md overflow-hidden border">
      {/* Inline Map */}
      <LeafletPointMap
        {...props}
        onToggleFullscreen={() => setIsFullscreenOpen(true)}
      />

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="w-full h-full sm:max-w-[95vw] sm:max-h-[95vh] p-0 overflow-hidden flex flex-col">
          <DialogTitle className="hidden">Map Point Selection</DialogTitle>
          <div className="flex-1 relative">
            {isFullscreenOpen && (
              <LeafletPointMap
                {...props}
                isFullscreen={true}
                onToggleFullscreen={() => setIsFullscreenOpen(false)}
                onMapReady={(map) => {
                  setTimeout(() => map.invalidateSize(), 100);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

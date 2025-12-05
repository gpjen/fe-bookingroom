import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { Maximize2, Minimize2 } from "lucide-react";
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
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
});

interface MapInputClientProps {
  value?: string; // GeoJSON string
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

// Reusable Map Component to avoid duplication
function LeafletMap({
  value,
  onChange,
  readOnly,
  onMapReady,
  onToggleFullscreen,
  isFullscreen,
}: MapInputClientProps & {
  onMapReady?: (map: L.Map) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [isMounted] = useState(typeof window !== "undefined");

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Load initial value
  useEffect(() => {
    if (isMounted && value && featureGroupRef.current && map) {
      const fg = featureGroupRef.current;
      fg.clearLayers();

      try {
        const geoJson = JSON.parse(value);
        const layer = L.geoJSON(geoJson);
        layer.eachLayer((l) => {
          if (l instanceof L.Path) {
            fg.addLayer(l);
          }
        });

        // Fit bounds to the loaded polygon
        if (fg.getLayers().length > 0) {
          map.fitBounds(fg.getBounds());
        }
      } catch {
        console.error("Invalid GeoJSON");
      }
    }
  }, [value, isMounted, map]);

  const handleCreated = (e: L.DrawEvents.Created) => {
    const layer = e.layer;
    if (onChange) {
      const geoJson = (layer as L.Polygon).toGeoJSON();
      onChange(JSON.stringify(geoJson));
    }
  };

  const handleEdited = () => {
    if (onChange && featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      if (layers.length > 0) {
        // @ts-expect-error Leaflet layer type
        const geoJson = layers[0].toGeoJSON();
        onChange(JSON.stringify(geoJson));
      } else {
        onChange("");
      }
    }
  };

  const handleDeleted = () => {
    if (onChange) {
      onChange("");
    }
  };

  if (!isMounted)
    return <div className="h-full w-full bg-muted/20 animate-pulse" />;

  return (
    <MapContainer
      center={[-6.2088, 106.8456]} // Default Jakarta
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      ref={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup ref={featureGroupRef}>
        {!readOnly && (
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: "#e1e100",
                  message: "<strong>Oh snap!<strong> you can't draw that!",
                },
                shapeOptions: {
                  color: "#97009c",
                },
              },
            }}
          />
        )}
      </FeatureGroup>

      {/* Custom Control for Fullscreen Toggle */}
      {onToggleFullscreen && (
        <MapControl position="topleft" className="!border-0 !shadow-none">
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
        </MapControl>
      )}
    </MapContainer>
  );
}

export default function MapInputClient(props: MapInputClientProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  return (
    <div className="relative h-[300px] w-full rounded-md overflow-hidden border">
      {/* Inline Map */}
      <LeafletMap
        {...props}
        onToggleFullscreen={() => setIsFullscreenOpen(true)}
      />

      {/* Fullscreen Trigger & Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="w-full h-full sm:max-w-[95vw] sm:max-h-[95vh] p-0 overflow-hidden flex flex-col">
          <DialogTitle className="hidden">Mapps</DialogTitle>
          <div className="flex-1 relative">
            {/* Fullscreen Map Instance */}
            {isFullscreenOpen && (
              <LeafletMap
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

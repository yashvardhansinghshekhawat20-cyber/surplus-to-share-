import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { foodIcon, OSM_ATTRIBUTION, OSM_TILES } from "@/components/map/leaflet";
import { cityCenter, getBrowserLocation } from "@/lib/geo";

export interface PickedPoint {
  lat: number;
  lng: number;
}

function ClickToPick({ onPick }: { onPick: (p: PickedPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FollowView({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  // Dialogs animate open — re-measure once the container has its final size.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export function LocationPicker({
  city,
  value,
  onChange,
}: {
  city: string;
  value: PickedPoint | null;
  onChange: (p: PickedPoint | null) => void;
}) {
  const [focus, setFocus] = useState<PickedPoint | null>(null);
  useEffect(() => setFocus(null), [city]);

  const [cLat, cLng] = cityCenter(city);
  const view = focus ?? { lat: cLat, lng: cLng };
  const zoom = focus ? 15 : city ? 12 : 5;

  const useMyLocation = async () => {
    try {
      const p = await getBrowserLocation();
      onChange(p);
      setFocus(p);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get your location");
    }
  };

  return (
    <div className="space-y-2" data-testid="donation-location-picker">
      <p className="text-xs text-[#475569]">
        Tap the map to drop the exact pickup pin — volunteers get turn-by-turn directions to it.
        Optional: without a pin we show the general city area.
      </p>
      <div className="isolate h-52 overflow-hidden rounded-xl border border-[#e2e8f0]">
        <MapContainer center={[view.lat, view.lng]} zoom={zoom} className="h-full w-full" scrollWheelZoom>
          <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
          <FollowView lat={view.lat} lng={view.lng} zoom={zoom} />
          <ClickToPick onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={foodIcon} />}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation} data-testid="btn-pin-my-location">
          <LocateFixed className="h-3.5 w-3.5" /> Use my location
        </Button>
        {value && (
          <>
            <span className="font-mono text-xs text-[#0f172a]" data-testid="donation-pin-coords">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} data-testid="btn-clear-pin">
              <X className="h-3.5 w-3.5" /> Clear pin
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

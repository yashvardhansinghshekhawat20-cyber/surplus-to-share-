import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { LocateFixed, Navigation, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DonationDialog } from "@/components/donations/DonationDialog";
import {
  foodIcon,
  meIcon,
  OSM_ATTRIBUTION,
  OSM_TILES,
  urgentFoodIcon,
  volunteerIcon,
} from "@/components/map/leaflet";
import "leaflet/dist/leaflet.css";
import { useMe } from "@/hooks/useMe";
import { apiGet } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { expiryInfo, fmtQty } from "@/lib/format";
import { cityCenter, directionsUrl, getBrowserLocation, INDIA_CENTER, CITY_COORDS } from "@/lib/geo";
import type { Donation, VolunteerPin } from "@/types";

const ALL = "all";

// Robust coordinate resolver to prevent any Leaflet NaN/null crashes
function getSafeCoords(lat: any, lng: any, fallbackCity: string, index = 0): [number, number] {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (Number.isFinite(nLat) && Number.isFinite(nLng) && nLat !== 0 && nLng !== 0) {
    return [nLat, nLng];
  }
  const base = CITY_COORDS[fallbackCity] || INDIA_CENTER;
  // Apply a deterministic small offset so pins in the same city don't stack directly on top of each other
  const jitterLat = ((index % 5) - 2) * 0.012;
  const jitterLng = (((index * 3) % 5) - 2) * 0.012;
  return [Number((base[0] + jitterLat).toFixed(6)), Number((base[1] + jitterLng).toFixed(6))];
}

export default function MapPage() {
  const { data: me } = useMe();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [city, setCity] = useState(ALL);
  const [showFood, setShowFood] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<Donation | null>(null);

  const foodQuery = useQuery({
    queryKey: ["donations", "map"],
    queryFn: () => apiGet<Donation[]>("/donations?status=available"),
  });

  const volunteersQuery = useQuery({
    queryKey: ["map-volunteers"],
    queryFn: () => apiGet<VolunteerPin[]>("/map/volunteers"),
  });

  const food = useMemo(
    () =>
      (foodQuery.data ?? [])
        .filter((d) => city === ALL || d.city === city)
        .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)),
    [foodQuery.data, city],
  );

  const volunteers = useMemo(
    () => (volunteersQuery.data ?? []).filter((v) => city === ALL || v.city === city),
    [volunteersQuery.data, city],
  );

  const goToCity = (value: string) => {
    setCity(value);
    if (!map) return;
    if (value === ALL) map.flyTo(INDIA_CENTER, 5);
    else map.flyTo(cityCenter(value), 12);
  };

  const nearMe = async () => {
    try {
      const p = await getBrowserLocation();
      setMyPos(p);
      map?.flyTo([p.lat, p.lng], 13);
      toast.success("Found your location!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get your location");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Hyperlocal Rescue Map
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">
            Real-Time Food Rescue &amp; Courier Map
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Amber teardrops indicate fresh surplus ready for pickup; emerald dots represent verified couriers.
          </p>
        </div>

        {/* City Filter & Location Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={city} onValueChange={goToCity}>
            <SelectTrigger className="w-48 bg-white" data-testid="map-city-select">
              <SelectValue>{city === ALL ? "All of India" : city}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All of India</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  📍 {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={nearMe} className="bg-white gap-1.5" data-testid="btn-map-near-me">
            <LocateFixed className="h-4 w-4 text-emerald-600" /> Near me
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              foodQuery.refetch();
              volunteersQuery.refetch();
              toast.info("Refreshed live map pins");
            }}
            title="Refresh map data"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Control Layer Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
            <Checkbox
              checked={showFood}
              onCheckedChange={(v) => setShowFood(!!v)}
              data-testid="map-toggle-food"
            />
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 shadow-xs" />
            Surplus Food Listings{" "}
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {food.length}
            </span>
          </label>

          <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
            <Checkbox
              checked={showVolunteers}
              onCheckedChange={(v) => setShowVolunteers(!!v)}
              data-testid="map-toggle-volunteers"
            />
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-600 shadow-xs" />
            Active Couriers{" "}
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {volunteers.length}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            High Urgency (&lt; 2h)
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            OpenStreetMap Tiles
          </span>
        </div>
      </div>

      {/* Map & Food Sidebar */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Leaflet Canvas */}
        <div
          className="isolate h-[70vh] min-h-[460px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm relative bg-slate-100"
          data-testid="rescue-map"
        >
          <MapContainer
            ref={setMap}
            center={city === ALL ? INDIA_CENTER : cityCenter(city)}
            zoom={city === ALL ? 5 : 12}
            className="h-full w-full"
            style={{ height: "100%", minHeight: "460px", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />

            {/* Food Markers */}
            {showFood &&
              food.map((d, index) => {
                const coords = getSafeCoords(d.lat, d.lng, d.city, index);
                const exp = expiryInfo(d.expiry_date);
                return (
                  <Marker
                    key={d.id}
                    position={coords}
                    icon={exp.urgency === "danger" ? urgentFoodIcon : foodIcon}
                  >
                    <Popup>
                      <div className="min-w-[220px] p-1 space-y-1.5 font-sans" data-testid={`map-food-popup-${d.id}`}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {d.category}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-700">{exp.label}</span>
                        </div>

                        <h4 className="font-heading text-sm font-bold text-slate-900 leading-snug">{d.title}</h4>
                        <p className="text-xs text-slate-500">{d.provider_name} &bull; {d.city}</p>
                        
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-mono font-bold text-emerald-800">{fmtQty(d.quantity, d.unit)}</span>
                          <span className="text-slate-400 text-[11px]">{d.pickup_location}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <a
                            href={directionsUrl(coords[0], coords[1])}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors"
                            data-testid={`map-directions-${d.id}`}
                          >
                            <Navigation className="h-3 w-3" /> Directions
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelected(d)}
                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                            data-testid={`map-details-${d.id}`}
                          >
                            Claim / Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Volunteer Courier Markers */}
            {showVolunteers &&
              volunteers.map((v, index) => {
                const coords = getSafeCoords(v.lat, v.lng, v.city, index + 10);
                return (
                  <Marker key={v.id} position={coords} icon={volunteerIcon}>
                    <Popup>
                      <div className="min-w-[190px] p-1 space-y-1 font-sans" data-testid={`map-volunteer-popup-${v.id}`}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Volunteer Courier
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">Active</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{v.name}</p>
                        <p className="text-xs text-slate-500">
                          {v.transportation || "Two-Wheeler"} &bull; {v.city}
                        </p>
                        <p className="text-xs text-slate-500">{v.availability || "Available for missions"}</p>
                        <p className="text-xs font-semibold text-emerald-700 pt-1 border-t border-slate-100">
                          {v.active_deliveries > 0 ? `${v.active_deliveries} delivery in progress` : "Ready for immediate pickup"}
                        </p>
                        <div className="pt-2 mt-1 border-t border-slate-100">
                          <a
                            href={`tel:${v.phone || "+919800091000"}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <span>📞 Call {v.phone || "+91 98000 91000"}</span>
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Current User Browser Location */}
            {myPos && (
              <Marker position={[myPos.lat, myPos.lng]} icon={meIcon}>
                <Popup>
                  <p className="font-bold text-xs">Your Current Location</p>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Sidebar Listings List */}
        <aside className="flex max-h-[70vh] min-h-[460px] flex-col rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/60 rounded-t-2xl">
            <h3 className="font-heading text-sm font-bold text-slate-900">Available Surplus Pins</h3>
            <p className="text-xs text-slate-500">Sorted by soonest expiry &bull; tap to fly</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3" data-testid="map-food-list">
            {foodQuery.isError ? (
              <p className="p-3 text-xs text-slate-500">Live listings are offline right now.</p>
            ) : foodQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))
            ) : food.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No surplus food available in {city === ALL ? "the network" : city} right now.
              </div>
            ) : (
              food.map((d, index) => {
                const coords = getSafeCoords(d.lat, d.lng, d.city, index);
                const exp = expiryInfo(d.expiry_date);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      if (map) {
                        map.flyTo(coords, 14, { duration: 1.2 });
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/20 group"
                    data-testid={`map-list-item-${d.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{d.category}</span>
                      <span className={`text-[10px] font-bold ${exp.urgency === "danger" ? "text-red-600 font-extrabold" : "text-amber-700"}`}>
                        {exp.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {d.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="font-mono font-semibold text-emerald-800">{fmtQty(d.quantity, d.unit)}</span>
                      <span>📍 {d.city}</span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>

      <DonationDialog donation={selected} me={me ?? null} onClose={() => setSelected(null)} />
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { LocateFixed, Navigation } from "lucide-react";
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
import { useMe } from "@/hooks/useMe";
import { apiGet } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { expiryInfo, fmtQty } from "@/lib/format";
import { cityCenter, directionsUrl, getBrowserLocation, INDIA_CENTER } from "@/lib/geo";
import type { Donation, VolunteerPin } from "@/types";

const ALL = "all";

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
    enabled: !!me,
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get your location");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">
            Live rescue map
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
            Where food is waiting — and who can move it
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            Orange pins are surplus food ready for pickup, green dots are volunteers. Tap any pin
            for details and one-tap directions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={city} onValueChange={goToCity}>
            <SelectTrigger className="w-44" data-testid="map-city-select">
              <SelectValue>{(v) => (v === ALL ? "All of India" : (v as string))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All of India</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={nearMe} data-testid="btn-map-near-me">
            <LocateFixed className="h-4 w-4" /> Near me
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm">
        <label className="flex items-center gap-2 font-medium text-[#0f172a]">
          <Checkbox
            checked={showFood}
            onCheckedChange={(v) => setShowFood(!!v)}
            data-testid="map-toggle-food"
          />
          <span className="inline-block h-3 w-3 rounded-full bg-[#d97706]" />
          Surplus food <span className="font-mono text-[#475569]" data-testid="map-food-count">({food.length})</span>
        </label>
        <label className="flex items-center gap-2 font-medium text-[#0f172a]">
          <Checkbox
            checked={showVolunteers}
            onCheckedChange={(v) => setShowVolunteers(!!v)}
            disabled={!me}
            data-testid="map-toggle-volunteers"
          />
          <span className="inline-block h-3 w-3 rounded-full bg-[#047857]" />
          Volunteers{" "}
          {me ? (
            <span className="font-mono text-[#475569]" data-testid="map-volunteer-count">({volunteers.length})</span>
          ) : (
            <Link to="/login" className="text-xs font-semibold text-[#059669] hover:underline" data-testid="map-login-for-volunteers">
              log in to see
            </Link>
          )}
        </label>
        <span className="flex items-center gap-2 text-xs text-[#475569]">
          <span className="inline-block h-3 w-3 rounded-full bg-[#B91C1C]" /> Expires today
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="isolate h-[68svh] min-h-[420px] overflow-hidden rounded-2xl border border-[#e2e8f0] shadow-sm" data-testid="rescue-map">
          <MapContainer ref={setMap} center={INDIA_CENTER} zoom={5} className="h-full w-full" scrollWheelZoom>
            <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
            {showFood &&
              food.map((d) => {
                const exp = expiryInfo(d.expiry_date);
                return (
                  <Marker
                    key={d.id}
                    position={[d.lat, d.lng]}
                    icon={exp.urgency === "danger" ? urgentFoodIcon : foodIcon}
                  >
                    <Popup>
                      <div className="min-w-[200px] space-y-1 font-sans" data-testid={`map-food-popup-${d.id}`}>
                        <p className="font-heading text-sm font-semibold text-[#0f172a]">{d.title}</p>
                        <p className="text-xs text-[#475569]">{d.provider_name} · {d.city}</p>
                        <p className="font-mono text-xs font-semibold text-[#0f172a]">{fmtQty(d.quantity, d.unit)}</p>
                        <p className="text-xs text-[#475569]">{exp.label}</p>
                        {d.location_approximate && (
                          <p className="text-[11px] italic text-stone-400">Approximate area — see address</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <a
                            href={directionsUrl(d.lat, d.lng)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-[#047857] px-2 py-1 text-xs font-semibold !text-white"
                            data-testid={`map-directions-${d.id}`}
                          >
                            <Navigation className="h-3 w-3" /> Directions
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelected(d)}
                            className="rounded-md border border-[#cbd5e1] px-2 py-1 text-xs font-semibold text-[#047857]"
                            data-testid={`map-details-${d.id}`}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            {me &&
              showVolunteers &&
              volunteers.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={volunteerIcon}>
                  <Popup>
                    <div className="min-w-[180px] space-y-1 font-sans" data-testid={`map-volunteer-popup-${v.id}`}>
                      <p className="text-sm font-semibold text-[#0f172a]">{v.name}</p>
                      <p className="text-xs text-[#475569]">
                        {v.transportation || "Transport not set"} · {v.city}
                      </p>
                      <p className="text-xs text-[#475569]">{v.availability || "Availability not set"}</p>
                      <p className="text-xs font-medium text-[#047857]">
                        {v.active_deliveries > 0 ? `${v.active_deliveries} delivery in progress` : "Free for pickups"}
                      </p>
                      {v.approximate && (
                        <p className="text-[11px] italic text-stone-400">Approximate area</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            {myPos && (
              <Marker position={[myPos.lat, myPos.lng]} icon={meIcon}>
                <Popup>You are here</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <aside className="flex max-h-[68svh] min-h-[420px] flex-col rounded-2xl border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-4 py-3">
            <h2 className="font-heading text-base font-semibold text-[#0f172a]">Food on the map</h2>
            <p className="text-xs text-[#475569]">Soonest expiry first — tap to zoom in</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3" data-testid="map-food-list">
            {foodQuery.isError ? (
              <p className="p-3 text-sm text-[#475569]">Live listings are offline right now.</p>
            ) : foodQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-200" />
              ))
            ) : food.length === 0 ? (
              <p className="p-3 text-sm text-[#475569]">No surplus food listed here right now.</p>
            ) : (
              food.map((d) => {
                const exp = expiryInfo(d.expiry_date);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => map?.flyTo([d.lat, d.lng], 15)}
                    className="w-full rounded-xl border border-[#e2e8f0] p-3 text-left transition-colors hover:border-[#047857]/40 hover:bg-[#f8fafc]"
                    data-testid={`map-list-item-${d.id}`}
                  >
                    <p className="text-sm font-semibold text-[#0f172a]">{d.title}</p>
                    <p className="mt-0.5 text-xs text-[#475569]">
                      {fmtQty(d.quantity, d.unit)} · {d.city} ·{" "}
                      <span className={exp.urgency === "danger" ? "font-semibold text-[#B91C1C]" : ""}>
                        {exp.label}
                      </span>
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

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Heart, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { foodIcon, OSM_ATTRIBUTION, OSM_TILES, volunteerIcon } from "@/components/map/leaflet";
import { apiGet, apiPost } from "@/lib/api";
import { apiErrorMessage, fmtDateTime } from "@/lib/format";
import type { FoodRequest, TrackingInfo } from "@/types";

function Follow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14));
  }, [map, lat, lng]);
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function TrackingDialog({ request, onClose }: { request: FoodRequest | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["tracking", request?.id],
    queryFn: () => apiGet<TrackingInfo>(`/requests/${request?.id}/tracking`),
    enabled: !!request,
    refetchInterval: 10_000,
  });
  const t = query.data;
  const center: [number, number] | null =
    t?.lat != null && t?.lng != null ? [t.lat, t.lng]
      : t?.pickup_lat != null && t?.pickup_lng != null ? [t.pickup_lat, t.pickup_lng] : null;

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl" data-testid="tracking-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-tight">Live delivery tracking</DialogTitle>
          <DialogDescription>
            {request?.donation_title} · volunteer {t?.volunteer_name || request?.volunteer_name}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium" data-testid="tracking-status">
          {t?.sharing ? (
            <span className="inline-flex items-center gap-1.5 text-[#047857]">
              <Radio className="h-4 w-4 animate-pulse" /> On the way — updated {t.updated_at ? fmtDateTime(t.updated_at) : ""}
            </span>
          ) : t?.lat != null ? (
            <span className="text-[#92400E]">Last known position {t.updated_at ? fmtDateTime(t.updated_at) : ""} — live signal paused</span>
          ) : (
            <span className="text-[#475569]">The volunteer hasn't started live sharing yet. This map refreshes every 10 seconds.</span>
          )}
        </p>
        <div className="isolate h-72 overflow-hidden rounded-xl border border-[#e2e8f0]">
          {center ? (
            <MapContainer center={center} zoom={14} className="h-full w-full">
              <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
              <Follow lat={center[0]} lng={center[1]} />
              {t?.pickup_lat != null && t?.pickup_lng != null && (
                <Marker position={[t.pickup_lat, t.pickup_lng]} icon={foodIcon}><Popup>Pickup point</Popup></Marker>
              )}
              {t?.lat != null && t?.lng != null && (
                <Marker position={[t.lat, t.lng]} icon={volunteerIcon}><Popup>{t.volunteer_name}</Popup></Marker>
              )}
            </MapContainer>
          ) : (
            <div className="h-full animate-pulse bg-stone-200" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThankYouBox({ r }: { r: FoodRequest }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (msg: string) => apiPost<FoodRequest>(`/impact/thank-you/${r.id}`, { message: msg }),
    onSuccess: () => {
      toast.success("Thank you published on the Impact page");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["impact"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  if (r.thank_you) {
    return (
      <p className="rounded-xl bg-[#fffbeb] p-3 text-sm italic text-[#92400e]" data-testid={`thank-you-text-${r.id}`}>
        <Heart className="mr-1 inline h-3.5 w-3.5" /> “{r.thank_you}”
      </p>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Say thank you — how did this food help? It appears publicly on the Impact page with the delivery photo."
        maxLength={400}
        data-testid={`thank-you-input-${r.id}`}
      />
      <Button
        size="sm"
        onClick={() => mutation.mutate(message.trim())}
        disabled={message.trim().length < 5 || mutation.isPending}
        data-testid={`btn-thank-you-${r.id}`}
      >
        <Heart className="h-3.5 w-3.5" /> Publish thank-you
      </Button>
    </div>
  );
}

/** NGO request card extras: live tracking while on the way, thank-you once delivered. */
export function RequestExtras({ r }: { r: FoodRequest }) {
  const [tracking, setTracking] = useState<FoodRequest | null>(null);
  return (
    <>
      {(r.status === "assigned" || r.status === "collected") && (
        <Button size="sm" variant="outline" onClick={() => setTracking(r)} data-testid={`btn-track-live-${r.id}`}>
          <Radio className="h-3.5 w-3.5" /> Track live
        </Button>
      )}
      {r.status === "delivered" && <ThankYouBox r={r} />}
      <TrackingDialog request={tracking} onClose={() => setTracking(null)} />
    </>
  );
}

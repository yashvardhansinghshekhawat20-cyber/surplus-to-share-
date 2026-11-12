import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiPatch } from "@/lib/api";
import { apiErrorMessage } from "@/lib/format";
import type { LocationUpdatePayload, TrackingInfo } from "@/types";

const SEND_EVERY_MS = 10_000;

/** Volunteer: streams GPS to the NGO while this delivery is active and this page stays open. */
export function LiveShareToggle({ requestId }: { requestId: string }) {
  const [on, setOn] = useState(false);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!on) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = now;
        const body: LocationUpdatePayload = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        apiPatch<TrackingInfo>(`/volunteer/deliveries/${requestId}/position`, body).catch((e) => {
          toast.error(apiErrorMessage(e));
          setOn(false);
        });
      },
      () => {
        toast.error("Location permission was denied — live sharing stopped");
        setOn(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [on, requestId]);

  const toggle = () => {
    if (on) {
      setOn(false);
      return;
    }
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      toast.error("Live sharing needs a secure (https) address — see the self-hosting guide");
      return;
    }
    lastSent.current = 0;
    setOn(true);
    toast.success("Live sharing on — the NGO can follow you. Keep this page open.");
  };

  return (
    <Button
      size="sm"
      variant={on ? "default" : "outline"}
      onClick={toggle}
      className={on ? "bg-[#d97706] text-white hover:bg-[#b45309]" : ""}
      data-testid={`btn-live-share-${requestId}`}
    >
      <Radio className={`h-3.5 w-3.5 ${on ? "animate-pulse" : ""}`} />
      {on ? "Sharing live — tap to stop" : "Share live location"}
    </Button>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bike, Clock, LocateFixed, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProofPhoto } from "@/components/status/ProofPhoto";
import { RequestStatusBadge } from "@/components/status/StatusBadge";
import { RequestTimeline } from "@/components/status/RequestTimeline";
import { ProofPhotoDialog } from "@/components/volunteers/ProofPhotoDialog";
import { LiveShareToggle } from "@/components/tracking/LiveShareToggle";
import { useMe } from "@/hooks/useMe";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { apiErrorMessage, fmtDateTime, fmtQty } from "@/lib/format";
import { directionsUrl, getBrowserLocation } from "@/lib/geo";
import type { DeliveryStatusPayload, FoodRequest, LocationUpdatePayload, VolunteerPin } from "@/types";

function DirectionsLink({ r, testId }: { r: FoodRequest; testId: string }) {
  if (r.pickup_lat === null || r.pickup_lng === null) return null;
  return (
    <a
      href={directionsUrl(r.pickup_lat, r.pickup_lng)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:underline"
      data-testid={testId}
    >
      <Navigation className="h-3.5 w-3.5" /> Directions to pickup
    </a>
  );
}

export default function VolunteerDashboard() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [proofFor, setProofFor] = useState<FoodRequest | null>(null);

  const pickupsQuery = useQuery({
    queryKey: ["pickups"],
    queryFn: () => apiGet<FoodRequest[]>("/volunteer/pickups"),
  });
  const deliveriesQuery = useQuery({
    queryKey: ["my-deliveries"],
    queryFn: () => apiGet<FoodRequest[]>("/volunteer/deliveries"),
  });

  const pickups = pickupsQuery.data ?? [];
  const deliveries = deliveriesQuery.data ?? [];
  const assigned = deliveries.filter((d) => d.status === "assigned").length;
  const collected = deliveries.filter((d) => d.status === "collected").length;
  const delivered = deliveries.filter((d) => d.status === "delivered").length;

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiPost<FoodRequest>(`/volunteer/pickups/${id}/accept`),
    onSuccess: () => {
      toast.success("Pickup accepted — collect the food from the donor");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const collectMutation = useMutation({
    mutationFn: (id: string) =>
      apiPatch<FoodRequest>(`/volunteer/deliveries/${id}`, { status: "collected" } satisfies DeliveryStatusPayload),
    onSuccess: () => {
      toast.success("Marked as collected — on the way!");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const locationMutation = useMutation({
    mutationFn: (body: LocationUpdatePayload) => apiPatch<VolunteerPin>("/volunteer/location", body),
    onSuccess: () => {
      toast.success("Location shared — you now appear on the rescue map");
      queryClient.invalidateQueries({ queryKey: ["map-volunteers"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const shareLocation = async () => {
    try {
      locationMutation.mutate(await getBrowserLocation());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get your location");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">
            Volunteer mission board
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
            {me?.name || "Your missions"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[#475569]">
            <Clock className="h-3.5 w-3.5 text-[#047857]" />
            {me?.availability || "Availability not set"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[#475569]">
            <Bike className="h-3.5 w-3.5 text-[#047857]" />
            {me?.transportation || "Transport not set"}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={shareLocation}
            disabled={locationMutation.isPending}
            data-testid="btn-share-location"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Share my location
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "Accepted", value: assigned, testId: "stat-vol-assigned" },
          { label: "In transit", value: collected, testId: "stat-vol-collected" },
          { label: "Delivered", value: delivered, testId: "stat-vol-delivered" },
        ].map((s) => (
          <span
            key={s.label}
            className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#475569]"
          >
            <span className="font-mono font-semibold text-[#0f172a]" data-testid={s.testId}>
              {s.value}
            </span>{" "}
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
            Available pickups
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Admin-approved requests waiting for a volunteer like you.
          </p>
          {pickupsQuery.isError ? (
            <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
              Could not load pickups right now.
            </p>
          ) : pickupsQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : pickups.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
              No open pickups at the moment — approved requests appear here instantly.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pickups.map((p) => (
                <Card key={p.id} size="sm" className="border-[#e2e8f0] bg-white">
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-semibold text-[#0f172a]">
                        {p.donation_title}
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#0f172a]">
                        {fmtQty(p.quantity, p.unit)}
                      </span>
                    </div>
                    <p className="text-sm text-[#475569]">
                      Pick up from <span className="font-medium text-[#0f172a]">{p.provider_name}</span>{" "}
                      — {p.pickup_location}, {p.donation_city}
                    </p>
                    <p className="text-sm text-[#475569]">
                      Drop at <span className="font-medium text-[#0f172a]">{p.recipient_organization || p.recipient_name}</span>
                    </p>
                    <DirectionsLink r={p} testId={`pickup-directions-${p.id}`} />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-stone-400">Requested {fmtDateTime(p.created_at)}</p>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(p.id)}
                        disabled={acceptMutation.isPending}
                        data-testid={`btn-accept-pickup-${p.id}`}
                      >
                        Accept pickup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
            My deliveries
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Your active route — mark collected, then finish with a hand-over photo.
          </p>
          {deliveriesQuery.isError ? (
            <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
              Could not load your deliveries right now.
            </p>
          ) : deliveriesQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
              No assignments yet — accept a pickup to start your first delivery.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {deliveries.map((d) => (
                <Card key={d.id} size="sm" className="border-[#e2e8f0] bg-white">
                  <CardContent className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-semibold text-[#0f172a]">
                        {d.donation_title}
                      </span>
                      <RequestStatusBadge status={d.status} testId={`delivery-status-${d.id}`} />
                    </div>
                    <p className="text-sm text-[#475569]">
                      {fmtQty(d.quantity, d.unit)} → {d.recipient_organization || d.recipient_name},{" "}
                      {d.donation_city}
                    </p>
                    <RequestTimeline status={d.status} />
                    {(d.status === "assigned" || d.status === "collected") && <LiveShareToggle requestId={d.id} />}
                    {d.has_proof && <ProofPhoto requestId={d.id} />}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {d.status !== "delivered" ? (
                        <DirectionsLink r={d} testId={`delivery-directions-${d.id}`} />
                      ) : (
                        <span />
                      )}
                      <div className="flex gap-2">
                        {d.status === "assigned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => collectMutation.mutate(d.id)}
                            disabled={collectMutation.isPending}
                            data-testid={`btn-mark-collected-${d.id}`}
                          >
                            Mark collected
                          </Button>
                        )}
                        {(d.status === "assigned" || d.status === "collected") && (
                          <Button
                            size="sm"
                            onClick={() => setProofFor(d)}
                            data-testid={`btn-mark-delivered-${d.id}`}
                          >
                            Mark delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <ProofPhotoDialog delivery={proofFor} onClose={() => setProofFor(null)} />
    </div>
  );
}

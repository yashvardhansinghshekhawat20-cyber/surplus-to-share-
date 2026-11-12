import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProofPhoto } from "@/components/status/ProofPhoto";
import { RequestExtras } from "@/components/requests/RequestExtras";
import { RequestStatusBadge } from "@/components/status/StatusBadge";
import { RequestTimeline } from "@/components/status/RequestTimeline";
import { useMe } from "@/hooks/useMe";
import { apiGet } from "@/lib/api";
import { fmtDateTime, fmtQty } from "@/lib/format";
import type { FoodRequest } from "@/types";

export default function RecipientDashboard() {
  const { data: me } = useMe();
  const requestsQuery = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => apiGet<FoodRequest[]>("/requests/mine"),
  });
  const requests = requestsQuery.data ?? [];
  const active = requests.filter((r) =>
    ["pending", "approved", "assigned", "collected"].includes(r.status),
  ).length;
  const delivered = requests.filter((r) => r.status === "delivered").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">
            Recipient NGO dashboard
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
            {me?.organization || me?.name || "Your requests"}
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Track every request from submission to delivery at your door.
          </p>
        </div>
        <Link to="/explore" className={buttonVariants({})} data-testid="btn-browse-surplus">
          <Search className="h-4 w-4" /> Browse surplus food
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <span className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#475569]">
          <span className="font-mono font-semibold text-[#0f172a]" data-testid="stat-total-requests">
            {requests.length}
          </span>{" "}
          total requests
        </span>
        <span className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#475569]">
          <span className="font-mono font-semibold text-[#0f172a]" data-testid="stat-active-requests">
            {active}
          </span>{" "}
          in progress
        </span>
        <span className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#475569]">
          <span className="font-mono font-semibold text-[#0f172a]" data-testid="stat-delivered-requests">
            {delivered}
          </span>{" "}
          delivered
        </span>
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
          Your food requests
        </h2>
        {requestsQuery.isError ? (
          <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            Could not load your requests right now — they will reappear once the connection is
            back.
          </p>
        ) : requestsQuery.isLoading ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            No requests yet.{" "}
            <Link
              to="/explore"
              className="font-semibold text-[#059669] hover:underline"
              data-testid="recipient-empty-explore-link"
            >
              Explore the live board
            </Link>{" "}
            and request what your organisation needs.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {requests.map((r) => (
              <Card key={r.id} size="sm" className="border-[#e2e8f0] bg-white">
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading font-semibold text-[#0f172a]">
                      {r.donation_title}
                    </span>
                    <RequestStatusBadge status={r.status} testId={`request-status-${r.id}`} />
                  </div>
                  <p className="text-sm text-[#475569]">
                    {fmtQty(r.quantity, r.unit)} requested from {r.provider_name} ·{" "}
                    {r.donation_city}
                  </p>
                  <RequestTimeline status={r.status} />
                  {r.has_proof && <ProofPhoto requestId={r.id} />}
                  <RequestExtras r={r} />
                  {r.volunteer_name && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-xs">
                          {r.volunteer_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Assigned Courier
                          </p>
                          <p className="font-heading text-sm font-bold text-slate-900">{r.volunteer_name}</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${r.volunteer_phone || "+919800091000"}`}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                        title="Call courier directly"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{r.volunteer_phone || "+91 98000 91000"}</span>
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-stone-400">
                    Requested {fmtDateTime(r.created_at)} · Last update {fmtDateTime(r.updated_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

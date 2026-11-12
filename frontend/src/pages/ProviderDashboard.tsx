import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DonationCard } from "@/components/donations/DonationCard";
import { DonationCreateDialog } from "@/components/donations/DonationCreateDialog";
import { ProofPhoto } from "@/components/status/ProofPhoto";
import { RequestStatusBadge } from "@/components/status/StatusBadge";
import { RequestTimeline } from "@/components/status/RequestTimeline";
import { useMe } from "@/hooks/useMe";
import { apiGet } from "@/lib/api";
import { fmtDateTime, fmtQty } from "@/lib/format";
import type { Donation, FoodRequest } from "@/types";

function StatCard({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <Card size="sm" className="border-[#e2e8f0] bg-white">
      <CardContent className="py-5">
        <dd className="font-mono text-2xl font-semibold tracking-tight text-[#0f172a]" data-testid={testId}>
          {value}
        </dd>
        <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#475569]">
          {label}
        </dt>
      </CardContent>
    </Card>
  );
}

export default function ProviderDashboard() {
  const { data: me } = useMe();
  const [createOpen, setCreateOpen] = useState(false);

  const donationsQuery = useQuery({
    queryKey: ["my-donations"],
    queryFn: () => apiGet<Donation[]>("/donations/mine"),
  });
  const requestsQuery = useQuery({
    queryKey: ["requests-on-mine"],
    queryFn: () => apiGet<FoodRequest[]>("/requests/on-my-donations"),
  });

  const donations = donationsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const active = donations.filter((d) => d.status !== "completed").length;
  const available = donations.filter((d) => d.status === "available").length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const delivered = requests.filter((r) => r.status === "delivered").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#d97706]">
            Food donor dashboard
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
            {me?.organization || me?.name || "Your surplus"}
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Publish surplus food and track requests coming in from NGOs.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="btn-new-donation">
          <Plus className="h-4 w-4" /> New donation
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active listings" value={active} testId="stat-active-listings" />
        <StatCard label="Available now" value={available} testId="stat-available-now" />
        <StatCard label="Pending requests" value={pending} testId="stat-pending-requests" />
        <StatCard label="Completed hand-offs" value={delivered} testId="stat-completed-handoffs" />
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
          Your donations
        </h2>
        {donationsQuery.isError ? (
          <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            Could not load your listings — they will appear here once the connection is back.
          </p>
        ) : donationsQuery.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-stone-200" />
            ))}
          </div>
        ) : donations.length === 0 ? (
          <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            No donations yet — publish your first surplus listing and NGOs nearby will see it.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donations.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
          Requests on your donations
        </h2>
        <p className="mt-1 text-sm text-[#475569]">
          The platform admin reviews and approves requests — you see every outcome here.
        </p>
        {requestsQuery.isError ? (
          <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            Could not load requests right now.
          </p>
        ) : requestsQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
            No requests yet — they arrive as soon as NGOs spot your listings.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {requests.map((r) => (
              <Card key={r.id} size="sm" className="border-[#e2e8f0] bg-white">
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0f172a]">
                      {r.recipient_organization || r.recipient_name}
                    </span>
                    <RequestStatusBadge status={r.status} testId={`request-status-${r.id}`} />
                  </div>
                  <p className="text-sm text-[#475569]">
                    wants{" "}
                    <span className="font-mono font-semibold text-[#0f172a]">
                      {fmtQty(r.quantity, r.unit)}
                    </span>{" "}
                    from “{r.donation_title}”
                  </p>
                  {r.message && (
                    <p className="text-sm italic text-[#475569]">“{r.message}”</p>
                  )}
                  <RequestTimeline status={r.status} />
                  {r.has_proof && <ProofPhoto requestId={r.id} />}
                  <p className="text-xs text-stone-400">{fmtDateTime(r.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <DonationCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

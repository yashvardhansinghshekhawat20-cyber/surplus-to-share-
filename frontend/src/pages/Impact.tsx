import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { ImpactSummary, UnitQuantity } from "@/types";

const fmtUnits = (q: UnitQuantity[]) =>
  q.length ? q.map((u) => `${Math.round(u.quantity)} ${u.unit}`).join(" · ") : "—";

export default function Impact() {
  const query = useQuery({ queryKey: ["impact"], queryFn: () => apiGet<ImpactSummary>("/impact") });
  const data = query.data;

  return (
    <div>
      <section className="bg-[#022c22] py-16 text-[#F4F7F2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#34d399]">Our impact</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Every delivery is a meal that didn't go to waste.
          </h1>
          <dl className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Deliveries completed", value: data?.total_deliveries ?? 0, id: "deliveries" },
              { label: "NGOs served", value: data?.ngos_served ?? 0, id: "ngos" },
              { label: "Cities reached", value: data?.cities_reached ?? 0, id: "cities" },
            ].map((s) => (
              <div key={s.id}>
                <dd className="font-mono text-4xl font-semibold text-[#34d399]" data-testid={`impact-total-${s.id}`}>{s.value}</dd>
                <dt className="mt-1 text-xs uppercase tracking-[0.14em] text-[#94a3b8]">{s.label}</dt>
              </div>
            ))}
            <div>
              <dd className="font-mono text-lg font-semibold text-[#34d399]" data-testid="impact-total-quantity">
                {fmtUnits(data?.total_quantity ?? [])}
              </dd>
              <dt className="mt-1 text-xs uppercase tracking-[0.14em] text-[#94a3b8]">Food rescued</dt>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">City by city</h2>
        {query.isError ? (
          <p className="mt-6 rounded-xl bg-[#f1f5f9] p-6 text-sm text-[#475569]">Impact numbers are offline right now.</p>
        ) : !data ? (
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-stone-200" />
        ) : data.cities.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[#f1f5f9] p-6 text-sm text-[#475569]">No deliveries yet — the first rescue will appear here.</p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.cities.map((c) => (
                <div key={c.city} className="rounded-2xl border border-[#e2e8f0] bg-white p-5" data-testid={`impact-city-${c.city.toLowerCase().replace(/\s+/g, "-")}`}>
                  <p className="flex items-center gap-1.5 font-heading text-lg font-semibold text-[#0f172a]">
                    <MapPin className="h-4 w-4 text-[#d97706]" /> {c.city}
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold text-[#047857]">{fmtUnits(c.quantities)}</p>
                  <p className="mt-1 text-xs text-[#475569]">
                    {c.deliveries} deliveries · {c.ngos_served} NGOs · {c.volunteers_active} volunteers · {c.listings} listings
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
              <p className="font-heading text-sm font-semibold text-[#0f172a]">Deliveries per city</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.cities}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="deliveries" name="Deliveries" fill="#047857" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="bg-[#f1f5f9] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">Rescue stories</h2>
          <p className="mt-2 text-sm text-[#475569]">Thank-you notes from the NGOs we serve, and every recent hand-over.</p>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {(data?.stories ?? []).map((s) => (
              <article key={s.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white" data-testid={`impact-story-${s.id}`}>
                {s.has_photo && (
                  <img src={`/api/impact/stories/${s.id}/photo`} alt={`Delivery to ${s.recipient_name}`} loading="lazy" className="max-h-64 w-full object-cover" />
                )}
                <div className="space-y-2 p-5">
                  {s.kind === "thank_you" ? (
                    <>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d97706]">
                        <Heart className="h-3.5 w-3.5" /> Thank you from {s.recipient_name}
                      </p>
                      <p className="font-heading text-lg leading-snug text-[#0f172a]">“{s.message}”</p>
                      <p className="text-xs text-[#475569]">{s.headline}</p>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#047857]">
                        <Truck className="h-3.5 w-3.5" /> Delivered
                      </p>
                      <p className="font-heading text-base font-semibold leading-snug text-[#0f172a]">{s.headline}</p>
                    </>
                  )}
                  <p className="text-xs text-stone-500">
                    From {s.provider_name}{s.volunteer_name ? ` · carried by ${s.volunteer_name}` : ""} · {s.city} · {fmtDate(s.delivered_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <Link to="/register" className={`${buttonVariants({ size: "lg" })} mt-6`} data-testid="impact-join-cta">
            Join the next rescue
          </Link>
        </div>
      </section>
    </div>
  );
}

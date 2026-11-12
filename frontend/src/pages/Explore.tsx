import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DonationCard } from "@/components/donations/DonationCard";
import { DonationDialog } from "@/components/donations/DonationDialog";
import { useMe } from "@/hooks/useMe";
import { apiGet } from "@/lib/api";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Donation } from "@/types";

export default function Explore() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<Donation | null>(null);
  const deferredQ = useDeferredValue(q);
  const { data: me } = useMe();

  const query = useQuery({
    queryKey: ["donations", { q: deferredQ, category, city, status: "available" }],
    queryFn: () => {
      const params = new URLSearchParams({ status: "available" });
      if (deferredQ.trim()) params.set("q", deferredQ.trim());
      if (category) params.set("category", category);
      if (city) params.set("city", city);
      return apiGet<Donation[]>(`/donations?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });
  const donations = query.data ?? [];

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setCity("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
          Explore surplus food
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#475569]">
          Live listings from donors across the network. Filter by food, category and city —
          NGO accounts can request any quantity they need.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search food name — biryani, bread, vegetables…"
              className="pl-9"
              data-testid="explore-search-input"
            />
          </div>
          <Select value={city} onValueChange={(v) => setCity(v === "all-cities" ? "" : v)}>
            <SelectTrigger data-testid="explore-city-filter">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-cities">All cities</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              category === ""
                ? "border-[#047857] bg-[#047857] text-white"
                : "border-[#e2e8f0] bg-[#f1f5f9] text-[#047857] hover:border-[#047857]/40",
            )}
            data-testid="filter-category-all"
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? "" : c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                category === c
                  ? "border-[#047857] bg-[#047857] text-white"
                  : "border-[#e2e8f0] bg-[#f1f5f9] text-[#047857] hover:border-[#047857]/40",
              )}
              data-testid={`filter-category-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {query.isError ? (
        <p className="mt-8 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
          The live board is offline right now — please check back shortly.
        </p>
      ) : query.isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-6 text-sm text-[#475569]">
          No surplus food matches your filters.{" "}
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold text-[#059669] hover:underline"
            data-testid="explore-clear-filters"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donations.map((d) => (
            <DonationCard
              key={d.id}
              donation={d}
              footer={
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(d)}
                    data-testid={`btn-view-donation-${d.id}`}
                  >
                    Details
                  </Button>
                  {me?.role === "recipient" && d.status === "available" && (
                    <Button
                      size="sm"
                      className="bg-[#d97706] text-white hover:bg-[#b45309]"
                      onClick={() => setSelected(d)}
                      data-testid={`btn-request-donation-${d.id}`}
                    >
                      Request food
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <DonationDialog donation={selected} me={me ?? null} onClose={() => setSelected(null)} />
    </div>
  );
}

import { useState } from "react";
import type { ReactNode } from "react";
import { 
  Candy, 
  Croissant, 
  Leaf, 
  MapPin, 
  Milk, 
  Package, 
  UtensilsCrossed, 
  Clock, 
  Thermometer, 
  ShieldCheck,
  Building
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonationStatusBadge } from "@/components/status/StatusBadge";
import { DonationDialog } from "@/components/donations/DonationDialog";
import { expiryInfo, fmtQty } from "@/lib/format";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils";
import type { Donation } from "@/types";

const CATEGORY_ICONS: Record<string, typeof Leaf> = {
  "Cooked Meals": UtensilsCrossed,
  "Fresh Produce": Leaf,
  "Packaged & Grocery": Package,
  Bakery: Croissant,
  Dairy: Milk,
  "Sweets & Snacks": Candy,
};

const CATEGORY_TEMPERATURE: Record<string, string> = {
  "Cooked Meals": "Hot Insulated Container (65°C+)",
  "Fresh Produce": "Cold Storage (10°C)",
  "Packaged & Grocery": "Ambient Dry Storage",
  Bakery: "Fresh Dry Sealed",
  Dairy: "Refrigerated Cold Chain (4°C)",
  "Sweets & Snacks": "Sealed Room Temperature",
};

const URGENCY_STYLES: Record<string, string> = {
  danger: "border-red-200 bg-red-50 text-red-700 animate-pulse font-bold",
  warn: "border-amber-200 bg-amber-50 text-amber-800 font-semibold",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium",
  muted: "border-slate-200 bg-slate-100 text-slate-500",
};

export function DonationCard({
  donation,
  footer,
}: {
  donation: Donation;
  footer?: ReactNode;
}) {
  const { data: me } = useMe();
  const [detailOpen, setDetailOpen] = useState(false);
  const Icon = CATEGORY_ICONS[donation.category] ?? Package;
  const exp = expiryInfo(donation.expiry_date);
  const tempSpec = CATEGORY_TEMPERATURE[donation.category] ?? "Standard Safe Food Storage";

  return (
    <>
      <Card
        size="sm"
        className="flex h-full flex-col border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg rounded-2xl overflow-hidden group"
        data-testid={`donation-card-${donation.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              <Icon className="h-3.5 w-3.5 text-emerald-600" />
              {donation.category}
            </span>
            <DonationStatusBadge status={donation.status} />
          </div>

          <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
            {donation.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{donation.provider_name}</span>
            {donation.provider_organization && (
              <span className="text-slate-400 truncate">({donation.provider_organization})</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 text-xs pt-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">{donation.pickup_location || donation.city}</span>
          </div>

          {/* Temperature & Hygiene Spec */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{tempSpec}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> FSSAI
            </span>
          </div>

          {/* Quantity & Expiry */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Quantity</span>
              <span className="font-mono text-base font-extrabold text-slate-900">
                {fmtQty(donation.quantity, donation.unit)}
              </span>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                URGENCY_STYLES[exp.urgency],
              )}
              data-testid={`donation-expiry-${donation.id}`}
            >
              <Clock className="w-3 h-3" />
              <span>{exp.label}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
          {footer ? (
            footer
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailOpen(true)}
                className="w-full text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
              >
                View Details &amp; Location
              </Button>
              {donation.status === "available" && (
                <Button
                  size="sm"
                  onClick={() => setDetailOpen(true)}
                  className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {me?.role === "recipient" ? "Claim Portions" : "Request Food"}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {/* Donation Detail & Claim Dialog */}
      <DonationDialog
        donation={detailOpen ? donation : null}
        me={me ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}

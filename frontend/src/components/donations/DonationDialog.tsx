import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Navigation, Phone, Store, Users, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DonationStatusBadge } from "@/components/status/StatusBadge";
import { apiPost } from "@/lib/api";
import { apiErrorMessage, expiryInfo, fmtDateTime, fmtQty } from "@/lib/format";
import { directionsUrl } from "@/lib/geo";
import type { Donation, FoodRequest, User } from "@/types";

export function DonationDialog({
  donation,
  me,
  onClose,
}: {
  donation: Donation | null;
  me: User | null;
  onClose: () => void;
  onRequestSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (donation) {
      setQuantity(Math.min(donation.quantity, 25).toString());
      setMessage(`For our evening meal program at ${me?.organization || "our shelter"}. Thank you!`);
    }
  }, [donation, me]);

  const requestMutation = useMutation({
    mutationFn: (body: { donation_id: string; quantity: number; message: string }) =>
      apiPost<FoodRequest>("/requests", body),
    onSuccess: () => {
      toast.success("Claim request submitted! Awaiting fast admin approval.");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      onClose();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const isRecipient = me?.role === "recipient" || me?.role === "admin";
  const exp = donation ? expiryInfo(donation.expiry_date) : null;

  const submitRequest = () => {
    if (!donation) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > donation.quantity) {
      toast.error(`Only ${fmtQty(donation.quantity, donation.unit)} available`);
      return;
    }
    requestMutation.mutate({ donation_id: donation.id, quantity: qty, message });
  };

  return (
    <Dialog
      open={!!donation}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[92svh] max-w-lg overflow-y-auto" data-testid="donation-detail-dialog">
        {donation && exp && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DonationStatusBadge status={donation.status} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {donation.category}
                </span>
              </div>
              <DialogTitle className="font-heading text-2xl tracking-tight text-slate-900 mt-1">
                {donation.title}
              </DialogTitle>
              <DialogDescription className="leading-relaxed text-slate-600 text-sm">
                {donation.description || "Untouched surplus food listing ready for rescue."}
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-700 shrink-0" />
                <dt className="sr-only">Provider</dt>
                <dd className="font-bold text-slate-900">{donation.provider_name}</dd>
                {donation.provider_organization && (
                  <span className="text-xs text-slate-500">({donation.provider_organization})</span>
                )}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-xs sm:text-sm">
                  <dt className="sr-only">Pickup</dt>
                  <dd className="text-slate-700 font-medium">{donation.pickup_location}</dd>
                  <dd className="text-slate-500">{donation.city}</dd>
                  <dd className="mt-1">
                    <a
                      href={directionsUrl(donation.lat, donation.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Get turn-by-turn directions
                    </a>
                  </dd>
                </div>
              </div>

              {donation.pickup_contact && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
                  <dt className="sr-only">Contact</dt>
                  <dd className="font-mono text-slate-900 text-xs font-semibold">{donation.pickup_contact}</dd>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5">
                <span className="font-mono font-bold tracking-tight text-emerald-800 text-base">
                  {fmtQty(donation.quantity, donation.unit)} available
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {exp.label} &bull; {donation.expiry_date}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Listed {fmtDateTime(donation.created_at)}</div>
            </dl>

            {!me && (
              <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-4 text-sm text-center">
                <p className="font-bold text-slate-900">
                  Want this food for your orphanage or shelter?
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Switch to the <strong>Recipient NGO</strong> persona in the top HUD or sign in to claim.
                </p>
                <Link
                  to="/login"
                  className={`${buttonVariants({ size: "sm" })} mt-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold`}
                >
                  Log in as Recipient NGO
                </Link>
              </div>
            )}

            {me && !isRecipient && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                You are currently signed in as <strong>{me.role}</strong>. Switch to the <strong>Recipient NGO</strong> persona in the top bar to claim portions of this surplus.
              </div>
            )}

            {isRecipient && donation.status === "available" && (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="request-quantity" className="font-bold text-slate-900">
                    Portions Needed ({donation.unit})
                  </Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.ceil(donation.quantity * 0.25).toString())}
                      className="px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.ceil(donation.quantity * 0.5).toString())}
                      className="px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(donation.quantity.toString())}
                      className="px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700"
                    >
                      All
                    </button>
                  </div>
                </div>

                <Input
                  id="request-quantity"
                  type="number"
                  min="1"
                  max={donation.quantity}
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white font-mono text-base font-bold"
                />

                {Number(quantity) > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100/70 p-2 rounded-lg font-medium">
                    <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Feeds approximately <strong>{Math.round(Number(quantity) * (donation.unit === "meals" ? 1 : 2.5))} beneficiaries</strong> tonight.</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="request-message" className="text-xs font-semibold text-slate-700">
                    Beneficiary &amp; Delivery Note (optional)
                  </Label>
                  <Textarea
                    id="request-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="E.g., For children's home dinner drive, can pick up immediately."
                    className="bg-white text-xs"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={submitRequest}
                  disabled={requestMutation.isPending}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {requestMutation.isPending ? "Submitting Claim Request…" : `Claim ${quantity || 0} ${donation.unit}`}
                </Button>
              </div>
            )}

            {isRecipient && donation.status !== "available" && (
              <p className="text-xs font-semibold text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                This listing is already fully claimed or completed.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { CATEGORIES, CITIES, UNITS } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/format";
import type { Donation, DonationCreatePayload } from "@/types";
import { LocationPicker, type PickedPoint } from "@/components/map/LocationPicker";

const EMPTY = {
  title: "",
  category: "",
  quantity: "",
  unit: "",
  city: "",
  pickup_location: "",
  pickup_contact: "",
  expiry_date: "",
  description: "",
};

export function DonationCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [pin, setPin] = useState<PickedPoint | null>(null);
  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: (body: DonationCreatePayload) => apiPost<Donation>("/donations", body),
    onSuccess: () => {
      toast.success("Donation published to the rescue board");
      queryClient.invalidateQueries({ queryKey: ["my-donations"] });
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      setForm(EMPTY);
      setPin(null);
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const submit = () => {
    const qty = Number(form.quantity);
    if (
      !form.title ||
      !form.category ||
      !form.unit ||
      !form.city ||
      !form.pickup_location ||
      !form.expiry_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    createMutation.mutate({ ...form, quantity: qty, lat: pin?.lat ?? null, lng: pin?.lng ?? null });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90svh] max-w-lg overflow-y-auto"
        data-testid="donation-create-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight">
            Publish surplus food
          </DialogTitle>
          <DialogDescription>
            Takes under a minute — nearby NGOs can request it straight away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="donation-title">Food name *</Label>
            <Input
              id="donation-title"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="e.g. Wedding banquet surplus — veg meals"
              data-testid="donation-title-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger data-testid="donation-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select
                value={form.city}
                onValueChange={(v) => {
                  set("city")(v);
                  setPin(null);
                }}
              >
                <SelectTrigger data-testid="donation-city-select">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="donation-quantity">Quantity *</Label>
              <Input
                id="donation-quantity"
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => set("quantity")(e.target.value)}
                placeholder="0"
                data-testid="donation-quantity-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit *</Label>
              <Select value={form.unit} onValueChange={set("unit")}>
                <SelectTrigger data-testid="donation-unit-select">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donation-expiry">Expires *</Label>
              <Input
                id="donation-expiry"
                type="date"
                min={today}
                value={form.expiry_date}
                onChange={(e) => set("expiry_date")(e.target.value)}
                data-testid="donation-expiry-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="donation-pickup">Pickup location *</Label>
            <Textarea
              id="donation-pickup"
              value={form.pickup_location}
              onChange={(e) => set("pickup_location")(e.target.value)}
              placeholder="Street address with a landmark"
              data-testid="donation-pickup-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Pickup pin on map</Label>
            <LocationPicker city={form.city} value={pin} onChange={setPin} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="donation-contact">Contact number</Label>
              <Input
                id="donation-contact"
                value={form.pickup_contact}
                onChange={(e) => set("pickup_contact")(e.target.value)}
                placeholder="+91 …"
                data-testid="donation-contact-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donation-description">Description</Label>
              <Input
                id="donation-description"
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="Storage, veg/non-veg…"
                data-testid="donation-description-input"
              />
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={createMutation.isPending}
            className="w-full"
            data-testid="btn-create-donation"
          >
            {createMutation.isPending ? "Publishing…" : "Publish donation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

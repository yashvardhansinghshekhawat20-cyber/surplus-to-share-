import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/api";
import {
  AVAILABILITY_OPTIONS,
  CITIES,
  HOME_BY_ROLE,
  TRANSPORT_OPTIONS,
} from "@/lib/constants";
import { apiErrorMessage } from "@/lib/format";
import { beginSession } from "@/lib/session";
import type { RegisterPayload, User } from "@/types";

const ROLE_OPTIONS = [
  {
    role: "provider" as const,
    icon: Store,
    title: "Food Donor",
    desc: "Restaurant, hotel, canteen or event with surplus to give",
  },
  {
    role: "recipient" as const,
    icon: Users,
    title: "Recipient NGO",
    desc: "Shelter or community kitchen requesting food for people in need",
  },
  {
    role: "volunteer" as const,
    icon: Truck,
    title: "Volunteer",
    desc: "Pick up from donors and deliver to NGOs in your city",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<RegisterPayload["role"]>("recipient");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    organization: "",
    availability: "",
    transportation: "",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const registerMutation = useMutation({
    mutationFn: (body: RegisterPayload) => apiPost<User>("/auth/register", body),
    onSuccess: async (user) => {
      await beginSession();
      toast.success("Account created — welcome to FoodLink!");
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate({ ...form, role });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
          Join the rescue network
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#475569]">
          Pick how you want to take part. Donors publish surplus, NGOs request what they need,
          volunteers move the food — every handoff is tracked end to end.
        </p>

        <div className="mt-8 space-y-3">
          {ROLE_OPTIONS.map(({ role: r, icon: Icon, title, desc }) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                role === r
                  ? "border-[#047857] bg-[#f1f5f9] shadow-sm"
                  : "border-[#e2e8f0] bg-white hover:border-[#047857]/40"
              }`}
              data-testid={`register-role-${r}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  role === r ? "bg-[#047857] text-white" : "bg-[#f1f5f9] text-[#047857]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-[#0f172a]">{title}</span>
                <span className="mt-0.5 block text-sm text-[#475569]">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        data-testid="register-form"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Full name *</Label>
            <Input
              id="register-name"
              required
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Your name or contact person"
              data-testid="register-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="register-organization">
              {role === "volunteer" ? "Organisation (optional)" : "Organisation name"}
            </Label>
            <Input
              id="register-organization"
              value={form.organization}
              onChange={(e) => set("organization")(e.target.value)}
              placeholder={role === "volunteer" ? "—" : "e.g. Asha Care Home"}
              data-testid="register-organization-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email *</Label>
          <Input
            id="register-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="you@example.org"
            data-testid="register-email-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="register-password">Password *</Label>
            <Input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="At least 6 characters"
              data-testid="register-password-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="register-phone">Phone</Label>
            <Input
              id="register-phone"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="+91 …"
              data-testid="register-phone-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>City *</Label>
          <Select value={form.city} onValueChange={set("city")}>
            <SelectTrigger data-testid="register-city-select">
              <SelectValue placeholder="Select your city" />
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

        {role === "volunteer" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select value={form.availability} onValueChange={set("availability")}>
                <SelectTrigger data-testid="register-availability-select">
                  <SelectValue placeholder="When can you help?" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Transportation</Label>
              <Select value={form.transportation} onValueChange={set("transportation")}>
                <SelectTrigger data-testid="register-transport-select">
                  <SelectValue placeholder="How do you travel?" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full"
          data-testid="btn-register"
        >
          {registerMutation.isPending ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-[#475569]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#059669] hover:underline"
            data-testid="register-to-login-link"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

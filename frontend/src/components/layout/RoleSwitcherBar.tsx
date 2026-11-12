import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/useMe";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Utensils, Building2, Bike, Globe } from "lucide-react";

const PERSONAS = [
  {
    role: "guest",
    label: "Public Visitor",
    sublabel: "Browse & Learn",
    icon: Globe,
    email: "",
    password: "",
    path: "/",
  },
  {
    role: "provider",
    label: "Food Donor",
    sublabel: "Chef Vikram",
    icon: Utensils,
    email: "donor@foodlink.in",
    password: "donor123",
    path: "/provider",
  },
  {
    role: "recipient",
    label: "Recipient NGO",
    sublabel: "Sister Clara",
    icon: Building2,
    email: "ngo@foodlink.in",
    password: "ngo123",
    path: "/recipient",
  },
  {
    role: "volunteer",
    label: "Rescue Courier",
    sublabel: "Rahul (EV)",
    icon: Bike,
    email: "volunteer@foodlink.in",
    password: "volunteer123",
    path: "/volunteer",
  },
  {
    role: "admin",
    label: "Platform Admin",
    sublabel: "Operations",
    icon: Shield,
    email: "admin@foodlink.in",
    password: "admin123",
    path: "/admin",
  },
] as const;

export function RoleSwitcherBar() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitchPersona = async (p: typeof PERSONAS[number]) => {
    try {
      if (p.role === "guest") {
        await apiPost("/auth/logout").catch(() => {});
        await queryClient.invalidateQueries();
        queryClient.clear();
        toast.info("Switched to Public Visitor persona");
        navigate("/");
        return;
      }

      // If already logged in as this role
      if (me?.role === p.role) {
        navigate(p.path);
        return;
      }

      // Log in as persona
      await apiPost("/auth/login", { email: p.email, password: p.password });
      await queryClient.invalidateQueries();
      toast.success(`Switched to ${p.label} (${p.sublabel})`);
      navigate(p.path);
    } catch (e: any) {
      toast.error(e?.body?.detail || "Failed to switch persona");
    }
  };

  const currentRole = me ? me.role : "guest";

  return (
    <aside
      aria-label="Demo Persona Switcher"
      className="bg-slate-950 text-white text-xs py-2 px-3 sm:px-4 border-b border-slate-800 sticky top-0 z-50 shadow-md backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
            Interactive Role HUD:
          </span>
          <span className="text-slate-400 hidden lg:inline text-[11px]">
            Switch personas instantly with 1-click to test each role's dashboard
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isActive = currentRole === p.role;
            return (
              <button
                key={p.role}
                onClick={() => handleSwitchPersona(p)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/50 ring-1 ring-emerald-400 font-bold"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                }`}
                title={`Switch to ${p.label} - ${p.sublabel}`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-emerald-400"}`} />
                <span>{p.label}</span>
                <span className={`text-[10px] hidden sm:inline ${isActive ? "text-emerald-100" : "text-slate-500"}`}>
                  ({p.sublabel})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

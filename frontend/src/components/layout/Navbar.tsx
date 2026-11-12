import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { 
  Utensils, 
  LogOut, 
  PhoneCall, 
  PlusCircle, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMe } from "@/hooks/useMe";
import { HOME_BY_ROLE, ROLE_LABEL, CITIES } from "@/lib/constants";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DonationCreateDialog } from "@/components/donations/DonationCreateDialog";

export default function Navbar() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Bengaluru");

  const onLogout = async () => {
    await endSession();
    toast.info("Logged out successfully");
    navigate("/");
  };

  const copyHotline = () => {
    navigator.clipboard.writeText("+919800091000");
    setCopied(true);
    toast.success("Hotline number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-[37px] z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          
          {/* Logo & City Selector */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 text-left group" data-testid="nav-brand-link">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                    FoodLink
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Surplus
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Turn Surplus Feasts into Shared Plates
                </p>
              </div>
            </Link>

            {/* Metro City Hub Selector */}
            <div className="relative hidden xl:block">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  toast.info(`Switched city filter to ${e.target.value}`);
                }}
                className="text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer transition-colors focus:outline-emerald-500"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    📍 {c} Hub
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )
              }
              data-testid="nav-explore-link"
            >
              Explore Surplus
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )
              }
              data-testid="nav-map-link"
            >
              Live Rescue Map
            </NavLink>
            <NavLink
              to="/impact"
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )
              }
              data-testid="nav-impact-link"
            >
              Impact
            </NavLink>
            {me && (
              <NavLink
                to={HOME_BY_ROLE[me.role]}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    isActive ? "text-emerald-700 bg-emerald-50 font-bold" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50",
                  )
                }
                data-testid="nav-dashboard-link"
              >
                My Workspace
              </NavLink>
            )}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            
            {/* Urgent Banquet Hotline */}
            <button
              onClick={() => setHotlineOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs"
              title="Urgent 24/7 Banquet & Wedding Surplus Hotline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Urgent Hotline</span>
              <span className="text-[11px] font-mono font-bold text-amber-800 hidden lg:inline">+91 98000 91000</span>
            </button>

            {/* Post Surplus Button */}
            <button
              onClick={() => {
                if (!me) {
                  toast.info("Please sign in as a Food Donor to post surplus food");
                  navigate("/login");
                  return;
                }
                if (me.role !== "provider" && me.role !== "admin") {
                  toast.info("Switch to the 'Food Donor' persona in the top bar to post surplus");
                  return;
                }
                setCreateOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Surplus</span>
            </button>

            {/* Active User Badge / Auth Links */}
            {me ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <Link
                  to={HOME_BY_ROLE[me.role]}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Go to your dashboard"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-300">
                    {me.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{me.name}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">{ROLE_LABEL[me.role]}</p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-600"
                  onClick={onLogout}
                  aria-label="Log out"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 pl-1">
                <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Log in
                </Link>
                <Link to="/register" className={buttonVariants({ size: "sm" })}>
                  Join
                </Link>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Emergency Banquet Hotline Dialog */}
      <Dialog open={hotlineOpen} onOpenChange={setHotlineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <PhoneCall className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                24/7 Rapid Rescue Dispatch
              </span>
            </div>
            <DialogTitle className="font-heading text-xl text-slate-900">
              Emergency Event & Banquet Surplus Hotline
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Catering surplus from a wedding, reception, or corporate summit? Our rapid courier team arrives with insulated thermal containers under 30 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 my-2 text-center">
            <p className="text-xs font-semibold text-amber-800 mb-1">TOLL-FREE IMMEDIATE DISPATCH HOTLINE</p>
            <p className="font-mono text-2xl font-extrabold text-amber-950 tracking-wider">+91 98000 91000</p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-600" /> &lt; 30 Min SLA</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> FSSAI Inspected</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              onClick={copyHotline}
            >
              {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied!" : "Copy Phone Number"}
            </Button>
            <Button variant="outline" onClick={() => setHotlineOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Donation Dialog */}
      <DonationCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

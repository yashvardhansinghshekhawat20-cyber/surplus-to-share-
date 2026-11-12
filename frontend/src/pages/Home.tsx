import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  HandHeart,
  Megaphone,
  ShieldCheck,
  Truck,
  Utensils,
  Users,
  Zap,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
  Droplets,
  Trees,
  Car,
  Filter,
  CheckCircle2,
  Building2,
  Bike,
  Shield
} from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { DonationCard } from "@/components/donations/DonationCard";
import { DonationCreateDialog } from "@/components/donations/DonationCreateDialog";
import { useMe } from "@/hooks/useMe";
import { apiGet, apiPost } from "@/lib/api";
import { HOME_BY_ROLE, ROLE_LABEL, CATEGORIES, CITIES } from "@/lib/constants";
import type { Donation, PublicStats, Role } from "@/types";
import { toast } from "sonner";

export default function Home() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => apiGet<PublicStats>("/stats"),
  });
  const donationsQuery = useQuery({
    queryKey: ["donations", "home-feed"],
    queryFn: () => apiGet<Donation[]>("/donations?status=available"),
  });

  const stats: PublicStats = statsQuery.data ?? {
    donations_listed: 9,
    rescued_meals: 80.0,
    partner_ngos: 2,
    active_volunteers: 2,
  };

  const rawDonations = donationsQuery.data ?? [];
  const filteredDonations = rawDonations.filter((d) => {
    if (selectedCategory !== "all" && d.category !== selectedCategory) return false;
    if (selectedCity !== "all" && d.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.pickup_location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePersonaLogin = async (email: string, pass: string, role: Role, path: string) => {
    try {
      await apiPost("/auth/login", { email, password: pass });
      await queryClient.invalidateQueries();
      toast.success(`Logged in as ${ROLE_LABEL[role]}`);
      navigate(path);
    } catch (e: any) {
      toast.error(e?.body?.detail || "Login failed");
    }
  };

  return (
    <div className="space-y-14 pb-20">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION WITH MODERN ACCENTS                      */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Content */}
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hyperlocal Food Rescue Network &bull; India
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.12] mb-6">
                Turn Untouched <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Surplus Feasts</span> into Shared Plates.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                Bridging wedding banquets, caterers, hotels, and corporate kitchens with verified orphanages, shelters, and community kitchens across India in <strong>under 30 minutes</strong>.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Utensils className="w-4 h-4" />
                  Explore Available Surplus
                </Link>

                <Button
                  onClick={() => {
                    if (me?.role === "provider" || me?.role === "admin") {
                      setCreateOpen(true);
                    } else {
                      navigate("/provider");
                    }
                  }}
                  variant="outline"
                  className="px-6 py-3.5 h-auto rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
                >
                  <Megaphone className="w-4 h-4 mr-1.5 text-emerald-400" />
                  Donate Surplus Food
                </Button>

                <a
                  href="tel:+919800091000"
                  className="px-4 py-3.5 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400 animate-pulse" />
                  Hotline: +91 98000 91000
                </a>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>&lt; 30 Min SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>FSSAI Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Thermal Cold Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>100% Verified NGOs</span>
                </div>
              </div>
            </div>

            {/* Right Card: Rapid Hotline Guarantee Spotlight */}
            <div className="w-full lg:max-w-md bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Dispatch Hub Active
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  UNDER 30 MINS
                </span>
              </div>

              <div className="py-5 space-y-4">
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">CATERING, WEDDING &amp; BANQUET SURPLUS</p>
                  <h3 className="font-heading font-bold text-lg text-white">Emergency Food Pickup Hotline</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Unused hot banquet meals? Our certified electric couriers arrive with food-grade thermal carriers.
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2.5">
                    <span className="font-mono text-base font-bold text-emerald-300">+91 98000 91000</span>
                    <a
                      href="tel:+919800091000"
                      className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                    >
                      Call Now
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                    <p className="text-slate-400 text-[11px]">Rescued Meals</p>
                    <p className="font-mono text-xl font-extrabold text-emerald-400 mt-0.5">
                      {stats.rescued_meals > 0 ? stats.rescued_meals.toLocaleString() : "68,420"}+
                    </p>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                    <p className="text-slate-400 text-[11px]">Partner Shelters</p>
                    <p className="font-mono text-xl font-extrabold text-white mt-0.5">165</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/map"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  View live rescue map across Indian cities <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ESG SUSTAINABILITY & IMPACT TICKER                    */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified Environmental Impact
              </span>
              <h2 className="font-heading font-extrabold text-2xl text-slate-900 mt-2">
                Every Meal Rescued Protects Our Planet
              </h2>
            </div>
            <Link
              to="/impact"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 shrink-0"
            >
              Explore Full ESG Analytics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700">
                <Utensils className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Meals Rescued</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-slate-900">
                {stats.rescued_meals > 0 ? stats.rescued_meals.toLocaleString() : "68,420"}+
              </p>
              <p className="text-xs text-slate-500">Beneficiaries fed in shelters</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Landfill Diversion</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-slate-900">27.3 Tons</p>
              <p className="text-xs text-slate-500">Solid organic food waste saved</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600">
                <Trees className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">GHG Avoided</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-slate-900">68.4 Tons</p>
              <p className="text-xs text-slate-500">CO2 equivalent emissions cut</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-600">
                <Droplets className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Water Conserved</span>
              </div>
              <p className="font-mono text-3xl font-extrabold text-slate-900">12.45M L</p>
              <p className="text-xs text-slate-500">Agricultural freshwater saved</p>
            </div>
          </div>

          {/* Equivalency Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Car className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Equivalent to <strong>285,000 km</strong> driven by a standard car eliminated</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Trees className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Equal to planting <strong>3,420 mature urban trees</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Droplets className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Preserved enough water for <strong>185,000 household showers</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. 5-STEP DELIVERY PIPELINE VISUALIZER                   */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Rapid Rescue Protocol
          </span>
          <h2 className="font-heading font-extrabold text-3xl text-slate-900 mt-3">
            How Surplus Moves From Kitchen to Community
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Automated dispatching ensures hot meals never sit idle and cold chains remain intact.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">1</div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Donor Posts</h4>
            <p className="text-xs text-slate-500">Catering or banquet surplus listed with portion count and temperature requirements.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">2</div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">NGO Claims</h4>
            <p className="text-xs text-slate-500">Verified shelters calculate beneficiaries and submit matching portion claim requests.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">3</div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Admin Approves</h4>
            <p className="text-xs text-slate-500">Instant hygiene check and authorization by platform operations dispatchers.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">4</div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Courier Collects</h4>
            <p className="text-xs text-slate-500">Volunteer courier arrives with insulated carriers and begins GPS-tracked transit.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden border-emerald-500/50 bg-emerald-50/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3">5</div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Safe Handover</h4>
            <p className="text-xs text-slate-500">Shelter receives meals, courier uploads proof photo, and impact metrics update live.</p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. LIVE RESCUE BOARD WITH CATEGORY & CITY FILTERS        */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Live Rescue Board</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
              Active Surplus Available Now
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Real-time untouched surplus from partner banquet halls, bakeries, and grocers.
            </p>
          </div>

          {/* Search & City Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search by food or location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-emerald-500 w-48 sm:w-60 shadow-xs"
            />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-emerald-500 shadow-xs"
            >
              <option value="all">All Metro Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Categories ({rawDonations.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = rawDonations.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-emerald-700 text-white shadow-sm font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Donations Grid */}
        {donationsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Utensils className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="font-heading font-semibold text-lg text-slate-900">No surplus matches found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              Try adjusting your category or city filters to view all active food rescue listings.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCity("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800"
          >
            Explore all surplus listings with interactive filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE ROLE EXPERIENCE SWITCHER                  */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
              Multi-Persona Experience
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mt-3">
              One Unified Platform, Tailored For Every Stakeholder
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Click below to test each user's complete end-to-end dashboard with pre-configured demo credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Donor */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Food Donor</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Chef Vikram (Royal Orchid Banquets). Post banquet surplus with portion count, temperature, and expiry in under 60 seconds.
                </p>
              </div>
              <Button
                onClick={() => handlePersonaLogin("donor@foodlink.in", "donor123", "provider", "/provider")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Launch Donor Portal
              </Button>
            </div>

            {/* Recipient NGO */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Recipient NGO</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Sister Clara (Asha Deep Children's Home). Browse surplus, request portion quantities, and track courier ETA live.
                </p>
              </div>
              <Button
                onClick={() => handlePersonaLogin("ngo@foodlink.in", "ngo123", "recipient", "/recipient")}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                Launch NGO Portal
              </Button>
            </div>

            {/* Volunteer Courier */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Rescue Courier</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Rahul Sharma (Ather EV). Accept pickup missions, update transit status, broadcast live GPS, and upload photo proof.
                </p>
              </div>
              <Button
                onClick={() => handlePersonaLogin("volunteer@foodlink.in", "volunteer123", "volunteer", "/volunteer")}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Launch Courier Portal
              </Button>
            </div>

            {/* Admin */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">Platform Admin</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Operations Director. Approve/reject requests, manage platform users, and export Excel/JSON database backups.
                </p>
              </div>
              <Button
                onClick={() => handlePersonaLogin("admin@foodlink.in", "admin123", "admin", "/admin")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Launch Admin Console
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Donation Creation Dialog */}
      <DonationCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

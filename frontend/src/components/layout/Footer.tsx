import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PublicStats } from "@/types";

export default function Footer() {
  const { data: stats } = useQuery<PublicStats>({
    queryKey: ["publicStats"],
    queryFn: () => apiGet<PublicStats>("/stats"),
  });

  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Rapid Dispatch Callout Guarantee */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/25 p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base sm:text-lg">
                  Rapid Banquet Surplus Dispatch Guarantee
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  UNDER 30 MINS
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Wedding banquet, corporate feast, or catering surplus? Verified couriers arrive equipped with insulated thermal carriers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:+919800091000"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-transform hover:scale-105"
            >
              Call +91 98000 91000
            </a>
            <Link
              to="/provider"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-transform hover:scale-105"
            >
              Post Donation
            </Link>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                FL
              </div>
              <span className="font-heading font-bold text-lg text-white">FoodLink &bull; Surplus to Share</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-3">
              India's hyperlocal community food rescue and redistribution network bridging untouched banquet and kitchen surplus to verified orphanages, shelters, and community kitchens.
            </p>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              FSSAI Food Hygiene Compliant
            </span>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Browse Available Surplus</Link></li>
              <li><Link to="/map" className="hover:text-emerald-400 transition-colors">Interactive Rescue Map</Link></li>
              <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">Carbon & Water Saved Analytics</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Demo Account Fast Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Active Metro Hubs</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <span>&bull; Bengaluru</span>
              <span>&bull; Mumbai</span>
              <span>&bull; Delhi NCR</span>
              <span>&bull; Hyderabad</span>
              <span>&bull; Chennai</span>
              <span>&bull; Pune</span>
              <span>&bull; Kolkata</span>
              <span>&bull; Ahmedabad</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">Verified Impact Counter</h4>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Meals Rescued:</span>
                <span className="text-emerald-400 font-bold">{stats ? `${stats.rescued_meals.toLocaleString()}+` : "68,420+"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CO2 Prevented:</span>
                <span className="text-emerald-400 font-bold">68.4 Tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Partner Shelters:</span>
                <span className="text-white font-bold">{stats?.partner_ngos ?? 165}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Courier SLA:</span>
                <span className="text-amber-400 font-bold">28 mins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>&copy; 2026 FoodLink (Surplus to Share). Built for zero food waste and hunger relief in India.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Powered by <Heart className="w-3.5 h-3.5 text-red-500 inline fill-red-500" /> Community Donors &amp; Volunteers
          </p>
        </div>
      </div>
    </footer>
  );
}

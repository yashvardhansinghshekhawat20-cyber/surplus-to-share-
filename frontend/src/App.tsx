import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { RoleSwitcherBar } from "@/components/layout/RoleSwitcherBar";
import { useMe } from "@/hooks/useMe";
import { HOME_BY_ROLE } from "@/lib/constants";
import AdminDashboard from "@/pages/AdminDashboard";
import Explore from "@/pages/Explore";
import Home from "@/pages/Home";
import Impact from "@/pages/Impact";
import Login from "@/pages/Login";
import MapPage from "@/pages/MapPage";
import ProviderDashboard from "@/pages/ProviderDashboard";
import RecipientDashboard from "@/pages/RecipientDashboard";
import Register from "@/pages/Register";
import VolunteerDashboard from "@/pages/VolunteerDashboard";
import type { Role } from "@/types";

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-[#475569]">
        Checking your session…
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== role) return <Navigate to={HOME_BY_ROLE[me.role]} replace />;
  return <>{children}</>;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      <RoleSwitcherBar />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/impact" element={<Impact />} />
          <Route
            path="/provider"
            element={
              <RequireRole role="provider">
                <ProviderDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/recipient"
            element={
              <RequireRole role="recipient">
                <RecipientDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/volunteer"
            element={
              <RequireRole role="volunteer">
                <VolunteerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}

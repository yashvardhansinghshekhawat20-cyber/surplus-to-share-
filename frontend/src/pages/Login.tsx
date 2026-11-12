import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { HOME_BY_ROLE } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/format";
import { beginSession } from "@/lib/session";
import type { User } from "@/types";

const PANEL_IMAGE =
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: (body: { email: string; password: string }) => apiPost<User>("/auth/login", body),
    onSuccess: async (user) => {
      await beginSession();
      toast.success(`Welcome back, ${user.organization || user.name}!`);
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PANEL_IMAGE})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(2,44,34,0.92) 0%, rgba(6,78,59,0.8) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-[#F4F7F2]">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#34d399]/40 bg-[#34d399]/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#34d399]">
            Food rescue network
          </span>
          <blockquote className="max-w-md font-heading text-2xl leading-snug">
            “The wedding had 200 plates left over. FoodLink had them at our shelter before
            midnight.”
            <footer className="mt-4 font-sans text-sm text-[#94a3b8]">
              — Shelter coordinator, Bengaluru
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f172a]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#475569]">Log in to your FoodLink account.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate({ email, password });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.org"
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
              data-testid="btn-login"
            >
              {loginMutation.isPending ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#475569]">
            New to FoodLink?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#059669] hover:underline"
              data-testid="login-to-register-link"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

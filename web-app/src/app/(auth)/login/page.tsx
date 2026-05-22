"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, TrendingUp, Brain, BarChart2, Shield } from "lucide-react";

const BRAND_QUOTES = [
  {
    text: "The market rewards discipline, not prediction.",
    author: "NepseSage",
  },
  {
    text: "Clinical precision separates investors from gamblers.",
    author: "NepseSage",
  },
  {
    text: "Every trade is a data point. Every bias, a lesson.",
    author: "NepseSage",
  },
];

const FEATURE_PILLS = [
  { icon: Brain, label: "AI-Powered Insights" },
  { icon: BarChart2, label: "Behavioral Lab" },
  { icon: TrendingUp, label: "Market Intelligence" },
  { icon: Shield, label: "Risk Analytics" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const quoteIdx = 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand ───────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden p-12"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.03 250) 0%, oklch(0.19 0.04 250) 50%, oklch(0.16 0.025 260) 100%)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.17 165) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.15 200) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.72 0.17 165)" }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="font-heading text-xl font-bold"
                style={{ color: "oklch(0.92 0.01 250)" }}
              >
                NepseSage
              </h1>
              <p className="clinical-label" style={{ fontSize: "0.6rem" }}>
                Clinical Analyst
              </p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 space-y-8">
          <div>
            <div
              className="w-12 h-1 rounded-full mb-6"
              style={{ background: "oklch(0.72 0.17 165)" }}
            />
            <blockquote
              className="font-heading text-3xl font-semibold leading-snug"
              style={{ color: "oklch(0.88 0.01 250)" }}
            >
              &ldquo;{BRAND_QUOTES[quoteIdx].text}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm" style={{ color: "oklch(0.55 0.02 250)" }}>
              — {BRAND_QUOTES[quoteIdx].author}
            </p>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg px-4 py-3"
                style={{
                  background: "oklch(0.22 0.025 250 / 0.6)",
                  border: "1px solid oklch(0.28 0.02 250)",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: "oklch(0.72 0.17 165)" }} />
                <span className="text-xs font-medium" style={{ color: "oklch(0.75 0.015 250)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: "oklch(0.42 0.02 250)" }}>
            Built for serious Nepali investors 🇳🇵
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.72 0.17 165)" }}
          >
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">NepseSage</span>
        </div>

        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your clinical analyst workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="clinical-label text-[0.65rem]"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="clinical-label text-[0.65rem]"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-input accent-primary cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Guest CTA */}
          <button 
            onClick={loginAsGuest}
            className="auth-btn-ghost w-full block text-center"
          >
            Continue as Guest
          </button>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to NepseSage?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

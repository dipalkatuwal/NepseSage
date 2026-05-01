"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, TrendingUp, CheckCircle2 } from "lucide-react";

const BENEFITS = [
  "AI-powered behavioral trade analysis",
  "Personal risk meter & opportunity radar",
  "Portfolio journal with psychology tracking",
  "NEPSE market simulation engine",
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginAsGuest } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.email) return "Please enter your email address.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    if (!form.agreed) return "Please agree to the Terms of Service to continue.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    setIsLoading(true);
    const result = await signup(form.name, form.email, form.password);
    setIsLoading(false);
    if (result.success) {
      router.push("/onboarding");
    } else {
      setError(result.error || "Sign up failed.");
    }
  };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak", color: "oklch(0.62 0.22 25)" };
    if (score === 2) return { label: "Fair", color: "oklch(0.80 0.16 80)" };
    if (score === 3) return { label: "Good", color: "oklch(0.65 0.15 200)" };
    return { label: "Strong", color: "oklch(0.72 0.17 165)" };
  })();

  return (
    <div className="min-h-screen flex">
      {/* ── Left Brand Panel ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden p-12"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.03 250) 0%, oklch(0.19 0.04 250) 50%, oklch(0.16 0.025 260) 100%)",
        }}
      >
        <div
          className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.17 165) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.72 0.17 165)" }}
          >
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold" style={{ color: "oklch(0.92 0.01 250)" }}>
              NEPSE Sage
            </h1>
            <p className="clinical-label" style={{ fontSize: "0.6rem" }}>Clinical Analyst</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="w-12 h-1 rounded-full mb-6" style={{ background: "oklch(0.72 0.17 165)" }} />
            <h2 className="font-heading text-3xl font-semibold leading-snug" style={{ color: "oklch(0.88 0.01 250)" }}>
              Start trading with<br />clinical intelligence.
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "oklch(0.55 0.02 250)" }}>
              Join thousands of Nepali investors who use data-driven behavioral insights to improve their trading discipline.
            </p>
          </div>

          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.72 0.17 165)" }}
                />
                <span className="text-sm" style={{ color: "oklch(0.72 0.015 250)" }}>
                  {benefit}
                </span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "12K+", label: "Investors" },
              { value: "98%", label: "Accuracy" },
              { value: "Free", label: "To Start" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-lg p-4 text-center"
                style={{
                  background: "oklch(0.22 0.025 250 / 0.6)",
                  border: "1px solid oklch(0.28 0.02 250)",
                }}
              >
                <p className="font-heading text-2xl font-bold" style={{ color: "oklch(0.72 0.17 165)" }}>
                  {value}
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 250)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "oklch(0.42 0.02 250)" }}>
          Built for serious Nepali investors 🇳🇵
        </p>
      </div>

      {/* ── Right Panel — Form ───────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.72 0.17 165)" }}>
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">NEPSE Sage</span>
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">Create your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your clinical analyst workspace in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="clinical-label text-[0.65rem]">Full Name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                placeholder="Ram Shrestha"
                className="auth-input"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="clinical-label text-[0.65rem]">Email Address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="auth-input"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="clinical-label text-[0.65rem]">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 8 characters"
                  className="auth-input pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {passwordStrength && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => {
                      const filled = ["Weak", "Fair", "Good", "Strong"].indexOf(passwordStrength.label) >= i - 1;
                      return (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: filled ? passwordStrength.color : "var(--color-border)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-confirm" className="clinical-label text-[0.65rem]">Confirm Password</label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Repeat your password"
                  className="auth-input pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="agreed"
                type="checkbox"
                checked={form.agreed}
                onChange={set("agreed")}
                className="mt-0.5 h-4 w-4 rounded border-border bg-input accent-primary cursor-pointer"
              />
              <label htmlFor="agreed" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                I agree to the{" "}
                <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
                {" "}and{" "}
                <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>

            {/* Error */}
            {error && <div className="auth-error"><span>{error}</span></div>}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="auth-btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>

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
        </div>
      </div>
    </div>
  );
}

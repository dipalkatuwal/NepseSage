"use client";

import Link from "next/link";
import { Lock, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Sign-in gate (for unauthenticated users) ─────────────────────────────────

function SignInGate({
  featureName,
  featureDesc,
}: {
  featureName: string;
  featureDesc: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-6 py-16">
      <div
        className="absolute pointer-events-none w-96 h-96 rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.17 165) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full p-8 rounded-2xl"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "oklch(0.72 0.17 165 / 0.1)",
            border: "1.5px solid oklch(0.72 0.17 165 / 0.3)",
          }}
        >
          <Lock className="h-7 w-7" style={{ color: "oklch(0.72 0.17 165)" }} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: "oklch(0.72 0.17 165)" }} />
          <span className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            NepseSage
          </span>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          Sign in to access {featureName}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          {featureDesc}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/login" className="auth-btn-primary flex-1 text-center text-sm py-2.5">
            Sign In
          </Link>
          <Link href="/signup" className="auth-btn-ghost flex-1 text-center text-sm py-2.5">
            Create Account
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Free to join · No credit card required · 🇳🇵 Made for Nepali investors
        </p>
      </div>
    </div>
  );
}

// ─── Pro upgrade gate (for authenticated free users) ──────────────────────────

function ProGate({
  featureName,
  featureDesc,
}: {
  featureName: string;
  featureDesc: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-6 py-16">
      <div
        className="absolute pointer-events-none w-96 h-96 rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.17 165) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full p-8 rounded-2xl"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "oklch(0.72 0.17 165 / 0.1)",
            border: "1.5px solid oklch(0.72 0.17 165 / 0.3)",
          }}
        >
          <Zap className="h-7 w-7" style={{ color: "oklch(0.72 0.17 165)" }} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: "oklch(0.72 0.17 165)" }} />
          <span className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Pro Feature
          </span>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          {featureName} is a Pro feature
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          {featureDesc}
        </p>

        <Link
          href="/upgrade"
          className="auth-btn-primary w-full text-center text-sm py-2.5"
        >
          <Zap className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Upgrade to Pro
        </Link>

        <p className="mt-6 text-xs text-muted-foreground">
          Starting from NPR 399/mo · Cancel anytime
        </p>
      </div>
    </div>
  );
}

// ─── Public AuthGuard  ────────────────────────────────────────────────────────

interface AuthGuardProps {
  children: React.ReactNode;
  /** "user" = requires sign-in | "pro" = requires pro plan */
  require?: "user" | "pro";
  featureName?: string;
  featureDesc?: string;
}

export function AuthGuard({
  children,
  require = "user",
  featureName = "this feature",
  featureDesc = "Sign in to unlock the full NepseSageexperience.",
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <div className="h-6 w-6 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  // Not signed in at all
  if (!isAuthenticated) {
    return <SignInGate featureName={featureName} featureDesc={featureDesc} />;
  }

  // Signed in but not pro
  if (require === "pro" && user?.plan !== "pro") {
    return <ProGate featureName={featureName} featureDesc={featureDesc} />;
  }

  return <>{children}</>;
}

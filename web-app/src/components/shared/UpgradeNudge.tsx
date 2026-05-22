"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Zap, TrendingUp, Brain, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "nepsesage_upgrade_nudge_seen";
const DELAY_MS = 12_000; // 12 seconds

export function UpgradeNudge() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show on the upgrade page itself
    if (pathname === "/upgrade") return;
    // Don't show to Pro users
    if (user?.plan === "pro") return;
    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [pathname, user?.plan]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-primary/30 bg-background shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Unlock Pro</span>
          </div>

          <h3 className="font-heading text-xl font-bold mb-1">
            You're browsing with limits
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Pro members see deeper. Upgrade to access unlimited AI, full floorsheets, and advanced signals.
          </p>

          <div className="space-y-2.5 mb-5">
            {[
              { icon: Brain, text: "Unlimited Sage AI queries — no daily cap" },
              { icon: TrendingUp, text: "Full floorsheet access & real-time alerts" },
              { icon: Zap, text: "20+ technical indicators with auto-signals" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/signup"
                  onClick={() => setShow(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  <Zap className="h-4 w-4" />
                  Create Free Account
                </Link>
                <Link
                  href="/login"
                  onClick={() => setShow(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
                >
                  Sign in to upgrade
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <Link
                href="/upgrade"
                onClick={() => setShow(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                <Zap className="h-4 w-4" />
                See Pro Plans — from NPR 399/mo
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <button
              onClick={() => setShow(false)}
              className="text-xs text-muted-foreground hover:text-foreground text-center py-1 transition"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  TrendingUp,
  Brain,
  BarChart3,
  ShieldCheck,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  Lock,
  Sparkles,
  Activity,
  Bot,
  LineChart,
  X,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const proFeatures = [
  {
    icon: Bot,
    title: "Sage AI — AI Stock Analyst",
    desc: "Ask Sage AI anything about any NEPSE stock, sector, or your own portfolio. Get instant, data-backed analysis.",
    free: "Locked",
    pro: "Full access",
  },
  {
    icon: LineChart,
    title: "Paper Trading Simulator",
    desc: "Practice strategies with Rs. 10,00,000 in virtual capital using real NEPSE market data. Zero risk, real experience.",
    free: "Locked",
    pro: "Full access",
  },
  {
    icon: FileText,
    title: "Full Floorsheet Access",
    desc: "See every transaction in real-time. Know exactly who is buying and selling before making your move.",
    free: "Locked",
    pro: "Full access",
  },
  {
    icon: BarChart3,
    title: "Advanced Portfolio Analytics",
    desc: "Sector allocation, portfolio beta, P&L breakdown, value history charts and opportunity radar — all live.",
    free: "Basic tracking",
    pro: "Full analytics",
  },
  {
    icon: Brain,
    title: "Sage Intelligence Card",
    desc: "Daily AI-powered market sentiment summary with rebalancing suggestions tailored to your portfolio.",
    free: "Locked",
    pro: "Daily updates",
  },
  {
    icon: ShieldCheck,
    title: "Priority Support",
    desc: "Skip the queue. Get responses within 4 hours via email or Discord from our Nepal-based support team.",
    free: "24–48h",
    pro: "< 4 hours",
  },
];

const testimonials = [
  {
    name: "Sanjay Maharjan",
    role: "Retail Investor, Lalitpur",
    avatar: "SM",
    text: "The floorsheet analysis alone paid for 10 years of Pro. I saw the big players loading NLIC before the rally and jumped in early.",
    stars: 5,
  },
  {
    name: "Priya Shrestha",
    role: "Day Trader, Kathmandu",
    avatar: "PS",
    text: "Sage AI explained why my UPPER stock was underperforming in 30 seconds. I used to spend hours reading reports for the same answer.",
    stars: 5,
  },
  {
    name: "Bikash Karki",
    role: "Long-term Investor, Pokhara",
    avatar: "BK",
    text: "I switched from another platform and the discipline journal + behavioral coaching changed how I trade. Down 40% to even in 6 months.",
    stars: 5,
  },
];

const stats = [
  { value: "NPR 2.3L+", label: "Average Pro member portfolio gain" },
  { value: "12,000+", label: "Active NEPSE traders on platform" },
  { value: "94%", label: "Pro members renew after first month" },
  { value: "4.8★", label: "Average rating from verified users" },
];

export default function UpgradeClient() {
  const { isAuthenticated, user, upgradeToPro } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"method" | "processing" | "success">("method");
  const isPro = user?.plan === "pro";

  async function handleUpgrade() {
    setStep("processing");
    // Simulate payment processing (replace with real gateway later)
    await new Promise((r) => setTimeout(r, 2000));
    await upgradeToPro(billing);
    setStep("success");
  }

  function handleModalClose() {
    setShowModal(false);
    setStep("method");
    if (step === "success") router.refresh();
  }

  const monthlyPrice = 499;
  const yearlyPrice = 399;
  const displayPrice = billing === "monthly" ? monthlyPrice : yearlyPrice;
  const yearlySavings = (monthlyPrice - yearlyPrice) * 12;

  return (
    <>
    <div className="mx-auto max-w-5xl w-full pb-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs text-primary font-medium mb-5">
          <Sparkles className="h-3.5 w-3.5" />
          Designed for Nepal's stock market
        </div>

        <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
          Trade with the precision of<br />
          <span className="text-primary">a professional analyst</span>
        </h1>

        <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto">
          NepseSagePro gives you the AI, data, and discipline tools that
          institutional traders use — at a price built for Nepali retail investors.
        </p>

        {/* Non-authenticated CTA */}
        {!isAuthenticated && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <Zap className="h-4 w-4" />
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
            >
              Sign in to upgrade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {isPro && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-5 py-2 text-sm text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" />
            You're already on Pro — enjoy all features!
          </div>
        )}
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-secondary/20 p-4 text-center">
            <p className="font-heading text-xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Pricing cards ────────────────────────────────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billing === "yearly" ? "bg-primary" : "bg-border"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billing === "yearly" ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm ${billing === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
            <span className="ml-1.5 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">Save NPR {yearlySavings.toLocaleString()}</span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free card */}
          <div className="rounded-xl border border-border p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Free</p>
            <p className="font-heading text-3xl font-bold">NPR 0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground mt-2 mb-5">Get started with the essentials.</p>
            <ul className="space-y-2.5 mb-6">
              {[
                "Live market data & sector view",
                "Company details & price history",
                "Portfolio tracking (buy/sell/import)",
                "Watchlist — up to 10 symbols",
                "Community insights & leaderboard",
                "Trading journal & discipline score",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
              {[
                "Sage AI analyst",
                "Paper trading simulator",
                "Floorsheet access",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/40 line-through">
                  <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!isAuthenticated ? (
              <Link
                href="/signup"
                className="block w-full text-center rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-secondary/50 transition"
              >
                Get started free
              </Link>
            ) : isPro ? null : (
              <div className="block w-full text-center rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground">
                Current plan
              </div>
            )}
          </div>

          {/* Pro card */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">Most Popular</span>
            </div>
            <p className="text-xs text-primary uppercase tracking-widest mb-1 font-semibold">Pro</p>
            <p className="font-heading text-3xl font-bold">
              NPR {displayPrice.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            {billing === "yearly" && (
              <p className="text-xs text-primary mt-0.5">Billed NPR {(yearlyPrice * 12).toLocaleString()} annually</p>
            )}
            <p className="text-xs text-muted-foreground mt-2 mb-5">Everything you need to trade with conviction.</p>
            <ul className="space-y-2.5 mb-6">
              {[
                "Everything in Free",
                "Sage AI — full analyst access",
                "Paper trading simulator",
                "Full floorsheet access",
                "Advanced portfolio analytics & beta",
                "Sage Intelligence daily briefing",
                "Opportunity Radar — AI trade signals",
                "Priority support (< 4h)",
                "Early access to new features",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="block w-full text-center rounded-lg bg-primary/20 border border-primary/30 px-4 py-2.5 text-sm text-primary font-semibold">
                ✓ Active Plan
              </div>
            ) : !isAuthenticated ? (
              <Link
                href="/signup"
                className="block w-full text-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                Sign up & unlock Pro
                <ArrowRight className="inline-block ml-1.5 h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="block w-full text-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                Upgrade Now — NPR {displayPrice.toLocaleString()}/mo
                <ArrowRight className="inline-block ml-1.5 h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Cancel anytime. No hidden fees. Secure payment via eSewa & Khalti.
        </p>
      </div>

      {/* ── Feature breakdown ────────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="font-heading text-2xl font-bold text-center mb-2">Everything Pro includes</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Built for Nepali investors who are serious about growing their wealth in NEPSE.</p>

        <div className="grid md:grid-cols-2 gap-4">
          {proFeatures.map(({ icon: Icon, title, desc, free, pro }) => (
            <div key={title} className="rounded-lg border border-border p-5 hover:border-primary/40 transition">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground/60 line-through">Free: {free}</span>
                    <span className="text-xs text-primary font-medium">Pro: {pro}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="font-heading text-2xl font-bold text-center mb-2">Real traders, real results</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">From Kathmandu to Pokhara — here's what Pro members say.</p>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-lg border border-border p-5 flex flex-col gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex-1">"{t.text}"</p>
              <div className="flex items-center gap-2.5 pt-2 border-t border-border">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sign-up nudge for guests ──────────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center mb-12">
          <Users className="h-10 w-10 text-primary mx-auto mb-3" />
          <h3 className="font-heading text-xl font-bold mb-2">Join 12,000+ Nepali investors</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create a free account in 60 seconds. No credit card required.
            Start with Free and upgrade when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <Zap className="h-4 w-4" />
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition underline underline-offset-4"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-center mb-6">Frequently asked questions</h2>
        <div className="space-y-2 max-w-2xl mx-auto">
          {[
            {
              q: "How do I pay? Do you support eSewa or Khalti?",
              a: "Yes — we support eSewa, Khalti, and bank transfer. Payment is processed securely and your subscription activates instantly.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Absolutely. Cancel with one click from Settings → Billing. You keep Pro access until the end of your billing period — no penalties.",
            },
            {
              q: "Is there a free trial for Pro?",
              a: "New accounts get a 7-day Pro trial automatically. No credit card needed to start.",
            },
            {
              q: "What happens to my data if I downgrade?",
              a: "All your journal entries, portfolio data, and settings are always yours. Downgrading only affects feature access, never your data.",
            },
            {
              q: "Does NepseSagework for broker-assisted trading?",
              a: "Yes. You can manually log trades or import from your broker statement. We support all NEPSE-registered brokers.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="rounded-lg border border-border p-4 group">
              <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                {q}
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 ml-3" />
              </summary>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            {step !== "success" && (
              <button
                onClick={handleModalClose}
                className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="p-6">
              {step === "method" && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">Confirm Upgrade</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-1">
                    NepseSagePro — {billing === "yearly" ? "Yearly" : "Monthly"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    NPR {displayPrice.toLocaleString()}/mo
                    {billing === "yearly" && <span className="ml-2 text-primary text-xs">· Billed annually</span>}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Choose payment method</p>
                  <div className="space-y-2 mb-5">
                    {[
                      { id: "esewa",  label: "eSewa",         color: "bg-green-500/10 border-green-500/30 text-green-600",   note: "Most popular in Nepal" },
                      { id: "khalti", label: "Khalti",        color: "bg-purple-500/10 border-purple-500/30 text-purple-600", note: "Instant wallet payment" },
                      { id: "bank",   label: "Bank Transfer", color: "bg-blue-500/10 border-blue-500/30 text-blue-600",       note: "Verified within 24h" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={handleUpgrade}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition hover:opacity-90 ${m.color}`}
                      >
                        <span>{m.label}</span>
                        <span className="text-xs opacity-70">{m.note}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    🔒 Secure · Cancel anytime · NPR {displayPrice.toLocaleString()}/mo
                  </p>
                </>
              )}

              {step === "processing" && (
                <div className="flex flex-col items-center py-8 text-center gap-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div>
                    <p className="font-heading font-bold text-base">Processing payment…</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait, do not close this window.</p>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center py-6 text-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-9 w-9 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xl">{"You're now Pro! 🎉"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All Pro features are unlocked. Welcome to NepseSagePro.
                    </p>
                  </div>
                  <button
                    onClick={handleModalClose}
                    className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                  >
                    Start using Pro features
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

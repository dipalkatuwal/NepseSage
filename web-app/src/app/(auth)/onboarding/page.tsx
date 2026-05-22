"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, ChevronRight, ChevronLeft, CheckCircle2, SkipForward } from "lucide-react";

type Experience = "beginner" | "intermediate" | "expert";

const EXPERIENCE_OPTIONS: { value: Experience; label: string; desc: string; emoji: string }[] = [
  {
    value: "beginner",
    label: "Beginner",
    desc: "I'm just starting out in NEPSE. I want to learn the basics.",
    emoji: "🌱",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "I've been investing for 1–3 years and understand fundamentals.",
    emoji: "📈",
  },
  {
    value: "expert",
    label: "Expert",
    desc: "I'm an active trader with deep technical and fundamental knowledge.",
    emoji: "🧠",
  },
];

const SECTORS = [
  "Commercial Banks",
  "Development Banks",
  "Finance Companies",
  "Hydropower",
  "Insurance",
  "Hotels & Tourism",
  "Manufacturing",
  "Microfinance",
  "Investment",
  "Life Insurance",
];

const POPULAR_SYMBOLS = [
  "NICA", "NABIL", "SANIMA", "KBL", "UPPER",
  "SHL", "NLG", "NLIC", "CHCL", "ADBL",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [customSymbol, setCustomSymbol] = useState("");

  const toggleSector = (s: string) => {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleSymbol = (s: string) => {
    setWatchlist((prev) =>
      prev.includes(s)
        ? prev.filter((x) => x !== s)
        : prev.length < 5
        ? [...prev, s]
        : prev
    );
  };

  const addCustomSymbol = () => {
    const sym = customSymbol.trim().toUpperCase();
    if (sym && !watchlist.includes(sym) && watchlist.length < 5) {
      setWatchlist((prev) => [...prev, sym]);
      setCustomSymbol("");
    }
  };

  const handleFinish = () => {
    completeOnboarding({
      experience: experience ?? "beginner",
      sectors,
      watchlist,
    });
    router.push("/");
  };

  const handleSkip = () => {
    completeOnboarding({
      experience: "beginner",
      sectors: [],
      watchlist: [],
    });
    router.push("/");
  };

  const canProceedStep1 = !!experience;
  const canProceedStep2 = sectors.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(0.72 0.17 165)" }}
        >
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-foreground">NepseSage</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background:
                  step > s
                    ? "oklch(0.72 0.17 165)"
                    : step === s
                    ? "oklch(0.72 0.17 165 / 0.15)"
                    : "var(--color-muted)",
                color:
                  step > s
                    ? "oklch(0.15 0.02 250)"
                    : step === s
                    ? "oklch(0.72 0.17 165)"
                    : "var(--color-muted-foreground)",
                border:
                  step === s
                    ? "2px solid oklch(0.72 0.17 165)"
                    : "2px solid transparent",
              }}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className="h-px w-10 transition-all duration-300"
                style={{
                  background:
                    step > s ? "oklch(0.72 0.17 165)" : "var(--color-border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[520px] rounded-2xl p-8"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* ── Step 1: Experience ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <p className="clinical-label text-primary mb-1">Step 1 of 3</p>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">
              What&apos;s your experience level?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              We&apos;ll personalize your Sage AI insights based on your background.
            </p>

            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4"
                  style={{
                    background:
                      experience === opt.value
                        ? "oklch(0.72 0.17 165 / 0.1)"
                        : "var(--color-muted)",
                    border:
                      experience === opt.value
                        ? "1.5px solid oklch(0.72 0.17 165)"
                        : "1.5px solid var(--color-border)",
                  }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-sm text-foreground">
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {experience === opt.value && (
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "oklch(0.72 0.17 165)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Sectors ── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <p className="clinical-label text-primary mb-1">Step 2 of 3</p>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">
              Which sectors interest you?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Select all that apply. Sage AI will prioritize insights in these areas.
            </p>

            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => {
                const selected = sectors.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: selected
                        ? "oklch(0.72 0.17 165 / 0.15)"
                        : "var(--color-muted)",
                      border: selected
                        ? "1.5px solid oklch(0.72 0.17 165)"
                        : "1.5px solid var(--color-border)",
                      color: selected
                        ? "oklch(0.72 0.17 165)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {selected && "✓ "}{s}
                  </button>
                );
              })}
            </div>
            {sectors.length === 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                Select at least one sector to continue.
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Watchlist ── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <p className="clinical-label text-primary mb-1">Step 3 of 3</p>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">
              Seed your watchlist
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Pick up to 5 NEPSE symbols to start tracking. You can change these anytime.
            </p>

            {/* Popular picks */}
            <p className="clinical-label mb-3">Popular picks</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {POPULAR_SYMBOLS.map((sym) => {
                const selected = watchlist.includes(sym);
                const maxed = watchlist.length >= 5 && !selected;
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymbol(sym)}
                    disabled={maxed}
                    className="px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all duration-200"
                    style={{
                      background: selected
                        ? "oklch(0.72 0.17 165)"
                        : "var(--color-muted)",
                      border: selected
                        ? "1.5px solid oklch(0.72 0.17 165)"
                        : "1.5px solid var(--color-border)",
                      color: selected
                        ? "oklch(0.15 0.02 250)"
                        : maxed
                        ? "var(--color-muted-foreground)"
                        : "var(--color-foreground)",
                      opacity: maxed ? 0.5 : 1,
                    }}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>

            {/* Custom symbol input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && addCustomSymbol()}
                placeholder="Add custom symbol (e.g. HDL)"
                maxLength={10}
                className="auth-input flex-1 font-mono text-xs"
                disabled={watchlist.length >= 5}
              />
              <button
                onClick={addCustomSymbol}
                disabled={watchlist.length >= 5 || !customSymbol.trim()}
                className="auth-btn-primary px-4 whitespace-nowrap text-xs disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Selected display */}
            {watchlist.length > 0 && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                <p className="clinical-label mb-2">Your watchlist ({watchlist.length}/5)</p>
                <div className="flex flex-wrap gap-2">
                  {watchlist.map((sym) => (
                    <span
                      key={sym}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono"
                      style={{
                        background: "oklch(0.72 0.17 165 / 0.12)",
                        color: "oklch(0.72 0.17 165)",
                      }}
                    >
                      {sym}
                      <button
                        onClick={() => setWatchlist((prev) => prev.filter((x) => x !== sym))}
                        className="hover:opacity-70 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip setup
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="auth-btn-ghost flex items-center gap-1.5 px-4 text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="auth-btn-primary flex items-center gap-1.5 px-5 text-sm disabled:opacity-40"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="auth-btn-primary flex items-center gap-1.5 px-5 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                {user?.name ? `Go to Dashboard, ${user.name.split(" ")[0]}!` : "Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        You can update all preferences later in Settings.
      </p>
    </div>
  );
}

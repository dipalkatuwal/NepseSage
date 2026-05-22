"use client";

import {
  User,
  Wallet,
  Bell,
  Palette,
  Lock,
  CreditCard,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Trash2,
  Download,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/services";
import { toast } from "sonner";

const tabs = [
  { label: "Account", icon: User },
  { label: "Portfolio", icon: Wallet },
  { label: "Notifications", icon: Bell },
  { label: "Appearance", icon: Palette },
  { label: "Privacy", icon: Lock },
  { label: "Billing", icon: CreditCard },
  { label: "Support", icon: HelpCircle },
];

const SECTORS = [
  "Banking",
  "Development Bank",
  "Finance",
  "Microfinance",
  "Life Insurance",
  "Non-Life Insurance",
  "Hotels",
  "Hydropower",
  "Manufacturing",
  "Trading",
  "Investment",
  "Others",
];

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

export default function SettingsClient() {
  const { user, updateUser, updateProfileAPI, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "Account");

  // Keep active tab in sync whenever the URL ?tab= param changes
  // (e.g. when the user navigates from the navbar dropdown while already on /settings)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ── Account tab state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    tradingGoal: "",
  });
  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  // ── Portfolio tab state ────────────────────────────────────────────────────
  const [riskTolerance, setRiskTolerance] = useState<
    "conservative" | "moderate" | "aggressive"
  >((user?.riskTolerance as "conservative" | "moderate" | "aggressive") ?? "moderate");
  const [defaultView, setDefaultView] = useState("Holdings");
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    user?.profile?.sectors ?? []
  );

  // ── Notifications tab state ────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    priceAlerts: true,
    portfolioSummary: true,
    marketOpen: false,
    marketClose: true,
    newsDigest: false,
    disciplineNudges: true,
  });

  // ── Appearance tab state ───────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  // ── Privacy tab state ──────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateProfile({
        name: form.name,
        tradingGoal: form.tradingGoal,
      });
      updateUser({ name: updated.name });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (pwForm.next.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(pwForm.current, pwForm.next);
      toast.success("Password changed");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePortfolio = async () => {
    setSaving(true);
    try {
      await updateProfileAPI({ riskTolerance });
      toast.success("Portfolio preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    // Stored locally — no backend field yet
    localStorage.setItem("nepsesage_notif", JSON.stringify(notifPrefs));
    toast.success("Notification preferences saved");
  };

  const handleExportData = () => {
    const payload = {
      user: { name: user?.name, email: user?.email },
      exportedAt: new Date().toISOString(),
      note: "Full data export — contact support for complete dataset.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nepsesage-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== user?.email) {
      toast.error("Email doesn't match — account not deleted");
      return;
    }
    toast.error(
      "Account deletion requested — contact support@nepsesage.com to complete."
    );
    setDeleteConfirm("");
  };

  const toggleSector = (s: string) =>
    setSelectedSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // ── Reusable sub-components ────────────────────────────────────────────────
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="clinical-label mb-4 text-sm">{children}</h2>
  );

  const SaveBar = ({
    onSave,
    onDiscard,
  }: {
    onSave: () => void;
    onDiscard?: () => void;
  }) => (
    <div className="flex justify-end gap-3 border-t border-border pt-6">
      {onDiscard && (
        <button
          className="rounded-md border border-border px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          onClick={onDiscard}
        >
          Discard
        </button>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );

  return (
    <AuthGuard
      featureName="Settings"
      featureDesc="Manage your clinical analysis workspace. Sign in to customize your NepseSage experience."
    >
      <div className="mx-auto max-w-3xl w-full">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, portfolio preferences, and workspace.
        </p>

        <div className="mt-6">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-border pb-4 gap-1 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 whitespace-nowrap text-sm transition ${
                  activeTab === tab.label
                    ? "bg-secondary text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-8">
            {/* ── ACCOUNT ─────────────────────────────────────────────────── */}
            {activeTab === "Account" && (
              <>
                <section>
                  <SectionTitle>Profile Information</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="clinical-label mb-2 block">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="clinical-label mb-2 block">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className={`${inputCls} opacity-60 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="clinical-label mb-2 block">Trading Goal</label>
                    <textarea
                      value={form.tradingGoal}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tradingGoal: e.target.value }))
                      }
                      rows={2}
                      placeholder="e.g. Long-term wealth building through NEPSE dividend stocks"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>Change Password</SectionTitle>
                  <div className="space-y-3 max-w-sm">
                    {(["current", "next", "confirm"] as const).map((k) => (
                      <input
                        key={k}
                        type="password"
                        placeholder={
                          k === "current"
                            ? "Current password"
                            : k === "next"
                            ? "New password"
                            : "Confirm new password"
                        }
                        value={pwForm[k]}
                        onChange={(e) =>
                          setPwForm((p) => ({ ...p, [k]: e.target.value }))
                        }
                        className={inputCls}
                      />
                    ))}
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="rounded-md bg-secondary px-5 py-2 text-sm text-foreground hover:bg-secondary/80 transition"
                    >
                      Change Password
                    </button>
                  </div>
                </section>

                <SaveBar
                  onSave={handleSaveProfile}
                  onDiscard={() =>
                    setForm({
                      name: user?.name ?? "",
                      email: user?.email ?? "",
                      tradingGoal: "",
                    })
                  }
                />
              </>
            )}

            {/* ── PORTFOLIO ───────────────────────────────────────────────── */}
            {activeTab === "Portfolio" && (
              <>
                <section>
                  <SectionTitle>Risk Tolerance</SectionTitle>
                  <p className="text-xs text-muted-foreground mb-4">
                    This affects Sage AI's recommendations and portfolio risk scoring.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          value: "conservative",
                          label: "Conservative",
                          desc: "Capital preservation, dividends",
                          color: "text-blue-500",
                        },
                        {
                          value: "moderate",
                          label: "Moderate",
                          desc: "Balanced growth & safety",
                          color: "text-yellow-500",
                        },
                        {
                          value: "aggressive",
                          label: "Aggressive",
                          desc: "High growth, accepts volatility",
                          color: "text-red-500",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRiskTolerance(opt.value)}
                        className={`rounded-lg border p-4 text-left transition ${
                          riskTolerance === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${opt.color}`}>
                          {opt.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Default Portfolio View</SectionTitle>
                  <div className="flex gap-2">
                    {["Holdings", "Transactions", "Analytics"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setDefaultView(v)}
                        className={`rounded-md px-4 py-2 text-sm transition ${
                          defaultView === v
                            ? "bg-secondary text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Sector Interests</SectionTitle>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sage AI will prioritise insights from your selected sectors.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSector(s)}
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          selectedSectors.includes(s)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </section>

                <SaveBar onSave={handleSavePortfolio} />
              </>
            )}

            {/* ── NOTIFICATIONS ───────────────────────────────────────────── */}
            {activeTab === "Notifications" && (
              <>
                <section>
                  <SectionTitle>Market Alerts</SectionTitle>
                  <div className="space-y-4">
                    {(
                      [
                        {
                          key: "priceAlerts",
                          label: "Price Alerts",
                          desc: "Get notified when watchlist stocks hit your target prices",
                        },
                        {
                          key: "marketOpen",
                          label: "Market Open Reminder",
                          desc: "Daily reminder when NEPSE opens at 11:00 AM",
                        },
                        {
                          key: "marketClose",
                          label: "Market Close Summary",
                          desc: "End-of-day summary of your portfolio performance",
                        },
                      ] as const
                    ).map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Toggle
                          checked={notifPrefs[key]}
                          onChange={() =>
                            setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Insights & Coaching</SectionTitle>
                  <div className="space-y-4">
                    {(
                      [
                        {
                          key: "portfolioSummary",
                          label: "Weekly Portfolio Summary",
                          desc: "Sage AI digest of your portfolio health every Sunday",
                        },
                        {
                          key: "newsDigest",
                          label: "NEPSE News Digest",
                          desc: "Morning briefing of relevant market news",
                        },
                        {
                          key: "disciplineNudges",
                          label: "Discipline Nudges",
                          desc: "Reminders to log trades and maintain your journal streak",
                        },
                      ] as const
                    ).map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Toggle
                          checked={notifPrefs[key]}
                          onChange={() =>
                            setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <SaveBar onSave={handleSaveNotifications} />
              </>
            )}

            {/* ── APPEARANCE ──────────────────────────────────────────────── */}
            {activeTab === "Appearance" && mounted && (
              <>
                <section>
                  <SectionTitle>Theme</SectionTitle>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "light", label: "Light", Icon: Sun },
                        { value: "dark", label: "Dark", Icon: Moon },
                        { value: "system", label: "System", Icon: Monitor },
                      ] as const
                    ).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                          theme === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Text Size</SectionTitle>
                  <div className="flex gap-2">
                    {(["small", "medium", "large"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`rounded-md px-4 py-2 text-sm capitalize transition ${
                          fontSize === s
                            ? "bg-secondary text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Accessibility</SectionTitle>
                  <div className="space-y-4">
                    {(
                      [
                        {
                          key: "compactMode",
                          val: compactMode,
                          set: setCompactMode,
                          label: "Compact Mode",
                          desc: "Reduce padding and card sizes for denser data display",
                        },
                        {
                          key: "colorBlindMode",
                          val: colorBlindMode,
                          set: setColorBlindMode,
                          label: "Colour-Blind Friendly Mode",
                          desc: "Replace red/green indicators with patterns and shapes",
                        },
                      ] as const
                    ).map(({ key, val, set, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <Toggle checked={val} onChange={() => set((p) => !p)} />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ── PRIVACY ─────────────────────────────────────────────────── */}
            {activeTab === "Privacy" && (
              <>
                <section>
                  <SectionTitle>Data & Privacy</SectionTitle>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-4 flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Your data stays yours</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          NepseSage does not sell your data to third parties. Your trading
                          journal, portfolio, and watchlist are private by default.
                        </p>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                    >
                      <span className="text-sm">Privacy Policy</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                    >
                      <span className="text-sm">Terms of Service</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </section>

                <section>
                  <SectionTitle>Export Your Data</SectionTitle>
                  <p className="text-xs text-muted-foreground mb-3">
                    Download a copy of your account data, journal entries, and portfolio history.
                  </p>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:bg-secondary/50 transition"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </button>
                </section>

                <section>
                  <SectionTitle>Danger Zone</SectionTitle>
                  <div className="rounded-lg border border-destructive/40 p-4 space-y-3">
                    <p className="text-sm text-destructive font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      This will permanently delete your account, portfolio, journal, and all
                      associated data. This action cannot be undone.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Type your email <span className="font-mono text-foreground">{user?.email}</span> to confirm:
                    </p>
                    <input
                      type="email"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={user?.email}
                      className={inputCls}
                    />
                    <button
                      onClick={handleDeleteAccount}
                      className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-5 py-2 text-sm text-destructive hover:bg-destructive/20 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete My Account
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* ── BILLING ─────────────────────────────────────────────────── */}
            {activeTab === "Billing" && (
              <>
                {/* ── Current Plan ── */}
                <section>
                  <SectionTitle>Current Plan</SectionTitle>
                  {user?.plan === "pro" ? (
                    /* PRO plan card */
                    <div className="rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-amber-400/5 p-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-amber-500">Pro Plan</p>
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-500 font-medium border border-amber-400/30">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlimited Sage AI queries, advanced technical analysis, floorsheet data,
                          priority support, and early access to new features.
                        </p>
                        {user?.planExpiresAt && (
                          <p className="text-xs text-amber-500/80 mt-2 font-medium">
                            Renews on{" "}
                            {new Date(user.planExpiresAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                        <ul className="mt-3 space-y-1">
                          {[
                            "Unlimited AI queries per day",
                            "Advanced technical indicators",
                            "Full floorsheet access",
                            "Portfolio PDF export",
                            "Priority email support",
                          ].map((f) => (
                            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="text-amber-500">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-amber-500">NPR 499</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                  ) : (
                    /* FREE plan card */
                    <div className="rounded-lg border border-border p-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold">Free Plan</p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Basic market data, portfolio tracking, and Sage AI (limited queries/day).
                        </p>
                      </div>
                      <p className="text-lg font-bold shrink-0">
                        NPR 0<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                  )}
                </section>

                {/* ── Upgrade section — only for free users ── */}
                {user?.plan !== "pro" && (
                  <section>
                    <SectionTitle>Upgrade to Pro</SectionTitle>
                    <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-primary">Pro Plan</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            Unlimited Sage AI queries, advanced technical analysis, floorsheet data,
                            priority support, and early access to new features.
                          </p>
                          <ul className="mt-3 space-y-1">
                            {[
                              "Unlimited AI queries per day",
                              "Advanced technical indicators",
                              "Full floorsheet access",
                              "Portfolio PDF export",
                              "Priority email support",
                            ].map((f) => (
                              <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="text-primary">✓</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">
                            NPR 499<span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </p>
                          <p className="text-xs text-muted-foreground">billed monthly</p>
                        </div>
                      </div>
                      <button className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
                        Upgrade to Pro
                      </button>
                    </div>
                  </section>
                )}

                {/* ── Cancel subscription — only for pro users ── */}
                {user?.plan === "pro" && (
                  <section>
                    <SectionTitle>Manage Subscription</SectionTitle>
                    <div className="rounded-lg border border-border p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Cancel Pro Subscription</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You'll keep Pro access until the end of your current billing period.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          toast.error(
                            "To cancel, email support@nepsesage.com — we'll process it within 24 hours."
                          )
                        }
                        className="shrink-0 rounded-md border border-destructive/40 px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition"
                      >
                        Cancel Plan
                      </button>
                    </div>
                  </section>
                )}

                {/* ── Billing History ── */}
                <section>
                  <SectionTitle>Billing History</SectionTitle>
                  <div className="rounded-lg border border-border p-6 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    {user?.plan === "pro" ? (
                      <>
                        <p className="text-sm text-muted-foreground">No invoices yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your first invoice will appear here after your next billing cycle.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">No billing history yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Invoices will appear here once you upgrade.
                        </p>
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
            {/* ── SUPPORT ─────────────────────────────────────────────────── */}
            {activeTab === "Support" && (
              <>
                <section>
                  <SectionTitle>Contact Support</SectionTitle>
                  <div className="space-y-3">
                    <a
                      href="mailto:support@nepsesage.com"
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                    >
                      <div>
                        <p className="text-sm font-medium">Email Support</p>
                        <p className="text-xs text-muted-foreground mt-0.5">support@nepsesage.com — we reply within 24 hours</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="https://discord.gg/nepsesage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                    >
                      <div>
                        <p className="text-sm font-medium">Community Discord</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Join our trading community for help and live discussion</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                    >
                      <div>
                        <p className="text-sm font-medium">Report a Bug</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Found something broken? Let us know and we'll fix it fast.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </section>

                <section>
                  <SectionTitle>Frequently Asked Questions</SectionTitle>
                  <div className="space-y-2">
                    {[
                      {
                        q: "How do I connect my NEPSE broker account?",
                        a: "Go to Portfolio → Add Holdings and enter your DMAT number. We sync data from MeroShare automatically.",
                      },
                      {
                        q: "How many Sage AI queries do I get on the Free plan?",
                        a: "Free users get 10 Sage AI queries per day. Upgrade to Pro for unlimited access with no daily cap.",
                      },
                      {
                        q: "Is my trading journal data private?",
                        a: "Yes. Your journal entries are fully private and never shared with third parties or used for advertising.",
                      },
                      {
                        q: "How do I cancel my Pro subscription?",
                        a: "Cancel anytime from Settings → Billing. Your Pro access continues until the end of the current billing period.",
                      },
                      {
                        q: "Does NepseSagework with all brokers?",
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
                </section>

                <section>
                  <SectionTitle>Resources</SectionTitle>
                  <div className="space-y-3">
                    {[
                      { label: "Documentation & User Guide", href: "#" },
                      { label: "What's New — Changelog", href: "#" },
                      { label: "Privacy Policy", href: "#" },
                      { label: "Terms of Service", href: "#" },
                    ].map(({ label, href }) => (
                      <a
                        key={label}
                        href={href}
                        className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/30 transition"
                      >
                        <span className="text-sm">{label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Need more power?</SectionTitle>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Upgrade to Pro</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unlimited AI, floorsheet access, advanced indicators and priority support.
                      </p>
                    </div>
                    <Link
                      href="/upgrade"
                      className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                    >
                      View Plans
                    </Link>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

"use client";

import { User, Wallet, Bell, Palette, Lock, CreditCard } from "lucide-react";
import { useState } from "react";
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
];

export default function SettingsClient() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Account");
  const [saving, setSaving] = useState(false);

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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateProfile({ name: form.name, tradingGoal: form.tradingGoal });
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard
      featureName="Settings"
      featureDesc="Manage your clinical analysis workspace. Sign in to customize your NEPSE Sage AI experience."
    >
      <div className="mx-auto max-w-3xl w-full">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your clinical analysis workspace and account preferences.
        </p>

        <div className="mt-6">
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
            {activeTab === "Account" && (
              <>
                <section>
                  <h2 className="clinical-label mb-4 text-sm">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="clinical-label mb-2 block">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="clinical-label mb-2 block">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm text-muted-foreground opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="clinical-label mb-2 block">Trading Goal</label>
                    <textarea
                      value={form.tradingGoal}
                      onChange={(e) => setForm((p) => ({ ...p, tradingGoal: e.target.value }))}
                      rows={2}
                      placeholder="e.g. Long-term wealth building through NEPSE dividend stocks"
                      className="w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </section>

                <section>
                  <h2 className="clinical-label mb-4 text-sm">Change Password</h2>
                  <div className="space-y-3 max-w-sm">
                    {(["current", "next", "confirm"] as const).map((k) => (
                      <input
                        key={k}
                        type="password"
                        placeholder={k === "current" ? "Current password" : k === "next" ? "New password" : "Confirm new password"}
                        value={pwForm[k]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [k]: e.target.value }))}
                        className="w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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

                <div className="flex justify-end gap-3 border-t border-border pt-6">
                  <button
                    className="rounded-md border border-border px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                    onClick={() => setForm({ name: user?.name ?? "", email: user?.email ?? "", tradingGoal: "" })}
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Settings"}
                  </button>
                </div>
              </>
            )}

            {activeTab !== "Account" && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {activeTab} settings coming soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

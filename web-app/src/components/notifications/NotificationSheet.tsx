"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, PartyPopper, HandMetal, Sparkles, Gift,
  BookOpen, Bot, LineChart, ChevronRight, X,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifCard {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  action?: { label: string; href: string };
}

// ─── Static card definitions ──────────────────────────────────────────────────

function getCards(isNew: boolean, name: string): NotifCard[] {
  const firstName = name?.split(" ")[0] || "there";

  const welcome: NotifCard = isNew
    ? {
        id: "welcome-new",
        icon: PartyPopper,
        iconBg: "bg-primary/15",
        iconColor: "text-primary",
        title: `Welcome to NepseSage, ${firstName}! 🎉`,
        desc: "You're all set. Start by adding stocks to your watchlist, exploring insights, or running a paper trade in the Simulator.",
        badge: "New Member",
        badgeColor: "bg-primary/10 text-primary",
        action: { label: "Set up your watchlist", href: "/" },
      }
    : {
        id: "welcome-back",
        icon: HandMetal,
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-500",
        title: `Welcome back, ${firstName}!`,
        desc: "The market has been moving. Check today's top gainers and losers, or pick up where you left off in your journal.",
        action: { label: "Go to Dashboard", href: "/" },
      };

  const offers: NotifCard[] = [
    {
      id: "offer-ai",
      icon: Bot,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
      title: "Meet Sage AI — Your Market Analyst",
      desc: "Ask anything about NEPSE stocks. Get AI-powered analysis, sector breakdowns, and trade ideas in seconds.",
      badge: "Try it free",
      badgeColor: "bg-violet-500/10 text-violet-500",
      action: { label: "Open Sage AI", href: "/sage-ai" },
    },
    {
      id: "offer-simulator",
      icon: LineChart,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      title: "Practice Trading, Zero Risk",
      desc: "Use the Simulator to test your strategies with real NEPSE data — no real money involved.",
      action: { label: "Open Simulator", href: "/simulator" },
    },
    {
      id: "offer-journal",
      icon: BookOpen,
      iconBg: "bg-sky-500/15",
      iconColor: "text-sky-500",
      title: "Track Your Discipline Score",
      desc: "Log your trades in the Journal and let the Behavioral Engine score your consistency and risk habits.",
      action: { label: "Open Journal", href: "/journal" },
    },
    {
      id: "offer-insights",
      icon: Sparkles,
      iconBg: "bg-pink-500/15",
      iconColor: "text-pink-500",
      title: "Community Insights",
      desc: "See what other NEPSE investors are saying. Share your own thesis and get feedback from the community.",
      badge: "Community",
      badgeColor: "bg-pink-500/10 text-pink-500",
      action: { label: "Browse Insights", href: "/insights" },
    },
    {
      id: "offer-pro",
      icon: Gift,
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-500",
      title: "Upgrade to Pro — Coming Soon",
      desc: "Advanced screeners, price alerts, and unlimited AI queries are on the way. Stay tuned for early access.",
      badge: "Coming Soon",
      badgeColor: "bg-orange-500/10 text-orange-500",
    },
  ];

  return [welcome, ...offers];
}

// ─── Single card ──────────────────────────────────────────────────────────────

function NotifCard({
  card,
  onDismiss,
}: {
  card: NotifCard;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const Icon = card.icon;

  return (
    <div className="group px-5 py-4 border-b border-border/40 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${card.iconBg}`}>
          <Icon className={`h-4 w-4 ${card.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {card.title}
            </p>
            <button
              onClick={() => onDismiss(card.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {card.badge && (
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
              {card.badge}
            </span>
          )}

          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {card.desc}
          </p>

          {card.action && (
            <button
              onClick={() => router.push(card.action!.href)}
              className="flex items-center gap-0.5 mt-2.5 text-[11px] font-semibold text-primary hover:underline"
            >
              {card.action.label}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationSheet() {
  const { user, isGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const isNew = false;
  const name = user?.name ?? "Investor";

  const allCards = getCards(isNew, name);
  const visible = allCards.filter((c) => !dismissed.has(c.id));
  const count = visible.length;

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <Sheet modal={false} open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-base font-bold font-heading">
              Notifications
            </SheetTitle>
            {count > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold text-primary bg-primary/10 border-0 px-2 py-0.5 rounded-full"
              >
                {count}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">All cleared!</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You've dismissed everything. More updates will appear here soon.
              </p>
            </div>
          ) : (
            visible.map((card) => (
              <NotifCard key={card.id} card={card} onDismiss={dismiss} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 pt-3 pb-4">
          {isGuest && (
            <p className="text-[11px] text-center text-muted-foreground mb-3">
              <a href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </a>{" "}
              to get personalised notifications.
            </p>
          )}
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2.5 text-sm font-medium text-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

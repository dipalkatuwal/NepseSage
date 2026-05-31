import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Bot,
  LineChart,
  Trophy,
  TrendingUp,
} from "lucide-react";

export type NavAccess = "public" | "user" | "pro";

export interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  access: NavAccess;
}

export const navItems: NavItem[] = [
  { label: "Market",      icon: TrendingUp,      to: "/market",     access: "public" },
  { label: "Dashboard",   icon: LayoutDashboard, to: "/",           access: "user"   },
  { label: "Insights",    icon: Sparkles,        to: "/insights",   access: "user"   },
  { label: "Journal",     icon: BookOpen,        to: "/journal",    access: "user"   },
  { label: "Leaderboard", icon: Trophy,          to: "/leaderboard",access: "user"   },
  { label: "Sage AI",     icon: Bot,             to: "/sage-ai",    access: "pro"    },
  { label: "Simulator",   icon: LineChart,       to: "/simulator",  access: "pro"    },
];
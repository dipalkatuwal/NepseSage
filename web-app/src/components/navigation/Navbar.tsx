"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Sun,
  Moon,
  User,
  Settings,
  Zap,
  LogOut,
  Crown,
  ChevronRight,
  Shield,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationSheet } from "@/components/notifications/NotificationSheet";

function ProExpiryLabel({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft <= 0) return null;
  return (
    <p className="text-[10px] leading-none text-amber-500/80 font-medium mt-0.5">
      {daysLeft <= 7
        ? `Expires in ${daysLeft}d`
        : `Pro until ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
    </p>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const isPro = user?.plan === "pro";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-sm transition-all duration-300">
      <div
        className={`flex items-center gap-2 md:gap-4 ${isSearchExpanded ? "flex-1" : ""}`}
      >
        {!isSearchExpanded && <SidebarTrigger className="lg:hidden" />}
        {!isSearchExpanded && (
          <Link
            href={isAuthenticated ? "/" : "/market"}
            className="font-heading text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            NepseSage
          </Link>
        )}
        <GlobalSearch onExpandChange={setIsSearchExpanded} />
      </div>

      {!isSearchExpanded && (
        <div className="flex items-center gap-1 md:gap-2">
         

          <div className="ml-2 flex items-center gap-1 md:gap-3">
            {!isLoading && isAuthenticated && <NotificationSheet />}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {isLoading ? (
              <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary/30 animate-spin ml-1" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`relative h-8 w-8 rounded-full ml-1 p-0 border transition-colors ${
                      isPro
                        ? "border-amber-400/60 hover:border-amber-400"
                        : "border-primary/20"
                    }`}
                  >
                    <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                      <AvatarFallback
                        className={`text-[10px] font-bold ${
                          isPro
                            ? "bg-amber-400/15 text-amber-500"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {user?.avatarInitials || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Crown dot for Pro users */}
                    {isPro && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 ring-1 ring-background">
                        <Crown className="h-1.5 w-1.5 text-amber-900" />
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-60" align="end" forceMount>
                  {/* ── Profile header ── */}
                  <DropdownMenuLabel className="font-normal p-0">
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-t-md ${
                        isPro
                          ? "bg-gradient-to-r from-amber-500/10 to-amber-400/5"
                          : "bg-muted/40"
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback
                          className={`text-xs font-bold ${
                            isPro
                              ? "bg-amber-400/20 text-amber-500"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {user?.avatarInitials || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold leading-none font-heading truncate">
                            {user?.name}
                          </p>
                          {isPro && (
                            <Badge className="h-4 px-1 text-[9px] font-bold bg-amber-400/20 text-amber-500 border-amber-400/30 hover:bg-amber-400/20 shrink-0">
                              <Crown className="h-2 w-2 mr-0.5" />
                              PRO
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                          {user?.email}
                        </p>
                        <ProExpiryLabel expiresAt={(user as any)?.planExpiresAt} />
                      </div>
                    </div>

                    {/* Pro status bar */}
                    {isPro && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/8 border-b border-amber-400/15">
                        <Shield className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-amber-500 tracking-wide uppercase">
                          Pro Member — All features unlocked
                        </span>
                      </div>
                    )}
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="mt-0" />

                  {/* ── Nav items — each goes to its own tab ── */}
                  <DropdownMenuGroup>
                    {/* My Profile → Settings > Account tab */}
                    <DropdownMenuItem
                      onClick={() => router.push("/settings?tab=Account")}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>

                    {/* Settings → Settings > Notifications tab (a sensible "general settings" landing) */}
                    <DropdownMenuItem
                      onClick={() => router.push("/settings?tab=Notifications")}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  {/* ── Plan section ── */}
                  <DropdownMenuSeparator />
                  {isPro ? (
                    // Pro users → Billing tab to manage subscription
                    <DropdownMenuItem
                      onClick={() => router.push("/settings?tab=Billing")}
                      className="cursor-pointer focus:bg-amber-400/10"
                    >
                      <CreditCard className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-amber-500 font-semibold">
                          Manage Pro Plan
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Billing, invoices & renewal
                        </span>
                      </div>
                      <ChevronRight className="ml-auto h-3 w-3 text-amber-500 opacity-60" />
                    </DropdownMenuItem>
                  ) : (
                    // Free users → /upgrade page
                    <DropdownMenuItem
                      onClick={() => router.push("/upgrade")}
                      className="cursor-pointer group focus:bg-amber-400/10"
                    >
                      <Zap className="mr-2 h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span className="text-amber-500 font-semibold text-xs">
                          Upgrade to Pro
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Unlock AI insights &amp; more
                        </span>
                      </div>
                      <ChevronRight className="ml-auto h-3 w-3 text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link href="/login" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold hover:bg-accent h-8"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

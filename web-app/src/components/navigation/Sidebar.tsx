"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Zap, HelpCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { navItems } from "./nav-data";

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { isAuthenticated, user } = useAuth();

  const isPro = user?.plan === "pro";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between px-4">
        {state === "expanded" && (
          <div className="flex flex-col">
            <h1 className="font-heading text-lg font-bold text-primary">
              NepseSage
            </h1>
            
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              pathname === item.to ||
              (item.to !== "/" && pathname.startsWith(item.to));

            // Determine lock state
            const isUserLocked = !isAuthenticated && item.access !== "public";
            const isProLocked  = isAuthenticated && !isPro && item.access === "pro";
            const isLocked     = isUserLocked || isProLocked;

            // Which badge to show
            const LockBadge = isProLocked
              ? () => <Zap className="h-3 w-3 text-amber-400/70" />
              : () => <Lock className="h-3 w-3 text-muted-foreground/50" />;

            // Where to navigate on click:
            // - unauthenticated + restricted → /login
            // - free user + pro item → the actual page (which shows ProGate)
            // - unlocked → item's own route
            const href = isUserLocked ? "/login" : item.to;

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={
                    isProLocked
                      ? `${item.label} — Pro feature`
                      : isUserLocked
                      ? `${item.label} — Sign in required`
                      : item.label
                  }
                  className={`nav-item ${isActive ? "nav-item-active" : ""} border-none h-10 ${
                    isLocked ? "opacity-50" : ""
                  }`}
                >
                  <Link href={href} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isLocked && <LockBadge />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {state === "expanded" && !isPro && (
          <div className="card-clinical mb-3 p-3">
            <p className="clinical-label mb-2">
              {isAuthenticated ? "Sage Insight" : "Pro Account"}
            </p>
            <Link href="/upgrade">
              <Button variant="clinical" size="sm" className="w-full">
                <Zap className="mr-1.5 h-3 w-3" />
                {isAuthenticated ? "Upgrade to Pro" : "Get Pro Access"}
              </Button>
            </Link>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support" className="nav-item border-none h-10">
              <Link href="/settings?tab=Support" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

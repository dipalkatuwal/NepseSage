"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Zap, HelpCircle, LogOut } from "lucide-react";
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
  const { isAuthenticated, isGuest, logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between px-4">
        {state === "expanded" && (
          <div className="flex flex-col">
            <h1 className="font-heading text-lg font-bold text-primary">
              NEPSE Sage
            </h1>
            <p className="clinical-label mt-0.5" style={{ fontSize: "0.6rem" }}>
              Clinical Analyst
            </p>
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

            // Lock everything for guests since they only access /market (Top Nav)
            const isLocked = isGuest || (!isAuthenticated && ["/journal", "/sage-ai", "/simulator", "/settings"].includes(item.to));
            const showLock = isLocked;

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={`nav-item ${isActive ? "nav-item-active" : ""} border-none h-10 ${isLocked ? "opacity-50 grayscale pointer-events-none" : ""}`}
                >
                  {isLocked ? (
                    <div className="flex items-center justify-between w-full px-2">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <Lock className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                  ) : (
                    <Link href={item.to} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {state === "expanded" && (
          <div className="card-clinical mb-3 p-3">
            <p className="clinical-label mb-2">{isAuthenticated ? "Sage Insight" : "Pro Account"}</p>
            <Button variant="clinical" size="sm" className="w-full">
              <Zap className="mr-1.5 h-3 w-3" />
              {isAuthenticated ? "Upgrade Plan" : "Upgrade to Pro"}
            </Button>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Support" className="nav-item border-none h-10">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAuthenticated && (
            <SidebarMenuItem>

            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

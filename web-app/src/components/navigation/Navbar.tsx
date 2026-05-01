"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Sun, Moon, Users, Settings, Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-sm transition-all duration-300">
      <div className={`flex items-center gap-2 md:gap-4 ${isSearchExpanded ? "flex-1" : ""}`}>
        {!isSearchExpanded && <SidebarTrigger className="lg:hidden" />}
        {!isSearchExpanded && (
          <span className="hidden font-heading text-sm font-semibold text-muted-foreground sm:inline-block">
            NEPSE Sage AI
          </span>
        )}

        <GlobalSearch onExpandChange={setIsSearchExpanded} />
      </div>

      {!isSearchExpanded && (
        <div className="flex items-center gap-1 md:gap-2">
          <nav className="hidden items-center gap-1 xl:flex">
            <Link
              href="/market"
              className={`rounded px-3 py-1.5 text-xs font-medium transition hover:text-foreground ${pathname === "/market" ? "text-primary" : "text-muted-foreground"}`}
            >
              Market
            </Link>


          </nav>

          <div className="ml-2 flex items-center gap-1 md:gap-3">
            {!isLoading && isAuthenticated && <NotificationSheet />}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isLoading ? (
              <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary/30 animate-spin ml-1" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 border border-primary/20 p-0">
                    <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {user?.avatarInitials || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none font-heading">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Zap className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-primary font-semibold">Pro Plan</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-accent h-8">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-8">
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

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { useAuth } from "@/context/AuthContext";
import { UpgradeNudge } from "@/components/shared/UpgradeNudge";

// Routes accessible to everyone — no account needed
const PUBLIC_ROUTES = ["/market", "/sectors", "/companies", "/upgrade"];

function isPublic(pathname: string) {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/companyDetails")
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const pub = isPublic(pathname);

    // Unauthenticated non-guest on a protected route -> login
    if (!isAuthenticated && !isGuest && !pub) {
      router.push("/market");
      return;
    }

    // Guest on a protected route -> market
    if (isGuest && !pub) {
      router.push("/market");
    }
  }, [mounted, isLoading, isAuthenticated, isGuest, pathname, router]);

  if (!mounted || isLoading) return null;

  // Block render (not just redirect) for non-public protected routes
  if (!isAuthenticated && !isGuest && !isPublic(pathname)) return null;

  return (
    <SidebarProvider>
      <UpgradeNudge />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />

          <main className={`flex-1 ${pathname === "/sage-ai" ? "overflow-hidden p-0" : "overflow-y-auto p-4 md:p-6"}`}>
            {pathname === "/sage-ai"
              ? children
              : <div className="mx-auto max-w-7xl">{children}</div>}
          </main>

          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

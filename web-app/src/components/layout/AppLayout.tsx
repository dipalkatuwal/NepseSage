"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { useAuth } from "@/context/AuthContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isGuest, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect dashboard routes
  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!isAuthenticated && !isGuest) {
      // Not logged in and not a guest -> login
      router.push("/login");
    } else if (isGuest && pathname !== "/market") {
      // Guest can ONLY see /market
      router.push("/market");
    }
  }, [mounted, isLoading, isAuthenticated, isGuest, pathname, router]);

  if (!mounted || isLoading) {
    return null;
  }

  if (!isAuthenticated && !isGuest) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />

          <main className={`flex-1 ${pathname === "/sage-ai" ? "overflow-hidden p-0" : "overflow-y-auto p-4 md:p-6"}`}>
            {pathname === "/sage-ai" ? children : <div className="mx-auto max-w-7xl">{children}</div>}
          </main>

          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

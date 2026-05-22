"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authAPI, type BackendUser } from "@/lib/services";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  plan: "free" | "pro";
  joinedAt: string;
  disciplineScore?: number;
  riskTolerance?: string;
  watchlist?: string[];
  profile?: {
    experience: "beginner" | "intermediate" | "expert";
    sectors: string[];
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateProfileAPI: (updates: {
    name?: string;
    tradingGoal?: string;
    riskTolerance?: string;
    watchlist?: string[];
  }) => Promise<void>;
  upgradeToPro: (billingCycle: "monthly" | "yearly") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "nepsesage_token";
const SESSION_KEY = "nepsesage_auth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function mapBackendUser(data: BackendUser): AuthUser {
  return {
    id: data._id,
    name: data.name,
    email: data.email,
    avatarInitials: getInitials(data.name),
    plan: "free",
    joinedAt: new Date().toISOString(),
    disciplineScore: data.disciplineScore,
    riskTolerance: data.riskTolerance,
    watchlist: data.watchlist || [],
  };
}

function loadSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session: validate token with backend on mount
  useEffect(() => {
    const session = loadSession();
    if (session?.email === "guest@nepsesage.com") {
      setUser(session);
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;

    if (!token) {
      // No token at all — clear any stale session data and mark as loaded
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_KEY);
      }
      setUser(null);
      setIsGuest(false);
      setIsLoading(false);
      return;
    }

    // Token exists — verify it with the backend
    authAPI.getMe()
      .then((data) => {
        const authUser = mapBackendUser(data);
        saveSession(authUser);
        setUser(authUser);
        setIsGuest(false);
      })
      .catch(() => {
        // Token is invalid/expired — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const data = await authAPI.login(email, password);
        // Store JWT
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        const authUser = mapBackendUser(data);
        saveSession(authUser);
        setUser(authUser);
        setIsGuest(false);
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Login failed. Please try again.";
        return { success: false, error: msg };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const data = await authAPI.register(name, email, password);
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        const authUser = mapBackendUser(data);
        saveSession(authUser);
        setUser(authUser);
        setIsGuest(false);
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Sign up failed. Please try again.";
        return { success: false, error: msg };
      }
    },
    []
  );

  const loginAsGuest = useCallback(() => {
    const guestUser: AuthUser = {
      id: "guest",
      name: "Guest User",
      email: "guest@nepsesage.com",
      avatarInitials: "GU",
      plan: "free",
      joinedAt: new Date().toISOString(),
      watchlist: [],
    };
    saveSession(guestUser);
    setUser(guestUser);
    setIsGuest(true);
    router.push("/market");
  }, [router]);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
    setIsGuest(false);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback(
    (updates: Partial<AuthUser>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      saveSession(updated);
      setUser(updated);
    },
    [user]
  );

  const updateProfileAPI = useCallback(
    async (updates: {
      name?: string;
      tradingGoal?: string;
      riskTolerance?: string;
      watchlist?: string[];
    }) => {
      if (!user) throw new Error("Authentication required");
      try {
        const data = await authAPI.updateProfile(updates);
        const authUser = { ...user, ...mapBackendUser(data) };
        saveSession(authUser);
        setUser(authUser);
      } catch (err) {
        console.error("Failed to update profile", err);
        throw err;
      }
    },
    [user]
  );

  const upgradeToPro = useCallback(
    async (billingCycle: "monthly" | "yearly") => {
      if (!user) throw new Error("Authentication required");
      const data = await authAPI.upgradeToPro(billingCycle);
      const updated = { ...user, plan: "pro" as const };
      saveSession(updated);
      setUser(updated);
      return data;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !isGuest,
        isGuest,
        isLoading,
        login,
        signup,
        loginAsGuest,
        logout,
        updateUser,
        updateProfileAPI,
        upgradeToPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

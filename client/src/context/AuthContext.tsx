"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  loginApi,
  logoutApi,
  refreshSessionApi,
  AuthUser,
} from "@/services/authService";
import { setAccessToken } from "@/lib/axios";
import { UserRole } from "@/types/common";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true only during initial session restore
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileStatus: (complete: boolean) => void;
  updateUserName: (firstName: string, lastName: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Role Cookie helpers ──────────────────────────────────────────────────────
// The role cookie is JS-accessible — used exclusively for Next.js middleware
// to perform server-side role-based redirects. NOT used for security.

function setRoleCookie(role: UserRole) {
  if (typeof document !== "undefined") {
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

function clearRoleCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "role=; path=/; max-age=0; SameSite=Lax";
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true — restore session on mount
  const hasRestoredSession = useRef(false);

  // ── Session restore on app boot ──────────────────────────────────────────
  // Silently call /api/auth/refresh-token — the httpOnly refreshToken cookie
  // is sent automatically. If valid, we get a new accessToken + user back.
  useEffect(() => {
    if (hasRestoredSession.current) return;
    hasRestoredSession.current = true;

    const restoreSession = async () => {
      try {
        const { accessToken, user: restoredUser } = await refreshSessionApi();
        setAccessToken(accessToken);
        setUser(restoredUser);
        setRoleCookie(restoredUser.role);
      } catch {
        // No valid session — user needs to log in
        setAccessToken(null);
        setUser(null);
        clearRoleCookie();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await loginApi(email, password);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    setRoleCookie(loggedInUser.role);
    // Show personalised welcome toast
    toast.success(`Welcome, ${loggedInUser.firstName}!`, {
      description: `Signed in as ${loggedInUser.role}`,
      duration: 3000,
    });
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      setAccessToken(null);
      setUser(null);
      clearRoleCookie();
    }
  }, []);

  // ── Profile status update ────────────────────────────────────────────────
  // Called after the patient/doctor completes their profile form
  const updateUserProfileStatus = useCallback((complete: boolean) => {
    setUser((prev) => (prev ? { ...prev, completeProfile: complete } : prev));
  }, []);

  const updateUserName = useCallback((firstName: string, lastName: string) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            firstName,
            lastName,
          }
        : prev,
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserProfileStatus,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

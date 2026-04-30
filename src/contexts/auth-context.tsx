"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getApiErrorMessage, setApiAuthToken, setApiUnauthorizedHandler } from "@/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth-storage";
import { getE164OptionsFromEnv, toE164Digits } from "@/lib/phone-e164";
import type { AuthResult, MemberProfile, UserSummary } from "@/types/member";

type RegisterPayload = {
  fullName: string;
  phoneNumber: string;
  password: string;
  email?: string;
};

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: UserSummary | null;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  error: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  clearError: () => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setMustChangePassword: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cm_last_login_at");
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapMemberToUser = useCallback((m: MemberProfile): UserSummary => ({
    id: m.id,
    fullName: m.fullName,
    phoneNumber: m.phoneNumber,
    roles: [...m.roles],
  }), []);

  const clearAuthState = useCallback(() => {
    clearStoredToken();
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const refreshMe = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setMustChangePassword(false);
      return;
    }
    setApiAuthToken(t);
    try {
      const { data } = await api.get<MemberProfile>("/api/members/me");
      setUser(mapMemberToUser(data));
      setMustChangePassword(data.mustChangePassword);
    } catch {
      clearAuthState();
      throw new Error("Session expired. Please login again.");
    }
  }, [clearAuthState, mapMemberToUser]);

  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      clearAuthState();
      setError("Session expired. Please login again.");
      setIsReady(true);
    });
    return () => setApiUnauthorizedHandler(null);
  }, [clearAuthState]);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      setApiAuthToken(null);
      setIsReady(true);
      return;
    }
    setToken(t);
    setApiAuthToken(t);
    (async () => {
      try {
        const { data } = await api.get<MemberProfile>("/api/members/me");
        setUser(mapMemberToUser(data));
        setMustChangePassword(data.mustChangePassword);
      } catch {
        clearAuthState();
      } finally {
        setIsReady(true);
      }
    })();
  }, [clearAuthState, mapMemberToUser]);

  const clearError = useCallback(() => setError(null), []);

  const applyAuthResult = useCallback((data: AuthResult) => {
    const nowIso = new Date().toISOString();
    localStorage.setItem("cm_last_login_at", nowIso);
    setLastLoginAt(nowIso);
    setStoredToken(data.accessToken);
    setApiAuthToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    setMustChangePassword(data.mustChangePassword);
  }, []);

  const login = useCallback(
    async (phoneNumber: string, password: string) => {
      setError(null);
      try {
        const trimmed = phoneNumber.trim();
        const e164 = toE164Digits(trimmed, getE164OptionsFromEnv());
        const phoneForApi = e164.ok ? e164.digits : trimmed;
        const { data } = await api.post<AuthResult>("/api/auth/login", {
          phoneNumber: phoneForApi,
          password,
        });
        applyAuthResult(data);
      } catch (e) {
        const message = getApiErrorMessage(e);
        setError(message);
        throw new Error(message);
      }
    },
    [applyAuthResult]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setError(null);
      try {
        const e164 = toE164Digits(
          payload.phoneNumber,
          getE164OptionsFromEnv()
        );
        if (!e164.ok) throw new Error(e164.error);
        const { data } = await api.post<AuthResult>("/api/auth/register", {
          fullName: payload.fullName.trim(),
          phoneNumber: e164.digits,
          password: payload.password,
          email: payload.email?.trim() || null,
        });
        applyAuthResult(data);
      } catch (e) {
        const message = getApiErrorMessage(e);
        setError(message);
        throw new Error(message);
      }
    },
    [applyAuthResult]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setError(null);
      try {
        const { data } = await api.post<AuthResult>("/api/auth/google", {
          idToken,
        });
        applyAuthResult(data);
      } catch (e) {
        const message = getApiErrorMessage(e);
        setError(message);
        throw new Error(message);
      }
    },
    [applyAuthResult]
  );

  const logout = useCallback(() => {
    clearAuthState();
    setLastLoginAt(null);
    setError(null);
    localStorage.removeItem("cm_last_login_at");
  }, [clearAuthState]);

  const value = useMemo(
    () => ({
      isReady,
      token,
      user,
      lastLoginAt,
      mustChangePassword,
      error,
      login,
      register,
      loginWithGoogle,
      clearError,
      logout,
      refreshMe,
      setMustChangePassword,
    }),
    [isReady, token, user, lastLoginAt, mustChangePassword, error, login, register, loginWithGoogle, clearError, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

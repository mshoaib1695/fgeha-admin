import type { AuthProvider } from "@refinedev/core";
import {
  API_URL,
  LAST_ACTIVITY_KEY,
  LOGOUT_EVENT_KEY,
  SESSION_START_KEY,
  TOKEN_KEY,
  USER_KEY,
} from "./constants";
import { getVToken } from "../lib/v";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  approvalStatus: string;
  profileImage?: string | null;
}

const clearSessionTracking = () => {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem(LOGOUT_EVENT_KEY);
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const v = getVToken();
    if (v) headers["X-V"] = v;
    const res = await fetch(`${API_URL}/auth/admin-login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.message ?? "Invalid email or password",
      };
    }
    const { access_token, user } = await res.json();
    if (user?.role !== "admin") {
      return {
        success: false,
        error: "Admin access only",
      };
    }
    const now = Date.now().toString();
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVITY_KEY, now);
    localStorage.setItem(SESSION_START_KEY, now);
    localStorage.removeItem(LOGOUT_EVENT_KEY);
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearSessionTracking();
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { authenticated: false, redirectTo: "/login", logout: true };
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const v = getVToken();
    if (v) headers["X-V"] = v;
    const res = await fetch(`${API_URL}/auth/me`, { headers });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      clearSessionTracking();
      return { authenticated: false, redirectTo: "/login", logout: true };
    }
    const user = await res.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { authenticated: true };
  },
  getIdentity: async () => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) return JSON.parse(stored) as AuthUser;
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const v = getVToken();
      if (v) headers["X-V"] = v;
      const res = await fetch(`${API_URL}/auth/me`, { headers });
      if (!res.ok) return null;
      const user = (await res.json()) as AuthUser;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },
  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true, redirectTo: "/login", error };
    }
    return {};
  },
};

import type { AuthProvider } from "@refinedev/core";
import { API_URL, TOKEN_KEY, USER_KEY } from "./constants";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  approvalStatus: string;
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { authenticated: false, redirectTo: "/login", logout: true };
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

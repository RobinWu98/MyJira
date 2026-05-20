import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMe, login as loginRequest } from "../api/auth";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken
} from "../api/client";
import type { Person } from "../types";

type AuthContextValue = {
  user: Person | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [user, setUser] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    const currentToken = getStoredAuthToken();

    if (!currentToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await fetchMe();
      setToken(currentToken);
      setUser(me);
    } catch {
      clearStoredAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  async function login(email: string, password: string) {
    const response = await loginRequest({ email, password });
    setStoredAuthToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function logout() {
    clearStoredAuthToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refreshUser
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

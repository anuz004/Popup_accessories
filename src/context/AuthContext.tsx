import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { requestApi } from "@/lib/api";

export interface UserSession { email: string; role: "admin" | "customer"; id?: string; name?: string }

interface AuthState {
  session: UserSession | null;
  isAdmin: boolean;
  googleEnabled: boolean;
  emailEnabled: boolean;
  loading: boolean;
  connectionError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([requestApi("/auth/session"), requestApi("/auth/config")]).then(([{ data, error }, config]) => {
      if (active) { setGoogleEnabled(Boolean(config.data?.googleEnabled)); setEmailEnabled(Boolean(config.data?.emailEnabled)); }
      if (!active) return;
      setSession(data?.user ?? null);
      setConnectionError(error?.message ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const signIn = async (email: string, password: string) => {
    const { data, error } = await requestApi("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    if (error) return { error: error.message };
    setSession(data.user);
    setConnectionError(null);
    return { error: null };
  };
  const signOut = async () => {
    const { error } = await requestApi("/auth/logout", { method: "POST" });
    if (error) { setConnectionError(error.message); return; }
    setSession(null);
  };
  return <AuthContext.Provider value={{ session, isAdmin: session?.role === "admin", googleEnabled, emailEnabled, loading, connectionError, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

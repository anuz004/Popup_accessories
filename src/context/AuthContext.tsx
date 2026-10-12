import { demoCredentials } from "@/lib/localDatabase";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, localDemoMode } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localDemoMode) {
      setIsAdmin(sessionStorage.getItem("grand-hour:demo-admin") === "true");
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const current = data.session;
      setSession(current);
      if (current) {
        const { data: allowed } = await supabase.rpc("is_admin");
        if (!active) return;
        setIsAdmin(Boolean(allowed));
      }
      setLoading(false);
    }).catch(() => {
      if (active) {
        setIsAdmin(false);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) setIsAdmin(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (localDemoMode) {
      if (email.trim().toLowerCase() !== demoCredentials.email || password !== demoCredentials.password)
        return { error: "Use the demo email and password shown above." };
      sessionStorage.setItem("grand-hour:demo-admin", "true");
      setIsAdmin(true);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const { data: allowed, error: permissionError } = await supabase.rpc("is_admin");
    if (permissionError || !allowed) {
      await supabase.auth.signOut();
      return { error: "This account does not have administrator access." };
    }
    setSession(data.session);
    setIsAdmin(true);
    return { error: null };
  };

  const signOut = async () => {
    if (localDemoMode) {
      sessionStorage.removeItem("grand-hour:demo-admin");
      setIsAdmin(false);
      return;
    }
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ session, isAdmin, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export type AuthProfile = {
  full_name: string;
  role_id: string;
  branch_id: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(userId: string | null) {
      if (!userId) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase.from("profiles").select("full_name, role_id, branch_id").eq("id", userId).maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        setProfile(null);
        return;
      }

      setProfile({
        full_name: data.full_name,
        role_id: data.role_id,
        branch_id: data.branch_id,
      });
    }

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setProfile(null);
      } else {
        setSession(data.session);
        await loadProfile(data.session?.user.id ?? null);
      }

      setIsLoading(false);
    }

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession?.user.id ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signInWithPassword(credentials: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword(credentials);

    return {
      error: error?.message ?? null,
    };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    return {
      error: error?.message ?? null,
    };
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      signInWithPassword,
      signOut,
    }),
    [isLoading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

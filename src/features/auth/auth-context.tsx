import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { isNetworkErrorMessage } from "../../lib/network-errors";

export type AuthProfile = {
  full_name: string;
  role_id: string;
  branch_id: string | null;
  must_change_password: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<AuthProfile | null>(null);

  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role_id, branch_id, must_change_password")
      .eq("id", userId)
      .maybeSingle();

    if (!mountedRef.current) {
      return;
    }

    if (error && isNetworkErrorMessage(error.message)) {
      return profileRef.current;
    }

    if (error || !data) {
      setProfile(null);
      profileRef.current = null;
      if (userId) {
        await supabase.auth.signOut({ scope: "local" });
      }
      return null;
    }

    const nextProfile: AuthProfile = {
      full_name: data.full_name,
      role_id: data.role_id,
      branch_id: data.branch_id,
      must_change_password: data.must_change_password,
    };

    setProfile(nextProfile);
    profileRef.current = nextProfile;
    return nextProfile;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mountedRef.current) {
          return;
        }

        if (error) {
          if (isNetworkErrorMessage(error.message)) {
            setSession((current) => current ?? data.session ?? sessionRef.current);
          } else {
            setSession(null);
            sessionRef.current = null;
            setProfile(null);
            profileRef.current = null;
            await supabase.auth.signOut({ scope: "local" });
          }
        } else {
          setSession(data.session);
          sessionRef.current = data.session;
          await loadProfile(data.session?.user.id ?? null);
        }
      } catch (error) {
        if (mountedRef.current) {
          const message = error instanceof Error ? error.message : String(error);

          if (!isNetworkErrorMessage(message)) {
            setSession(null);
            sessionRef.current = null;
            setProfile(null);
            profileRef.current = null;
            await supabase.auth.signOut({ scope: "local" });
          }
        }
      }

      if (mountedRef.current) {
        setIsLoading(false);
      }
    }

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      sessionRef.current = nextSession;
      void (async () => {
        await loadProfile(nextSession?.user.id ?? null);
      })();
    });

    return () => {
      mountedRef.current = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id ?? null);
  }, [loadProfile, session?.user.id]);

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
      refreshProfile,
      signInWithPassword,
      signOut,
    }),
    [isLoading, profile, refreshProfile, session],
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

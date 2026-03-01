import { createContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { AuthUser } from "../types";
import { RARITY_POINTS } from "../types";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("auth_id", authUser.id)
        .single();

      if (!profile) {
        setUser(null);
        return;
      }

      // Get badges grouped by season
      const { data: badges } = await supabase.rpc("get_my_badges");
      const badgeMap = (badges as Record<string, string[]>) || {};

      // Calculate total points
      const allBadges = Object.values(badgeMap).flat();
      const total_pts = allBadges.reduce(
        (sum, r) => sum + (RARITY_POINTS[r] || 0),
        0,
      );

      setUser({
        twitch_login: profile.username,
        twitch_display_name: profile.display_name || profile.username,
        twitch_profile_image: profile.avatar_url || "",
        badges: badgeMap,
        total_pts,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () => {
    supabase.auth.signInWithOAuth({
      provider: "twitch",
      options: { redirectTo: window.location.origin },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

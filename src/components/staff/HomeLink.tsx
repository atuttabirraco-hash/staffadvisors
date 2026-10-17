import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { homeDestination } from "@/lib/home-destination";

const HomeContext = createContext<{ business: boolean; loading: boolean }>({ business: false, loading: true });

export function useHomeNavigation() {
  return useContext(HomeContext);
}

export function HomeNavigationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedEvent = true;
      if (active) setUser(session?.user ?? null);
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active && !receivedEvent) setUser(data.user);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const businessHint = user?.user_metadata?.["account_type"] === "business";
  const membership = useQuery({
    queryKey: ["home-company-account", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from("company_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !businessHint,
  });
  return <HomeContext.Provider value={{
    business: businessHint || membership.data === true,
    loading: user === undefined || (!!user && !businessHint && membership.data === undefined),
  }}>{children}</HomeContext.Provider>;
}

export function HomeLink({ children, className, dir, "aria-label": ariaLabel, landing = false }: {
  children: ReactNode; className?: string; dir?: string; "aria-label"?: string; landing?: boolean;
}) {
  const to = landing ? "/" : homeDestination(false);
  return <Link to={to} className={className} dir={dir} aria-label={ariaLabel}>
    {children}
  </Link>;
}
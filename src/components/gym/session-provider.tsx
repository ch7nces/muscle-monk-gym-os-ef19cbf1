import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SessionContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setReady(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") sessionStorage.setItem("gym-password-recovery", "true");
      if (event === "SIGNED_OUT") sessionStorage.removeItem("gym-password-recovery");
      if (active) { setUser(session?.user ?? null); setReady(true); }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <SessionContext.Provider value={{ user, ready }}>{children}</SessionContext.Provider>;
}
export const useGymSession = () => useContext(SessionContext);
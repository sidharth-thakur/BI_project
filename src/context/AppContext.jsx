import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getSessionSync, hasRight, setSession } from "../services/userService";

const AppContext = createContext(null);

/* Fallback display user while userService resolves (SSR / first paint). */
export const currentUser = {
  name: "Vikas",
  fullName: "Vikas R",
  role: "Administrator",
  initials: "VR",
  rights: { po: "edit", quotations: "edit" },
};

export function AppProvider({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [user, setUser] = useState(() => getSessionSync() ?? currentUser);

  /* Switch the local session (demo account switch — no passwords). */
  const switchSession = useCallback(async (userId) => {
    const result = await setSession(userId);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  /* Module rights: hasRight(user, "po" | "quotations") → edit vs read. */
  const can = useCallback(
    (moduleKey) => hasRight(user, moduleKey),
    [user]
  );

  const value = useMemo(
    () => ({
      mobileNavOpen,
      openMobileNav: () => setMobileNavOpen(true),
      closeMobileNav: () => setMobileNavOpen(false),
      globalSearch,
      setGlobalSearch,
      user: user ?? currentUser,
      switchSession,
      can,
    }),
    [mobileNavOpen, globalSearch, user, switchSession, can]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

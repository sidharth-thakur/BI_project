import { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export const currentUser = {
  name: "Vikas",
  fullName: "Vikas R",
  role: "Administrator",
  initials: "VR",
};

export function AppProvider({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const value = useMemo(
    () => ({
      mobileNavOpen,
      openMobileNav: () => setMobileNavOpen(true),
      closeMobileNav: () => setMobileNavOpen(false),
      globalSearch,
      setGlobalSearch,
      user: currentUser,
    }),
    [mobileNavOpen, globalSearch]
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

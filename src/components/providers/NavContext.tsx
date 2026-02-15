"use client";

import { createContext, useContext, useState, useCallback } from "react";

type NavContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  openMenu: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  return (
    <NavContext.Provider value={{ menuOpen, setMenuOpen, openMenu }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  return ctx;
}

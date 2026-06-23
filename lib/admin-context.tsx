"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "np_admin_token";

type Snapshot = {
  token: string | null;
  // True once sessionStorage has been read, so guards don't redirect on the
  // first (empty) server-matched render.
  hydrated: boolean;
};

type AdminState = Snapshot & {
  setToken: (token: string) => void;
  clear: () => void;
};

const EMPTY: Snapshot = { token: null, hydrated: false };

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount (SSR-safe)
    setSnapshot({ token: sessionStorage.getItem(TOKEN_KEY), hydrated: true });
  }, []);

  const value = useMemo<AdminState>(
    () => ({
      ...snapshot,
      setToken(nextToken) {
        sessionStorage.setItem(TOKEN_KEY, nextToken);
        setSnapshot((prev) => ({ ...prev, token: nextToken }));
      },
      clear() {
        sessionStorage.removeItem(TOKEN_KEY);
        setSnapshot((prev) => ({ ...prev, token: null }));
      },
    }),
    [snapshot],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
}

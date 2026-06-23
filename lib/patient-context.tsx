"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TICKET_KEY = "np_patient_ticket";
const TOKEN_KEY = "np_patient_token";
const VISIT_KEY = "np_patient_visit";

export type PatientVisit = {
  roomNumber: string;
};

type Snapshot = {
  ticketNumber: string | null;
  token: string | null;
  visit: PatientVisit | null;
  // True once sessionStorage has been read, so guards don't redirect on the
  // first (empty) server-matched render.
  hydrated: boolean;
};

type PatientState = Snapshot & {
  setTicket: (ticketNumber: string, token: string) => void;
  setVisit: (visit: PatientVisit) => void;
  clear: () => void;
};

const EMPTY: Snapshot = {
  ticketNumber: null,
  token: null,
  visit: null,
  hydrated: false,
};

const PatientContext = createContext<PatientState | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);

  useEffect(() => {
    const raw = sessionStorage.getItem(VISIT_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount (SSR-safe)
    setSnapshot({
      ticketNumber: sessionStorage.getItem(TICKET_KEY),
      token: sessionStorage.getItem(TOKEN_KEY),
      visit: raw ? (JSON.parse(raw) as PatientVisit) : null,
      hydrated: true,
    });
  }, []);

  const value = useMemo<PatientState>(
    () => ({
      ...snapshot,
      setTicket(nextTicket, nextToken) {
        sessionStorage.setItem(TICKET_KEY, nextTicket);
        sessionStorage.setItem(TOKEN_KEY, nextToken);
        sessionStorage.removeItem(VISIT_KEY);
        setSnapshot((prev) => ({
          ...prev,
          ticketNumber: nextTicket,
          token: nextToken,
          visit: null,
        }));
      },
      setVisit(nextVisit) {
        sessionStorage.setItem(VISIT_KEY, JSON.stringify(nextVisit));
        setSnapshot((prev) => ({ ...prev, visit: nextVisit }));
      },
      clear() {
        sessionStorage.removeItem(TICKET_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(VISIT_KEY);
        setSnapshot((prev) => ({
          ...prev,
          ticketNumber: null,
          token: null,
          visit: null,
        }));
      },
    }),
    [snapshot],
  );

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}

export function usePatient(): PatientState {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within a PatientProvider");
  return ctx;
}

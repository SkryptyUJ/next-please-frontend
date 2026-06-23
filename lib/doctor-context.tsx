"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TicketType } from "./types";

const TOKEN_KEY = "np_doctor_token";
const ROOM_KEY = "np_doctor_room";
const VISIT_KEY = "np_doctor_visit";

export type DoctorVisit = {
  // The paired ticket's numeric id, needed to "Stop consultation"
  // (POST /api/doctors/complete-patient/{ticketId}).
  ticketId: number;
  ticketNumber: string;
  type: TicketType;
};

type DoctorRoom = { id: number; name: string };

type Snapshot = {
  token: string | null;
  room: DoctorRoom | null;
  visit: DoctorVisit | null;
  hydrated: boolean;
};

type DoctorState = {
  token: string | null;
  roomId: number | null;
  roomName: string | null;
  visit: DoctorVisit | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  setRoom: (id: number, name: string) => void;
  setVisit: (visit: DoctorVisit) => void;
  clearVisit: () => void;
  clear: () => void;
};

const EMPTY: Snapshot = {
  token: null,
  room: null,
  visit: null,
  hydrated: false,
};

const DoctorContext = createContext<DoctorState | null>(null);

export function DoctorProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);

  useEffect(() => {
    const roomRaw = sessionStorage.getItem(ROOM_KEY);
    const visitRaw = sessionStorage.getItem(VISIT_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount (SSR-safe)
    setSnapshot({
      token: sessionStorage.getItem(TOKEN_KEY),
      room: roomRaw ? (JSON.parse(roomRaw) as DoctorRoom) : null,
      visit: visitRaw ? (JSON.parse(visitRaw) as DoctorVisit) : null,
      hydrated: true,
    });
  }, []);

  const value = useMemo<DoctorState>(
    () => ({
      token: snapshot.token,
      roomId: snapshot.room?.id ?? null,
      roomName: snapshot.room?.name ?? null,
      visit: snapshot.visit,
      hydrated: snapshot.hydrated,
      setToken(nextToken) {
        sessionStorage.setItem(TOKEN_KEY, nextToken);
        setSnapshot((prev) => ({ ...prev, token: nextToken }));
      },
      setRoom(id, name) {
        const room = { id, name };
        sessionStorage.setItem(ROOM_KEY, JSON.stringify(room));
        setSnapshot((prev) => ({ ...prev, room }));
      },
      setVisit(nextVisit) {
        sessionStorage.setItem(VISIT_KEY, JSON.stringify(nextVisit));
        setSnapshot((prev) => ({ ...prev, visit: nextVisit }));
      },
      clearVisit() {
        sessionStorage.removeItem(VISIT_KEY);
        setSnapshot((prev) => ({ ...prev, visit: null }));
      },
      clear() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(ROOM_KEY);
        sessionStorage.removeItem(VISIT_KEY);
        setSnapshot((prev) => ({
          ...prev,
          token: null,
          room: null,
          visit: null,
        }));
      },
    }),
    [snapshot],
  );

  return (
    <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
  );
}

export function useDoctor(): DoctorState {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctor must be used within a DoctorProvider");
  return ctx;
}

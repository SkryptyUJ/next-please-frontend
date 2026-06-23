"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, apiFetch } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";
import type { TicketType, VisitResponse } from "@/lib/types";

const TYPE_LABELS: Record<TicketType, string> = {
  CONSULTATION: "Consultation",
  CHECKUP: "Check-up",
  URGENT: "Urgent",
};

export default function PickTypePage() {
  const router = useRouter();
  const { token, roomId, hydrated, setVisit, clear } = useDoctor();
  const [types, setTypes] = useState<TicketType[] | null>(null);
  const [pending, setPending] = useState<TicketType | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/doctor/login");
    else if (roomId == null) router.replace("/doctor/room");
  }, [hydrated, token, roomId, router]);

  const loadTypes = useCallback(async () => {
    if (!token) return;
    try {
      const list = await apiFetch<TicketType[]>(
        "/api/doctors/available-types",
        { token },
      );
      setTypes(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/doctor/login");
      } else {
        setTypes([]);
      }
    }
  }, [token, clear, router]);

  // Refresh the available types on mount, on a timer, and when the tab regains
  // focus (e.g. after returning from a visit).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after an await, not synchronously
    void loadTypes();
    const id = setInterval(loadTypes, 5000);
    const onFocus = () => void loadTypes();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadTypes]);

  async function seeNext(type: TicketType) {
    if (!token) return;
    setPending(type);
    setNotice(null);
    try {
      const res = await apiFetch<VisitResponse>(
        `/api/doctors/next-patient?type=${type}`,
        { method: "POST", token },
      );
      setVisit({
        ticketId: res.id,
        ticketNumber: res.ticketName,
        type: res.type,
      });
      router.replace("/doctor/visit");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotice(`No one is waiting for ${TYPE_LABELS[type]} anymore.`);
        await loadTypes();
      } else if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/doctor/login");
        return;
      } else {
        setNotice("Could not call the next patient.");
      }
      setPending(null);
    }
  }

  if (!hydrated || !token || roomId == null) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Who will you see?</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick a type with patients waiting.
          </p>
        </header>

        {types == null ? (
          <p className="text-center text-sm text-zinc-500">Loading…</p>
        ) : types.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No patients waiting. This refreshes automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {types.map((t) => (
              <Button
                key={t}
                className="w-full py-4 text-lg"
                onClick={() => seeNext(t)}
                disabled={pending !== null}
              >
                {pending === t ? "Calling…" : TYPE_LABELS[t]}
              </Button>
            ))}
          </div>
        )}

        {notice && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {notice}
          </p>
        )}
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, apiFetch } from "@/lib/api";
import { usePatient, type PatientVisit } from "@/lib/patient-context";
import { useQueueSSE } from "@/lib/useQueueSSE";
import type { QueueStatusResponse } from "@/lib/types";

const VISIT_DURATION_MS = 20_000;

// Derives the visit screen's inputs from a CALLED status when we learn about
// the pairing via polling rather than the `patient-called` SSE event.
function visitFromStatus(status: QueueStatusResponse): PatientVisit | null {
  if (status.status !== "CALLED" || !status.calledAt) return null;
  return {
    roomNumber:
      status.roomId != null ? `Room ${status.roomId}` : "your room",
    visitEndsAt: new Date(
      Date.parse(status.calledAt) + VISIT_DURATION_MS,
    ).toISOString(),
  };
}

export default function WaitPage() {
  const router = useRouter();
  const { ticketNumber, token, hydrated, setVisit, clear } = usePatient();
  const [status, setStatus] = useState<QueueStatusResponse | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // No ticket in session → back to the start.
  useEffect(() => {
    if (hydrated && !ticketNumber) router.replace("/");
  }, [hydrated, ticketNumber, router]);

  const enterVisit = useCallback(
    (visit: PatientVisit) => {
      setVisit(visit);
      router.replace("/visit");
    },
    [router, setVisit],
  );

  const applyStatus = useCallback(
    (next: QueueStatusResponse) => {
      if (next.ticketNumber !== ticketNumber) return;
      setStatus(next);
      if (next.status === "COMPLETED") {
        router.replace("/done");
        return;
      }
      if (next.status === "CANCELLED") {
        clear();
        router.replace("/");
        return;
      }
      const visit = visitFromStatus(next);
      if (visit) enterVisit(visit);
    },
    [ticketNumber, router, clear, enterVisit],
  );

  useQueueSSE(token, {
    onQueueUpdate: applyStatus,
    onPatientCalled: (data) => {
      if (data.ticketNumber !== ticketNumber) return;
      enterVisit({
        roomNumber: data.roomNumber,
        visitEndsAt: data.visitEndsAt,
      });
    },
  });

  // Polling fallback in case the SSE stream drops.
  useEffect(() => {
    if (!ticketNumber || !token) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await apiFetch<QueueStatusResponse>(
          `/api/tickets/status/${encodeURIComponent(ticketNumber)}`,
          { token },
        );
        if (!cancelled) applyStatus(res);
      } catch {
        // Transient; the next tick retries.
      }
    };
    void poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ticketNumber, token, applyStatus]);

  async function leave() {
    if (!ticketNumber || !token) return;
    setLeaving(true);
    setNotice(null);
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(ticketNumber)}/cancel`, {
        method: "POST",
        token,
      });
      clear();
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already called — the visit is starting.
        setNotice("Your visit is starting…");
        try {
          const res = await apiFetch<QueueStatusResponse>(
            `/api/tickets/status/${encodeURIComponent(ticketNumber)}`,
            { token },
          );
          const visit = visitFromStatus(res);
          if (visit) {
            enterVisit(visit);
            return;
          }
        } catch {
          /* fall through to re-enable the button */
        }
      } else {
        setNotice("Could not leave the queue. Try again.");
      }
      setLeaving(false);
    }
  }

  if (!hydrated || !ticketNumber) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <header className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Your ticket
          </p>
          <p className="mt-1 font-mono text-4xl font-semibold">
            {ticketNumber}
          </p>
          {status && (
            <p className="mt-2 text-sm text-zinc-500">{status.type}</p>
          )}
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Position
            </p>
            <p className="mt-1 text-3xl font-semibold">
              {status ? status.positionInQueue : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              In queue
            </p>
            <p className="mt-1 text-3xl font-semibold">
              {status ? status.queueSize : "—"}
            </p>
          </div>
        </section>

        <p className="text-center text-sm text-zinc-500">
          Waiting for a doctor to call you…
        </p>

        {notice && (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {notice}
          </p>
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={leave}
          disabled={leaving}
        >
          {leaving ? "Leaving…" : "Leave the queue"}
        </Button>
      </div>
    </main>
  );
}

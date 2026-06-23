"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, apiFetch } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import type { CreateTicketResponse, TicketType } from "@/lib/types";

const TYPES: { value: TicketType; label: string; description: string }[] = [
  { value: "CONSULTATION", label: "Consultation", description: "Regular visit" },
  { value: "CHECKUP", label: "Check-up", description: "Routine check-up" },
  { value: "URGENT", label: "Urgent", description: "Needs to be seen quickly" },
];

export default function ChooseTypePage() {
  const router = useRouter();
  const { ticketNumber, hydrated, setTicket } = usePatient();
  const [pending, setPending] = useState<TicketType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recover an in-progress ticket on refresh instead of starting a new one.
  useEffect(() => {
    if (hydrated && ticketNumber) router.replace("/wait");
  }, [hydrated, ticketNumber, router]);

  async function choose(type: TicketType) {
    setError(null);
    setPending(type);
    try {
      const res = await apiFetch<CreateTicketResponse>("/api/tickets/create", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      setTicket(res.ticketNumber, res.token);
      router.replace("/wait");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body || "Could not create a ticket.");
      } else {
        setError("Could not reach the server.");
      }
      setPending(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Next-Please</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            What are you here for?
          </p>
        </header>

        <div className="space-y-3">
          {TYPES.map((t) => (
            <Button
              key={t.value}
              variant="secondary"
              className="h-auto w-full justify-between py-4"
              onClick={() => choose(t.value)}
              disabled={pending !== null}
            >
              <span className="text-left">
                <span className="block text-lg font-medium">{t.label}</span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {t.description}
                </span>
              </span>
              <span className="text-sm text-zinc-400">
                {pending === t.value ? "…" : "→"}
              </span>
            </Button>
          ))}
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

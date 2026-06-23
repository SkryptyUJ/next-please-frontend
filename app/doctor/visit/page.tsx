"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, apiFetch } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  CHECKUP: "Check-up",
  URGENT: "Urgent",
};

export default function DoctorVisitPage() {
  const router = useRouter();
  const { token, visit, hydrated, clearVisit, clear } = useDoctor();
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/doctor/login");
    else if (!visit) router.replace("/doctor/types");
  }, [hydrated, token, visit, router]);

  async function stop() {
    if (!token || !visit) return;
    setStopping(true);
    setError(null);
    try {
      await apiFetch(`/api/doctors/complete-patient/${visit.ticketId}`, {
        method: "POST",
        token,
      });
      clearVisit();
      router.replace("/doctor/types");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/doctor/login");
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        // The visit is no longer in progress; treat it as already over.
        clearVisit();
        router.replace("/doctor/types");
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setError("You are not the doctor running this consultation.");
      } else {
        setError("Could not stop the consultation. Try again.");
      }
      setStopping(false);
    }
  }

  if (!hydrated || !token || !visit) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Now seeing
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-mono text-4xl font-semibold">
            {visit.ticketNumber}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {TYPE_LABELS[visit.type] ?? visit.type}
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <Button
          variant="danger"
          className="w-full py-4 text-lg"
          onClick={stop}
          disabled={stopping}
        >
          {stopping ? "Stopping…" : "Stop consultation"}
        </Button>
      </div>
    </main>
  );
}

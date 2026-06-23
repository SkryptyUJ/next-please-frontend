"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDoctor } from "@/lib/doctor-context";
import { useCountdown } from "@/lib/useCountdown";

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  CHECKUP: "Check-up",
  URGENT: "Urgent",
};

export default function DoctorVisitPage() {
  const router = useRouter();
  const { token, visit, hydrated, clearVisit } = useDoctor();
  const remaining = useCountdown(visit?.visitEndsAt ?? null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/doctor/login");
    else if (!visit) router.replace("/doctor/types");
  }, [hydrated, token, visit, router]);

  // The backend auto-completes the visit at `visitEndsAt`; we just return to
  // the type picker when the local countdown ends.
  useEffect(() => {
    if (visit && remaining === 0) {
      clearVisit();
      router.replace("/doctor/types");
    }
  }, [visit, remaining, clearVisit, router]);

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
        <div>
          <p className="font-mono text-7xl font-semibold tabular-nums">
            {remaining}
          </p>
          <p className="mt-1 text-sm text-zinc-500">seconds remaining</p>
        </div>
      </div>
    </main>
  );
}

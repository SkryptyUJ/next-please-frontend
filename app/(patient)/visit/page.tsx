"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePatient } from "@/lib/patient-context";
import { useQueueSSE } from "@/lib/useQueueSSE";

export default function VisitPage() {
  const router = useRouter();
  const { ticketNumber, token, visit, hydrated } = usePatient();

  // Without a ticket or an in-progress visit we can't be on this screen.
  useEffect(() => {
    if (!hydrated) return;
    if (!ticketNumber) router.replace("/");
    else if (!visit) router.replace("/wait");
  }, [hydrated, ticketNumber, visit, router]);

  // The visit ends when the doctor clicks "Stop consultation"; the backend
  // then broadcasts a COMPLETED status on our stream.
  useQueueSSE(token, {
    onQueueUpdate: (data) => {
      if (data.ticketNumber === ticketNumber && data.status === "COMPLETED") {
        router.replace("/done");
      }
    },
  });

  if (!hydrated || !ticketNumber || !visit) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Your visit has started
        </p>
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-8 dark:bg-blue-950">
          <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Please go to
          </p>
          <p className="mt-1 text-3xl font-semibold text-blue-900 dark:text-blue-100">
            {visit.roomNumber}
          </p>
        </div>
        <p className="text-sm text-zinc-500">In consultation — please wait.</p>
        <p className="font-mono text-sm text-zinc-500">{ticketNumber}</p>
      </div>
    </main>
  );
}

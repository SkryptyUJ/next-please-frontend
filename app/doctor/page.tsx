"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDoctor } from "@/lib/doctor-context";

// Entry point: route the doctor to the right step based on stored state.
export default function DoctorIndexPage() {
  const router = useRouter();
  const { token, roomId, hydrated } = useDoctor();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/doctor/login");
    else if (roomId != null) router.replace("/doctor/types");
    else router.replace("/doctor/room");
  }, [hydrated, token, roomId, router]);

  return (
    <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
      Loading…
    </main>
  );
}

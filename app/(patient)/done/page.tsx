"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { usePatient } from "@/lib/patient-context";

export default function DonePage() {
  const router = useRouter();
  const { clear } = usePatient();

  function restart() {
    clear();
    router.replace("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Thank you</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your visit is complete. Take care!
        </p>
        <Button className="w-full" onClick={restart}>
          Back to start
        </Button>
      </div>
    </main>
  );
}

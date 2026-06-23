"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { apiFetch } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";

// Guards the doctor area (redirects to login without a token) and renders the
// shared header with the log-out / release-room action.
export function DoctorChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, roomId, roomName, hydrated, clear } = useDoctor();
  const isLogin = pathname === "/doctor/login";

  useEffect(() => {
    if (hydrated && !token && !isLogin) router.replace("/doctor/login");
  }, [hydrated, token, isLogin, router]);

  async function logout() {
    if (roomId != null && token) {
      // Release the room back into the free pool; ignore failures so the
      // doctor can always sign out.
      try {
        await apiFetch(`/api/rooms/${roomId}/release`, {
          method: "POST",
          token,
        });
      } catch {
        /* best effort */
      }
    }
    clear();
    router.replace("/doctor/login");
  }

  if (!hydrated && !isLogin) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {token && !isLogin && (
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Doctor
            </p>
            <p className="text-sm font-medium">{roomName ?? "No room"}</p>
          </div>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </header>
      )}
      {children}
    </div>
  );
}

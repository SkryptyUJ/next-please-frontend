"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { useAdmin } from "@/lib/admin-context";

// Guards the admin area (redirects to login without a token) and renders the
// shared header with the log-out action.
export function AdminChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, hydrated, clear } = useAdmin();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (hydrated && !token && !isLogin) router.replace("/admin/login");
  }, [hydrated, token, isLogin, router]);

  function logout() {
    clear();
    router.replace("/admin/login");
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
              Admin
            </p>
            <p className="text-sm font-medium">Control panel</p>
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

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { ApiError, apiFetch } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import type { LoginResponse } from "@/lib/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const { token, hydrated, setToken } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) router.replace("/admin");
  }, [hydrated, token, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // The single login endpoint serves both admin and doctor; only admins
      // may open this panel.
      if (res.role !== "ADMIN") {
        setError("This account is not an administrator.");
        setSubmitting(false);
        return;
      }
      setToken(res.token);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Wrong email or password.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Your account is not active.");
      } else if (err instanceof ApiError) {
        setError(err.body || "Login failed.");
      } else {
        setError("Could not reach the server.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Admin login</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage doctors.
          </p>
        </header>

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}

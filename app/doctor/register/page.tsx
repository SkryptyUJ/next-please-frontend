"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { apiFetch } from "@/lib/api";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/register-doctor", {
        method: "POST",
        body: JSON.stringify({ email, name, surname, password }),
      });
      setSubmitted(true);
    } catch {
      // Keep the message neutral — don't reveal whether the email exists.
      setError("Could not submit the request. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Request submitted</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            An admin must approve your account before you can log in.
          </p>
          <Button
            className="w-full"
            onClick={() => router.replace("/doctor/login")}
          >
            Back to login
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Request an account</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick your own password. An admin will approve your request.
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
          label="First name"
          name="name"
          autoComplete="given-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Surname"
          name="surname"
          autoComplete="family-name"
          required
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit request"}
        </Button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/doctor/login"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

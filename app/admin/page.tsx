"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";
import { useAdmin } from "@/lib/admin-context";
import type { AdminDoctor } from "@/lib/types";

type Confirm =
  | { kind: "deny"; doctor: AdminDoctor }
  | { kind: "delete"; doctor: AdminDoctor };

const STATUS_LABELS: Record<AdminDoctor["status"], string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
};

export default function AdminPanelPage() {
  const router = useRouter();
  const { token, hydrated, clear } = useAdmin();
  const [pending, setPending] = useState<AdminDoctor[] | null>(null);
  const [doctors, setDoctors] = useState<AdminDoctor[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/admin/login");
        return true;
      }
      return false;
    },
    [clear, router],
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [pendingList, allDoctors] = await Promise.all([
        apiFetch<AdminDoctor[]>("/api/admin/doctors/pending", { token }),
        apiFetch<AdminDoctor[]>("/api/admin/doctors", { token }),
      ]);
      setPending(pendingList);
      setDoctors(allDoctors);
      // Don't clear `error` here: actions clear it themselves before running
      // and then call load() in their `finally`, so wiping it would hide the
      // guard messages (e.g. "can't delete the last active admin") this
      // refetch is meant to display alongside the refreshed lists.
    } catch (err) {
      if (handleAuthError(err)) return;
      setError("Could not load the admin data.");
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after an await, not synchronously
    void load();
  }, [load]);

  async function approve(doctor: AdminDoctor) {
    if (!token) return;
    setBusyId(doctor.id);
    setError(null);
    try {
      await apiFetch(`/api/admin/doctors/${doctor.id}/approve`, {
        method: "POST",
        token,
      });
    } catch (err) {
      if (handleAuthError(err)) return;
      // 409 means it was already handled elsewhere — just refetch below.
      if (!(err instanceof ApiError && err.status === 409)) {
        setError("Could not approve the request.");
      }
    } finally {
      setBusyId(null);
      await load();
    }
  }

  async function runConfirmed() {
    if (!confirm || !token) return;
    const { kind, doctor } = confirm;
    setBusyId(doctor.id);
    setError(null);
    try {
      if (kind === "deny") {
        await apiFetch(`/api/admin/doctors/${doctor.id}/reject`, {
          method: "POST",
          token,
        });
      } else {
        await apiFetch(`/api/admin/users/${doctor.id}`, {
          method: "DELETE",
          token,
        });
      }
      setConfirm(null);
    } catch (err) {
      if (handleAuthError(err)) return;
      if (err instanceof ApiError && err.status === 409) {
        // Deny: already handled — just refetch. Delete: a guard fired
        // (deleting yourself or the last active admin); surface it.
        setError(
          kind === "delete"
            ? err.body || "That user can't be deleted."
            : null,
        );
        setConfirm(null);
      } else {
        setError(
          kind === "deny"
            ? "Could not deny the request."
            : "Could not delete the user.",
        );
      }
    } finally {
      setBusyId(null);
      await load();
    }
  }

  if (!hydrated || !token) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 py-10">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Pending requests</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Doctors awaiting approval before they can log in.
          </p>
        </header>

        {pending == null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No pending requests.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {d.name} {d.surname}
                  </p>
                  <p className="truncate text-sm text-zinc-500">{d.email}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    onClick={() => void approve(d)}
                    disabled={busyId === d.id}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setConfirm({ kind: "deny", doctor: d })}
                    disabled={busyId === d.id}
                  >
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">All doctors</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Every doctor account, regardless of status.
          </p>
        </header>

        {doctors == null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : doctors.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No doctors yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {doctors.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {d.name} {d.surname}
                  </p>
                  <p className="truncate text-sm text-zinc-500">{d.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {STATUS_LABELS[d.status]}
                  </span>
                  <Button
                    variant="danger"
                    onClick={() => setConfirm({ kind: "delete", doctor: d })}
                    disabled={busyId === d.id}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "deny" ? "Deny request?" : "Delete user?"}
          body={
            confirm.kind === "deny" ? (
              <>
                This permanently removes the request from{" "}
                <span className="font-medium">{confirm.doctor.email}</span>.
                They would have to request an account again.
              </>
            ) : (
              <>
                This permanently deletes{" "}
                <span className="font-medium">{confirm.doctor.email}</span>.
                This cannot be undone.
              </>
            )
          }
          confirmLabel={confirm.kind === "deny" ? "Deny" : "Delete"}
          busy={busyId === confirm.doctor.id}
          onConfirm={() => void runConfirmed()}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}

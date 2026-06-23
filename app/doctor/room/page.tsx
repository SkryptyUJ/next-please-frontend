"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, apiFetch } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";
import type { RoomResponse } from "@/lib/types";

export default function PickRoomPage() {
  const router = useRouter();
  const { token, hydrated, setRoom, clear } = useDoctor();
  const [rooms, setRooms] = useState<RoomResponse[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !token) router.replace("/doctor/login");
  }, [hydrated, token, router]);

  const loadRooms = useCallback(async () => {
    if (!token) return;
    try {
      const list = await apiFetch<RoomResponse[]>("/api/rooms/available", {
        token,
      });
      setRooms(list);
      setSelectedId((prev) =>
        prev != null && list.some((r) => r.id === prev)
          ? prev
          : (list[0]?.id ?? null),
      );
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/doctor/login");
      } else {
        setError("Could not load rooms.");
      }
    }
  }, [token, clear, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after an await, not synchronously
    void loadRooms();
  }, [loadRooms]);

  async function claim() {
    if (selectedId == null || !token) return;
    setClaiming(true);
    setError(null);
    try {
      const room = await apiFetch<RoomResponse>(
        `/api/rooms/${selectedId}/claim`,
        { method: "POST", token },
      );
      setRoom(room.id, room.name);
      router.replace("/doctor/types");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Refetch first — loadRooms clears the error on success, so set the
        // contention message afterwards or it would be wiped immediately.
        await loadRooms();
        setError("That room was just taken. Pick another.");
      } else if (err instanceof ApiError && err.status === 401) {
        clear();
        router.replace("/doctor/login");
      } else {
        setError("Could not claim the room.");
      }
      setClaiming(false);
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
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Pick a room</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Choose a free room to sit in.
          </p>
        </header>

        {rooms == null ? (
          <p className="text-center text-sm text-zinc-500">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <div className="space-y-3 text-center">
            <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-sm text-zinc-500 dark:border-zinc-700">
              No free rooms right now.
            </p>
            <Button variant="secondary" onClick={() => void loadRooms()}>
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button
              className="w-full"
              onClick={claim}
              disabled={claiming || selectedId == null}
            >
              {claiming ? "Claiming…" : "Claim room"}
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

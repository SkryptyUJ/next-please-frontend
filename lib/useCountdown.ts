"use client";

import { useEffect, useState } from "react";

// Remaining whole seconds until `target` (ISO-8601), clamped at 0. The backend
// owns visit timing via `visitEndsAt`; both clients count down from it so they
// stay in sync. Clock skew can only push the countdown to 0 early, never below.
function remainingSeconds(target: string | null): number {
  if (!target) return 0;
  const ms = Date.parse(target) - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export function useCountdown(target: string | null): number {
  // A bare tick drives re-renders; the value is derived from the clock during
  // render so there is no derived state to keep in sync.
  const [, tick] = useState(0);

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [target]);

  return remainingSeconds(target);
}

"use client";

import { useEffect, useRef } from "react";
import { subscribeToQueue, type QueueSseHandlers } from "./sse";

// Keeps a single SSE subscription alive for `token`. Handlers are held in a
// ref so changing callbacks between renders does not tear down the stream.
export function useQueueSSE(token: string | null, handlers: QueueSseHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!token) return;
    return subscribeToQueue(token, {
      onQueueUpdate: (d) => handlersRef.current.onQueueUpdate?.(d),
      onPatientCalled: (d) => handlersRef.current.onPatientCalled?.(d),
      onError: (e) => handlersRef.current.onError?.(e),
    });
  }, [token]);
}

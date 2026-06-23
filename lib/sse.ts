import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_BASE_URL } from "./api";
import type { PatientCalledEvent, QueueUpdateEvent } from "./types";

export type QueueSseHandlers = {
  onQueueUpdate?: (data: QueueUpdateEvent) => void;
  onPatientCalled?: (data: PatientCalledEvent) => void;
  onError?: (err: unknown) => void;
};

// Subscribes to the patient's personal queue stream. The server derives the
// ticket from the Bearer token, so there is no room/ticket in the path.
// `EventSource` cannot send Authorization headers, hence fetch-event-source.
export function subscribeToQueue(
  token: string,
  handlers: QueueSseHandlers,
): () => void {
  const ctrl = new AbortController();

  function start() {
    fetchEventSource(`${API_BASE_URL}/api/queue/subscribe`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (!ev.event || !ev.data) return;
        try {
          const data = JSON.parse(ev.data);
          if (ev.event === "queue-update") {
            handlers.onQueueUpdate?.(data as QueueUpdateEvent);
          } else if (ev.event === "patient-called") {
            handlers.onPatientCalled?.(data as PatientCalledEvent);
          }
        } catch (err) {
          handlers.onError?.(err);
        }
      },
      onclose() {
        // Server closed the stream; reconnect with a small backoff.
        if (!ctrl.signal.aborted) {
          setTimeout(start, 1000);
        }
      },
      onerror(err) {
        handlers.onError?.(err);
        if (ctrl.signal.aborted) throw err;
        return 2000;
      },
    }).catch((err) => {
      if (!ctrl.signal.aborted) handlers.onError?.(err);
    });
  }

  start();
  return () => ctrl.abort();
}

import { beforeEach, describe, expect, it, vi } from "vitest";

// Capture the options passed to fetchEventSource so the test can drive the
// onmessage/onerror callbacks the way the server would.
const fetchEventSource = vi.fn();
vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: (url: string, opts: unknown) => fetchEventSource(url, opts),
}));

import { subscribeToQueue } from "./sse";

type Opts = {
  headers: Record<string, string>;
  onmessage: (ev: { event?: string; data?: string }) => void;
  onerror: (err: unknown) => number;
};

function lastOpts(): Opts {
  return fetchEventSource.mock.calls.at(-1)![1] as Opts;
}

beforeEach(() => {
  fetchEventSource.mockReset();
  // The real fn returns a promise the caller attaches `.catch` to.
  fetchEventSource.mockResolvedValue(undefined);
});

describe("subscribeToQueue", () => {
  it("subscribes with the Bearer header on the queue endpoint", () => {
    subscribeToQueue("tok-123", {});
    const [url, opts] = fetchEventSource.mock.calls[0];
    expect(url).toContain("/api/queue/subscribe");
    expect((opts as Opts).headers.Authorization).toBe("Bearer tok-123");
  });

  it("routes queue-update events to onQueueUpdate", () => {
    const onQueueUpdate = vi.fn();
    subscribeToQueue("t", { onQueueUpdate });

    lastOpts().onmessage({
      event: "queue-update",
      data: JSON.stringify({ ticketNumber: "C-001", status: "COMPLETED" }),
    });

    expect(onQueueUpdate).toHaveBeenCalledWith({
      ticketNumber: "C-001",
      status: "COMPLETED",
    });
  });

  it("routes patient-called events to onPatientCalled", () => {
    const onPatientCalled = vi.fn();
    subscribeToQueue("t", { onPatientCalled });

    lastOpts().onmessage({
      event: "patient-called",
      data: JSON.stringify({ ticketNumber: "C-001", roomNumber: "Room 2" }),
    });

    expect(onPatientCalled).toHaveBeenCalledWith({
      ticketNumber: "C-001",
      roomNumber: "Room 2",
    });
  });

  it("ignores messages without an event name or data", () => {
    const onQueueUpdate = vi.fn();
    subscribeToQueue("t", { onQueueUpdate });

    lastOpts().onmessage({ data: JSON.stringify({ x: 1 }) });
    lastOpts().onmessage({ event: "queue-update" });

    expect(onQueueUpdate).not.toHaveBeenCalled();
  });

  it("forwards malformed JSON to onError instead of throwing", () => {
    const onError = vi.fn();
    subscribeToQueue("t", { onError });

    lastOpts().onmessage({ event: "queue-update", data: "{not json" });

    expect(onError).toHaveBeenCalled();
  });

  it("returns an unsubscribe function", () => {
    const unsubscribe = subscribeToQueue("t", {});
    expect(typeof unsubscribe).toBe("function");
    expect(() => unsubscribe()).not.toThrow();
  });
});

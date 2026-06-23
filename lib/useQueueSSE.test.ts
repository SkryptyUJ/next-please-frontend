import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueSseHandlers } from "./sse";

const unsubscribe = vi.fn();
const subscribeToQueue =
  vi.fn<(token: string, handlers: QueueSseHandlers) => () => void>(
    () => unsubscribe,
  );
vi.mock("./sse", () => ({
  subscribeToQueue: (token: string, handlers: QueueSseHandlers) =>
    subscribeToQueue(token, handlers),
}));

import { useQueueSSE } from "./useQueueSSE";

beforeEach(() => {
  subscribeToQueue.mockClear();
  unsubscribe.mockClear();
});

describe("useQueueSSE", () => {
  it("does not subscribe without a token", () => {
    renderHook(() => useQueueSSE(null, {}));
    expect(subscribeToQueue).not.toHaveBeenCalled();
  });

  it("subscribes once for a token and forwards events to current handlers", () => {
    const onQueueUpdate = vi.fn();
    renderHook(() => useQueueSSE("tok", { onQueueUpdate }));

    expect(subscribeToQueue).toHaveBeenCalledTimes(1);
    expect(subscribeToQueue.mock.calls[0][0]).toBe("tok");

    // The hook wraps handlers; invoke the wrapper it passed to the subscriber.
    const passed = subscribeToQueue.mock.calls[0][1] as QueueSseHandlers;
    passed.onQueueUpdate?.({
      ticketNumber: "C-001",
      status: "COMPLETED",
    } as never);
    expect(onQueueUpdate).toHaveBeenCalled();
  });

  it("does not resubscribe when only the handlers change", () => {
    const { rerender } = renderHook(
      ({ h }) => useQueueSSE("tok", h),
      { initialProps: { h: { onQueueUpdate: vi.fn() } as QueueSseHandlers } },
    );
    rerender({ h: { onQueueUpdate: vi.fn() } });
    expect(subscribeToQueue).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useQueueSSE("tok", {}));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("resubscribes when the token changes", () => {
    const { rerender } = renderHook(({ t }) => useQueueSSE(t, {}), {
      initialProps: { t: "a" },
    });
    rerender({ t: "b" });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeToQueue).toHaveBeenCalledTimes(2);
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { PatientProvider } from "@/lib/patient-context";
import type { QueueSseHandlers } from "@/lib/sse";
import type { QueueStatusResponse } from "@/lib/types";

// Capture the SSE handlers the page registers so the test can fire events.
const sse = vi.hoisted(() => ({ current: {} as QueueSseHandlers }));
vi.mock("@/lib/useQueueSSE", () => ({
  useQueueSSE: (_token: string | null, handlers: QueueSseHandlers) => {
    sse.current = handlers;
  },
}));

import WaitPage from "./page";

const WAITING: QueueStatusResponse = {
  ticketNumber: "C-001",
  status: "WAITING",
  type: "CONSULTATION",
  positionInQueue: 3,
  queueSize: 5,
  roomId: null,
  calledAt: null,
};

function renderPage() {
  return render(
    <PatientProvider>
      <WaitPage />
    </PatientProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("np_patient_ticket", "C-001");
  sessionStorage.setItem("np_patient_token", "ptok");
  sse.current = {};
});

afterEach(() => vi.unstubAllGlobals());

describe("WaitPage", () => {
  it("redirects home when there is no ticket", async () => {
    sessionStorage.clear();
    installFetch({});
    renderPage();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("shows the ticket number, position and queue size from polling", async () => {
    installFetch({
      "GET /api/tickets/status/C-001": () => jsonResponse(WAITING),
    });
    renderPage();

    expect(await screen.findByText("C-001")).toBeInTheDocument();
    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("enters the visit when a patient-called event arrives", async () => {
    installFetch({
      "GET /api/tickets/status/C-001": () => jsonResponse(WAITING),
    });
    renderPage();
    await screen.findByText("C-001");

    act(() =>
      sse.current.onPatientCalled?.({
        ticketNumber: "C-001",
        roomNumber: "Room 4",
      }),
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/visit"));
    expect(JSON.parse(sessionStorage.getItem("np_patient_visit")!)).toEqual({
      roomNumber: "Room 4",
    });
  });

  it("goes to /done on a COMPLETED queue-update", async () => {
    installFetch({
      "GET /api/tickets/status/C-001": () => jsonResponse(WAITING),
    });
    renderPage();
    await screen.findByText("C-001");

    act(() =>
      sse.current.onQueueUpdate?.({ ...WAITING, status: "COMPLETED" }),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/done"));
  });

  it("cancels and returns home when Leave is clicked", async () => {
    installFetch({
      "GET /api/tickets/status/C-001": () => jsonResponse(WAITING),
      "POST /api/tickets/C-001/cancel": () => jsonResponse(null, 200),
    });
    renderPage();
    await screen.findByText("C-001");

    await userEvent.click(
      screen.getByRole("button", { name: "Leave the queue" }),
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(sessionStorage.getItem("np_patient_ticket")).toBeNull();
  });

  it("shows a notice when leaving fails with 409 (already called)", async () => {
    let calls = 0;
    installFetch({
      "GET /api/tickets/status/C-001": () => {
        // First the polling call (WAITING), then the post-409 refetch (still
        // WAITING so the button re-enables without navigating).
        calls += 1;
        return jsonResponse(WAITING);
      },
      "POST /api/tickets/C-001/cancel": () => textResponse("too late", 409),
    });
    renderPage();
    await screen.findByText("C-001");

    await userEvent.click(
      screen.getByRole("button", { name: "Leave the queue" }),
    );

    expect(
      await screen.findByText("Your visit is starting…"),
    ).toBeInTheDocument();
    expect(calls).toBeGreaterThan(0);
  });
});

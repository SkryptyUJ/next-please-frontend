import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/router";
import { PatientProvider } from "@/lib/patient-context";
import type { QueueSseHandlers } from "@/lib/sse";

const sse = vi.hoisted(() => ({ current: {} as QueueSseHandlers }));
vi.mock("@/lib/useQueueSSE", () => ({
  useQueueSSE: (_token: string | null, handlers: QueueSseHandlers) => {
    sse.current = handlers;
  },
}));

import VisitPage from "./page";

function renderPage() {
  return render(
    <PatientProvider>
      <VisitPage />
    </PatientProvider>,
  );
}

beforeEach(() => {
  sse.current = {};
});

describe("VisitPage (patient)", () => {
  it("redirects to /wait when there is a ticket but no visit", async () => {
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    renderPage();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/wait"));
  });

  it("redirects home when there is no ticket at all", async () => {
    renderPage();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("shows the room and an in-consultation message", async () => {
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    sessionStorage.setItem(
      "np_patient_visit",
      JSON.stringify({ roomNumber: "Room 2" }),
    );
    renderPage();

    expect(await screen.findByText("Room 2")).toBeInTheDocument();
    expect(
      screen.getByText("In consultation — please wait."),
    ).toBeInTheDocument();
    // No countdown text remains.
    expect(screen.queryByText(/seconds remaining/)).not.toBeInTheDocument();
  });

  it("goes to /done when the doctor stops the consultation (COMPLETED)", async () => {
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    sessionStorage.setItem(
      "np_patient_visit",
      JSON.stringify({ roomNumber: "Room 2" }),
    );
    renderPage();
    await screen.findByText("Room 2");

    act(() =>
      sse.current.onQueueUpdate?.({
        ticketNumber: "C-001",
        status: "COMPLETED",
        type: "CONSULTATION",
        positionInQueue: 0,
        queueSize: 0,
        roomId: 2,
        calledAt: null,
      }),
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/done"));
  });
});

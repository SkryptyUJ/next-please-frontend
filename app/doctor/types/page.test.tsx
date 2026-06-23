import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import type { TicketDetails } from "@/lib/types";
import PickTypePage from "./page";

const calledTicket: TicketDetails = {
  id: 42,
  ticketName: "U-007",
  status: "CALLED",
  createdAt: "2026-06-23T10:00:00Z",
  calledAt: "2026-06-23T10:01:00Z",
  roomId: 5,
  doctorId: 1,
  type: "URGENT",
};

function renderPage() {
  return render(
    <DoctorProvider>
      <PickTypePage />
    </DoctorProvider>,
  );
}

beforeEach(() => {
  sessionStorage.setItem("np_doctor_token", "doc-tok");
  sessionStorage.setItem(
    "np_doctor_room",
    JSON.stringify({ id: 5, name: "Room 5" }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("PickTypePage", () => {
  it("sends the doctor back to the room picker without a room", async () => {
    sessionStorage.removeItem("np_doctor_room");
    installFetch({ "GET /api/doctors/available-types": () => jsonResponse([]) });
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/room"),
    );
  });

  it("renders the available types", async () => {
    installFetch({
      "GET /api/doctors/available-types": () =>
        jsonResponse(["CONSULTATION", "URGENT"]),
    });
    renderPage();
    expect(
      await screen.findByRole("button", { name: "Consultation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Urgent" })).toBeInTheDocument();
  });

  it("calls the next patient and stores the visit with the ticket id", async () => {
    installFetch({
      "GET /api/doctors/available-types": () => jsonResponse(["URGENT"]),
      "POST /api/doctors/next-patient": () => jsonResponse(calledTicket),
    });
    renderPage();
    await screen.findByRole("button", { name: "Urgent" });

    await userEvent.click(screen.getByRole("button", { name: "Urgent" }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/visit"),
    );
    expect(JSON.parse(sessionStorage.getItem("np_doctor_visit")!)).toEqual({
      ticketId: 42,
      ticketNumber: "U-007",
      type: "URGENT",
    });
  });

  it("shows a notice when nobody is waiting anymore (404)", async () => {
    installFetch({
      "GET /api/doctors/available-types": () => jsonResponse(["URGENT"]),
      "POST /api/doctors/next-patient": () => textResponse("", 404),
    });
    renderPage();
    await screen.findByRole("button", { name: "Urgent" });

    await userEvent.click(screen.getByRole("button", { name: "Urgent" }));

    expect(
      await screen.findByText("No one is waiting for Urgent anymore."),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalledWith("/doctor/visit");
  });

  it("logs out to login on a 401 while calling", async () => {
    installFetch({
      "GET /api/doctors/available-types": () => jsonResponse(["URGENT"]),
      "POST /api/doctors/next-patient": () => textResponse("", 401),
    });
    renderPage();
    await screen.findByRole("button", { name: "Urgent" });

    await userEvent.click(screen.getByRole("button", { name: "Urgent" }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
    expect(sessionStorage.getItem("np_doctor_token")).toBeNull();
  });
});

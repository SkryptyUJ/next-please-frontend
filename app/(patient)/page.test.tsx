import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, parseBody, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { PatientProvider } from "@/lib/patient-context";
import ChooseTypePage from "./page";

function renderPage() {
  return render(
    <PatientProvider>
      <ChooseTypePage />
    </PatientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ChooseTypePage", () => {
  it("renders the three ticket types", () => {
    installFetch({});
    renderPage();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("Check-up")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("creates a ticket and moves to /wait, persisting the ticket", async () => {
    const fetchMock = installFetch({
      "POST /api/tickets/create": (init) => {
        expect(parseBody(init)).toEqual({ type: "URGENT" });
        return jsonResponse({ ticketNumber: "U-077", token: "ptok" });
      },
    });
    renderPage();

    await userEvent.click(screen.getByText("Urgent"));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/wait"));
    expect(fetchMock).toHaveBeenCalled();
    expect(sessionStorage.getItem("np_patient_ticket")).toBe("U-077");
    expect(sessionStorage.getItem("np_patient_token")).toBe("ptok");
  });

  it("shows the backend error body when ticket creation fails", async () => {
    installFetch({
      "POST /api/tickets/create": () => textResponse("Queue is closed", 400),
    });
    renderPage();

    await userEvent.click(screen.getByText("Consultation"));

    expect(await screen.findByText("Queue is closed")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("redirects an existing ticket holder straight to /wait", async () => {
    installFetch({});
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    renderPage();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/wait"));
  });
});

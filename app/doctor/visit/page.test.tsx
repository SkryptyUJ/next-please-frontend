import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import DoctorVisitPage from "./page";

function renderPage() {
  return render(
    <DoctorProvider>
      <DoctorVisitPage />
    </DoctorProvider>,
  );
}

function seedVisit() {
  sessionStorage.setItem("np_doctor_token", "doc-tok");
  sessionStorage.setItem(
    "np_doctor_room",
    JSON.stringify({ id: 5, name: "Room 5" }),
  );
  sessionStorage.setItem(
    "np_doctor_visit",
    JSON.stringify({ ticketId: 42, ticketNumber: "U-007", type: "URGENT" }),
  );
}

afterEach(() => vi.unstubAllGlobals());
beforeEach(seedVisit);

describe("DoctorVisitPage", () => {
  it("redirects to the type picker when there is no visit", async () => {
    sessionStorage.removeItem("np_doctor_visit");
    installFetch({});
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/types"),
    );
  });

  it("shows the paired patient and a Stop consultation button (no countdown)", async () => {
    installFetch({});
    renderPage();
    expect(await screen.findByText("U-007")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Stop consultation" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/seconds remaining/)).not.toBeInTheDocument();
  });

  it("completes the patient and returns to types on success", async () => {
    const fetchMock = installFetch({
      "POST /api/doctors/complete-patient/42": () => jsonResponse(null, 200),
    });
    renderPage();
    await screen.findByText("U-007");

    await userEvent.click(
      screen.getByRole("button", { name: "Stop consultation" }),
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/types"),
    );
    expect(fetchMock).toHaveBeenCalled();
    expect(sessionStorage.getItem("np_doctor_visit")).toBeNull();
  });

  it("shows a 403 message when the doctor is not the session owner", async () => {
    installFetch({
      "POST /api/doctors/complete-patient/42": () => textResponse("", 403),
    });
    renderPage();
    await screen.findByText("U-007");

    await userEvent.click(
      screen.getByRole("button", { name: "Stop consultation" }),
    );

    expect(
      await screen.findByText(
        "You are not the doctor running this consultation.",
      ),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalledWith("/doctor/types");
  });

  it("treats a 409 (no longer CALLED) as already over and returns to types", async () => {
    installFetch({
      "POST /api/doctors/complete-patient/42": () => textResponse("", 409),
    });
    renderPage();
    await screen.findByText("U-007");

    await userEvent.click(
      screen.getByRole("button", { name: "Stop consultation" }),
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/types"),
    );
    expect(sessionStorage.getItem("np_doctor_visit")).toBeNull();
  });

  it("logs out on a 401", async () => {
    installFetch({
      "POST /api/doctors/complete-patient/42": () => textResponse("", 401),
    });
    renderPage();
    await screen.findByText("U-007");

    await userEvent.click(
      screen.getByRole("button", { name: "Stop consultation" }),
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
  });
});

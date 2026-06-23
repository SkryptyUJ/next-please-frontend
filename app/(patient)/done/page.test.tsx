import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { router } from "@/test/router";
import { PatientProvider } from "@/lib/patient-context";
import DonePage from "./page";

function renderPage() {
  return render(
    <PatientProvider>
      <DonePage />
    </PatientProvider>,
  );
}

describe("DonePage", () => {
  it("thanks the patient", () => {
    renderPage();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
  });

  it("clears session state and returns to the start on restart", async () => {
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Back to start" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(sessionStorage.getItem("np_patient_ticket")).toBeNull();
  });
});

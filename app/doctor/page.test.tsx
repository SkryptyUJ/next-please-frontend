import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import DoctorIndexPage from "./page";

function renderPage() {
  return render(
    <DoctorProvider>
      <DoctorIndexPage />
    </DoctorProvider>,
  );
}

describe("DoctorIndexPage routing", () => {
  it("routes to login without a token", async () => {
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
  });

  it("routes to the room picker when signed in without a room", async () => {
    sessionStorage.setItem("np_doctor_token", "tok");
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/room"),
    );
  });

  it("routes to the type picker when a room is already claimed", async () => {
    sessionStorage.setItem("np_doctor_token", "tok");
    sessionStorage.setItem(
      "np_doctor_room",
      JSON.stringify({ id: 1, name: "Room 1" }),
    );
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/types"),
    );
  });
});

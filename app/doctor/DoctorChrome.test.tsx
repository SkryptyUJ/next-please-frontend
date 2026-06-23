import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse } from "@/test/helpers";
import { router, setPathname } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import { DoctorChrome } from "./DoctorChrome";

function renderChrome() {
  return render(
    <DoctorProvider>
      <DoctorChrome>
        <div>page body</div>
      </DoctorChrome>
    </DoctorProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("DoctorChrome", () => {
  it("redirects to login on a guarded route without a token", async () => {
    setPathname("/doctor/types");
    installFetch({});
    renderChrome();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
  });

  it("does not redirect on the public register route without a token", async () => {
    setPathname("/doctor/register");
    installFetch({});
    renderChrome();
    expect(await screen.findByText("page body")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    // No staff header without a token.
    expect(
      screen.queryByRole("button", { name: "Log out" }),
    ).not.toBeInTheDocument();
  });

  it("releases the room and logs out when signed in", async () => {
    setPathname("/doctor/types");
    sessionStorage.setItem("np_doctor_token", "tok");
    sessionStorage.setItem(
      "np_doctor_room",
      JSON.stringify({ id: 9, name: "Room 9" }),
    );
    const fetchMock = installFetch({
      "POST /api/rooms/9/release": () => jsonResponse(null, 200),
    });
    renderChrome();

    expect(await screen.findByText("Room 9")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
    expect(fetchMock).toHaveBeenCalled();
    expect(sessionStorage.getItem("np_doctor_token")).toBeNull();
  });
});

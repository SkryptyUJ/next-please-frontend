import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import DoctorLoginPage from "./page";

function renderPage() {
  return render(
    <DoctorProvider>
      <DoctorLoginPage />
    </DoctorProvider>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "doc@x.com");
  await userEvent.type(screen.getByLabelText("Password"), "pw");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

afterEach(() => vi.unstubAllGlobals());

describe("DoctorLoginPage", () => {
  it("links to the account-request form", () => {
    installFetch({});
    renderPage();
    expect(screen.getByRole("link", { name: "Request one" })).toHaveAttribute(
      "href",
      "/doctor/register",
    );
  });

  it("signs in and goes to the room picker", async () => {
    installFetch({
      "POST /api/auth/login": () =>
        jsonResponse({
          token: "doc-tok",
          email: "doc@x.com",
          name: "D",
          surname: "R",
          role: "DOCTOR",
        }),
    });
    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/room"),
    );
    expect(sessionStorage.getItem("np_doctor_token")).toBe("doc-tok");
  });

  it("shows a credentials error on 401", async () => {
    installFetch({
      "POST /api/auth/login": () => textResponse("", 401),
    });
    renderPage();
    await fillAndSubmit();
    expect(
      await screen.findByText("Wrong email or password."),
    ).toBeInTheDocument();
  });

  it("shows an awaiting-approval message on 403", async () => {
    installFetch({
      "POST /api/auth/login": () => textResponse("", 403),
    });
    renderPage();
    await fillAndSubmit();
    expect(
      await screen.findByText("Your account is awaiting admin approval."),
    ).toBeInTheDocument();
  });

  it("redirects an already-signed-in doctor away from login", async () => {
    installFetch({});
    sessionStorage.setItem("np_doctor_token", "tok");
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/room"),
    );
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { AdminProvider } from "@/lib/admin-context";
import AdminLoginPage from "./page";

function renderPage() {
  return render(
    <AdminProvider>
      <AdminLoginPage />
    </AdminProvider>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "admin@x.com");
  await userEvent.type(screen.getByLabelText("Password"), "pw");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

function loginAs(role: string) {
  return jsonResponse({
    token: "admin-tok",
    email: "admin@x.com",
    name: "A",
    surname: "D",
    role,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminLoginPage", () => {
  it("signs an admin in and opens the panel", async () => {
    installFetch({ "POST /api/auth/login": () => loginAs("ADMIN") });
    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin"));
    expect(sessionStorage.getItem("np_admin_token")).toBe("admin-tok");
  });

  it("rejects a non-admin account and stores no token", async () => {
    installFetch({ "POST /api/auth/login": () => loginAs("DOCTOR") });
    renderPage();
    await fillAndSubmit();

    expect(
      await screen.findByText("This account is not an administrator."),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("np_admin_token")).toBeNull();
    expect(router.replace).not.toHaveBeenCalledWith("/admin");
  });

  it("shows a credentials error on 401", async () => {
    installFetch({ "POST /api/auth/login": () => textResponse("", 401) });
    renderPage();
    await fillAndSubmit();
    expect(
      await screen.findByText("Wrong email or password."),
    ).toBeInTheDocument();
  });

  it("redirects an already-authenticated admin to the panel", async () => {
    installFetch({});
    sessionStorage.setItem("np_admin_token", "tok");
    renderPage();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin"));
  });
});

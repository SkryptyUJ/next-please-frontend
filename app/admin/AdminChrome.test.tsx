import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { router, setPathname } from "@/test/router";
import { AdminProvider } from "@/lib/admin-context";
import { AdminChrome } from "./AdminChrome";

function renderChrome() {
  return render(
    <AdminProvider>
      <AdminChrome>
        <div>admin body</div>
      </AdminChrome>
    </AdminProvider>,
  );
}

describe("AdminChrome", () => {
  it("redirects to login on a guarded route without a token", async () => {
    setPathname("/admin");
    renderChrome();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/admin/login"),
    );
  });

  it("renders the login page without a header or guard redirect", async () => {
    setPathname("/admin/login");
    renderChrome();
    expect(await screen.findByText("admin body")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Log out" }),
    ).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the header and logs out when authenticated", async () => {
    setPathname("/admin");
    sessionStorage.setItem("np_admin_token", "tok");
    renderChrome();

    await userEvent.click(
      await screen.findByRole("button", { name: "Log out" }),
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/admin/login"),
    );
    expect(sessionStorage.getItem("np_admin_token")).toBeNull();
  });
});

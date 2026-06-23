import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { AdminProvider } from "@/lib/admin-context";
import type { AdminDoctor } from "@/lib/types";
import AdminPanelPage from "./page";

const pendingDoc: AdminDoctor = {
  id: 10,
  email: "pending@x.com",
  name: "Pat",
  surname: "Ending",
  status: "PENDING",
};
const activeDoc: AdminDoctor = {
  id: 20,
  email: "active@x.com",
  name: "Ada",
  surname: "Active",
  status: "ACTIVE",
};

function renderPage() {
  return render(
    <AdminProvider>
      <AdminPanelPage />
    </AdminProvider>,
  );
}

beforeEach(() => sessionStorage.setItem("np_admin_token", "admin-tok"));
afterEach(() => vi.unstubAllGlobals());

describe("AdminPanelPage", () => {
  it("renders pending requests and the full doctor list", async () => {
    installFetch({
      "GET /api/admin/doctors/pending": () => jsonResponse([pendingDoc]),
      "GET /api/admin/doctors": () => jsonResponse([pendingDoc, activeDoc]),
    });
    renderPage();

    // The pending doctor shows in both the pending queue and the full list.
    expect(await screen.findAllByText("pending@x.com")).toHaveLength(2);
    expect(screen.getByText("active@x.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("approves a pending request and refetches", async () => {
    let pending = [pendingDoc];
    const fetchMock = installFetch({
      "GET /api/admin/doctors/pending": () => jsonResponse(pending),
      "GET /api/admin/doctors": () => jsonResponse([pendingDoc, activeDoc]),
      "POST /api/admin/doctors/10/approve": () => {
        pending = [];
        return jsonResponse(null, 200);
      },
    });
    renderPage();
    await screen.findAllByText("pending@x.com");

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(
        screen.getByText("No pending requests."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/doctors/10/approve"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("denies a request only after confirming, then deletes it", async () => {
    let pending = [pendingDoc];
    const fetchMock = installFetch({
      "GET /api/admin/doctors/pending": () => jsonResponse(pending),
      "GET /api/admin/doctors": () => jsonResponse([activeDoc]),
      "POST /api/admin/doctors/10/reject": () => {
        pending = [];
        return jsonResponse(null, 200);
      },
    });
    renderPage();
    await screen.findByText("pending@x.com");

    await userEvent.click(screen.getByRole("button", { name: "Deny" }));

    // Confirm dialog appears with clear permanence copy; reject not yet sent.
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/permanently removes the request/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/reject"),
      expect.anything(),
    );

    await userEvent.click(within(dialog).getByRole("button", { name: "Deny" }));

    await waitFor(() =>
      expect(screen.getByText("No pending requests.")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/doctors/10/reject"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deletes a doctor after confirming", async () => {
    let doctors = [activeDoc];
    const fetchMock = installFetch({
      "GET /api/admin/doctors/pending": () => jsonResponse([]),
      "GET /api/admin/doctors": () => jsonResponse(doctors),
      "DELETE /api/admin/users/20": () => {
        doctors = [];
        return jsonResponse(null, 200);
      },
    });
    renderPage();
    await screen.findByText("active@x.com");

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() =>
      expect(screen.getByText("No doctors yet.")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/users/20"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("surfaces the backend guard error when a delete is refused (409)", async () => {
    installFetch({
      "GET /api/admin/doctors/pending": () => jsonResponse([]),
      "GET /api/admin/doctors": () => jsonResponse([activeDoc]),
      "DELETE /api/admin/users/20": () =>
        textResponse("Cannot delete the last active admin", 409),
    });
    renderPage();
    await screen.findByText("active@x.com");

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete" }),
    );

    expect(
      await screen.findByText("Cannot delete the last active admin"),
    ).toBeInTheDocument();
  });

  it("redirects to login if a request returns 401", async () => {
    installFetch({
      "GET /api/admin/doctors/pending": () => textResponse("", 401),
      "GET /api/admin/doctors": () => textResponse("", 401),
    });
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/admin/login"),
    );
    expect(sessionStorage.getItem("np_admin_token")).toBeNull();
  });
});

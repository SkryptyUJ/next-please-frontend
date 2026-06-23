import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, parseBody, textResponse } from "@/test/helpers";
import DoctorRegisterPage from "./page";

async function fill({
  password = "secret1",
  confirm = "secret1",
}: { password?: string; confirm?: string } = {}) {
  await userEvent.type(screen.getByLabelText("Email"), "new@x.com");
  await userEvent.type(screen.getByLabelText("First name"), "New");
  await userEvent.type(screen.getByLabelText("Surname"), "Doc");
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Submit request" }));
}

afterEach(() => vi.unstubAllGlobals());

describe("DoctorRegisterPage", () => {
  it("blocks submission and shows an error when passwords differ", async () => {
    const fetchMock = installFetch({});
    render(<DoctorRegisterPage />);
    await fill({ confirm: "different" });

    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the request and shows the pending-approval confirmation", async () => {
    installFetch({
      "POST /api/auth/register-doctor": (init) => {
        expect(parseBody(init)).toEqual({
          email: "new@x.com",
          name: "New",
          surname: "Doc",
          password: "secret1",
        });
        return jsonResponse(null, 201);
      },
    });
    render(<DoctorRegisterPage />);
    await fill();

    expect(await screen.findByText("Request submitted")).toBeInTheDocument();
    expect(
      screen.getByText(
        "An admin must approve your account before you can log in.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the error neutral when the request fails", async () => {
    installFetch({
      "POST /api/auth/register-doctor": () => textResponse("duplicate", 409),
    });
    render(<DoctorRegisterPage />);
    await fill();

    expect(
      await screen.findByText("Could not submit the request. Please try again."),
    ).toBeInTheDocument();
    // The duplicate-email detail must not leak to the user.
    expect(screen.queryByText(/duplicate/)).not.toBeInTheDocument();
  });
});

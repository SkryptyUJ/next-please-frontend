import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function setup(overrides = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      title="Delete user?"
      body="This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("renders the title and body inside a modal dialog", () => {
    setup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete user?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("invokes onConfirm when the confirm button is clicked", async () => {
    const { onConfirm } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("invokes onCancel from the cancel button and the backdrop", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("does not bubble a click on the panel to the backdrop", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByText("Delete user?"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("shows a working label and disables buttons while busy", () => {
    setup({ busy: true });
    expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});

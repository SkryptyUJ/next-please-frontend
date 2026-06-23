import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("links the label to the input via the name", () => {
    render(<Field label="Email" name="email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("derives an id from the label when no name is given", () => {
    render(<Field label="First name" />);
    expect(screen.getByLabelText("First name")).toHaveAttribute(
      "id",
      "first-name",
    );
  });

  it("shows a hint but hides it once there is an error", () => {
    const { rerender } = render(<Field label="Pw" hint="8+ chars" />);
    expect(screen.getByText("8+ chars")).toBeInTheDocument();
    rerender(<Field label="Pw" hint="8+ chars" error="Too short" />);
    expect(screen.queryByText("8+ chars")).not.toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("forwards typing to onChange", async () => {
    const onChange = vi.fn();
    render(<Field label="Email" name="email" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Email"), "a");
    expect(onChange).toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("applies the primary variant by default and danger when asked", () => {
    const { rerender } = render(<Button>x</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-blue-600");
    rerender(<Button variant="danger">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-red-600");
  });

  it("merges custom className", () => {
    render(<Button className="w-full">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("fires onClick when enabled", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

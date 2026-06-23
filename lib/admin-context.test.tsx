import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminProvider, useAdmin } from "./admin-context";

function renderAdmin() {
  return renderHook(() => useAdmin(), { wrapper: AdminProvider });
}

describe("AdminProvider", () => {
  it("hydrates as empty by default", async () => {
    const { result } = renderAdmin();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.token).toBeNull();
  });

  it("hydrates an existing token from sessionStorage", async () => {
    sessionStorage.setItem("np_admin_token", "admin-tok");
    const { result } = renderAdmin();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.token).toBe("admin-tok");
  });

  it("setToken persists and clear removes the token", async () => {
    const { result } = renderAdmin();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setToken("abc"));
    expect(result.current.token).toBe("abc");
    expect(sessionStorage.getItem("np_admin_token")).toBe("abc");

    act(() => result.current.clear());
    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem("np_admin_token")).toBeNull();
  });

  it("throws when used outside a provider", () => {
    expect(() => renderHook(() => useAdmin())).toThrow(
      /must be used within an AdminProvider/,
    );
  });
});

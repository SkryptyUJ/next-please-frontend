import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("prefixes the base URL and parses a JSON body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/api/thing");

    expect(result).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/thing");
  });

  it("sets Content-Type and a Bearer header when a token is given", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/secure", { token: "abc", method: "POST" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer abc",
    });
    expect(init.method).toBe("POST");
  });

  it("omits the Authorization header when no token is provided", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/public");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("throws ApiError carrying the status and body on a non-2xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/x")).rejects.toMatchObject({
      status: 409,
      body: "nope",
    });
    await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("returns undefined for a 204 response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/empty")).resolves.toBeUndefined();
  });

  it("returns undefined for an empty 200 body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/empty200")).resolves.toBeUndefined();
  });

  it("returns the raw text when the body is not valid JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("plain text", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/text")).resolves.toBe("plain text");
  });
});

describe("ApiError", () => {
  it("includes the status and body in its message", () => {
    expect(new ApiError(404, "missing").message).toBe("HTTP 404: missing");
    expect(new ApiError(500, "").message).toBe("HTTP 500: (empty body)");
  });
});

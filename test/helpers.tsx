import { vi, type Mock } from "vitest";

// Builds a JSON Response like the backend returns. Pass `null` for an empty
// body (e.g. 201/204 with no payload).
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body == null ? "" : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function textResponse(text: string, status = 200): Response {
  return new Response(text, { status });
}

// A route table keyed by "METHOD /path" (path matched by `endsWith` so query
// strings are ignored). Returns a Response or throws to simulate a network
// failure.
export type Route = (init: RequestInit) => Response | Promise<Response>;

export function installFetch(routes: Record<string, Route>): Mock {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init.method ?? "GET").toUpperCase();
      for (const [key, handler] of Object.entries(routes)) {
        const [routeMethod, routePath] = key.split(" ");
        const path = url.split("?")[0];
        if (routeMethod === method && path.endsWith(routePath)) {
          return handler(init);
        }
      }
      throw new Error(`Unhandled fetch: ${method} ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Reads and parses the JSON body sent with a mocked fetch call.
export function parseBody(init: RequestInit): unknown {
  return init.body ? JSON.parse(init.body as string) : undefined;
}

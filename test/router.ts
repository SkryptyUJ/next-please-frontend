import { vi } from "vitest";

// A single mutable router/pathname holder shared with the global
// `next/navigation` mock (see vitest.setup.ts). Tests read `router.replace`
// etc. as spies and set the pathname via `setPathname`.
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const navState = { pathname: "/" };

export function setPathname(pathname: string) {
  navState.pathname = pathname;
}

export function resetRouter() {
  router.push.mockReset();
  router.replace.mockReset();
  router.prefetch.mockReset();
  router.back.mockReset();
  router.forward.mockReset();
  router.refresh.mockReset();
  navState.pathname = "/";
}

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { resetRouter } from "./test/router";

// Global mock for the App Router navigation hooks. The returned router and
// pathname are backed by the shared holder in ./test/router so tests can
// assert on navigation and drive the current path.
vi.mock("next/navigation", async () => {
  const mod = await import("./test/router");
  return {
    useRouter: () => mod.router,
    usePathname: () => mod.navState.pathname,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

// next/link needs the router context at runtime; in tests we only care that it
// renders a navigable anchor.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => createElement("a", { href, ...rest }, children),
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  resetRouter();
  vi.clearAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  sessionStorage.clear();
  resetRouter();
});

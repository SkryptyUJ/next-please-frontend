import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    // Specs are *.cy.ts so they don't collide with the vitest *.test.ts unit
    // suite. All backend calls are stubbed with cy.intercept (see
    // cypress/support/api.ts) — no real backend is needed.
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    // The patient screens poll every 3s as an SSE fallback; give cy.wait on
    // those polls a little headroom over Cypress's 4s default.
    defaultCommandTimeout: 6000,
  },
});

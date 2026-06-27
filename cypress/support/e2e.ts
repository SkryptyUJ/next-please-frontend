// Loaded before every E2E spec. Keep global setup here.
import "./commands";

// The patient screens open an SSE stream to /api/queue/subscribe via
// fetch-event-source. We never drive state through it in tests (the 3s polling
// fallback is the deterministic path), so stub it for every spec to keep the
// network quiet and avoid retry noise against a non-existent backend.
beforeEach(() => {
  cy.intercept("GET", "**/api/queue/subscribe", {
    statusCode: 200,
    headers: { "content-type": "text/event-stream" },
    body: "",
  });
});

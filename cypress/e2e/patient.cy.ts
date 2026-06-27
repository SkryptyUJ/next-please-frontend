import { queueStatus, ticketResponse } from "../support/api";
import type { QueueStatusResponse } from "@/lib/types";

// Frames a queue-update payload as a Server-Sent Event the way the backend
// streams it on /api/queue/subscribe.
function sseQueueUpdate(payload: QueueStatusResponse): string {
  return `event: queue-update\ndata: ${JSON.stringify(payload)}\n\n`;
}

describe("Patient flow", () => {
  it("walks from picking a type through the visit to done", () => {
    // The /wait screen polls this every 3s; the visit→done step is driven by
    // the SSE stream. Both read these mutable holders so we can advance state.
    let statusBody: QueueStatusResponse = queueStatus();
    let sseBody = "";

    cy.intercept("POST", "**/api/tickets/create", {
      statusCode: 201,
      body: ticketResponse(),
    }).as("create");
    cy.intercept("GET", "**/api/tickets/status/*", (req) =>
      req.reply(statusBody),
    ).as("status");
    cy.intercept("GET", "**/api/queue/subscribe", (req) =>
      req.reply({
        statusCode: 200,
        headers: { "content-type": "text/event-stream" },
        body: sseBody,
      }),
    ).as("sse");

    cy.visit("/");
    cy.contains("What are you here for?");
    cy.contains("button", "Consultation").click();

    // → waiting screen
    cy.wait("@create");
    cy.location("pathname").should("eq", "/wait");
    cy.contains("A-001");
    cy.contains("Waiting for a doctor to call you");

    // A doctor pairs with the ticket (CALLED), seen via the polling fallback.
    // The mutation must run inside cy.then so it is sequenced in the command
    // queue — a bare assignment would run during queueing, before any command.
    cy.then(() => {
      statusBody = queueStatus({ status: "CALLED", roomId: 1 });
    });
    cy.location("pathname").should("eq", "/visit");
    cy.contains("Your visit has started");
    cy.contains("Room 1");

    // The doctor stops the consultation → COMPLETED broadcast on the stream.
    cy.then(() => {
      sseBody = sseQueueUpdate(queueStatus({ status: "COMPLETED" }));
    });
    cy.location("pathname").should("eq", "/done");
    cy.contains("Thank you");

    cy.contains("button", "Back to start").click();
    cy.location("pathname").should("eq", "/");
  });

  it("lets a waiting patient leave the queue", () => {
    cy.intercept("POST", "**/api/tickets/create", {
      statusCode: 201,
      body: ticketResponse(),
    }).as("create");
    cy.intercept("GET", "**/api/tickets/status/*", {
      statusCode: 200,
      body: queueStatus(),
    });
    cy.intercept("POST", "**/api/tickets/*/cancel", { statusCode: 200 }).as(
      "cancel",
    );

    cy.visit("/");
    cy.contains("button", "Check-up").click();
    cy.wait("@create");
    cy.location("pathname").should("eq", "/wait");

    cy.contains("button", "Leave the queue").click();
    cy.wait("@cancel");
    cy.location("pathname").should("eq", "/");
    cy.contains("What are you here for?");
  });

  it("shows an error when the ticket cannot be created", () => {
    cy.intercept("POST", "**/api/tickets/create", {
      statusCode: 500,
      body: "Queue is full",
    }).as("create");

    cy.visit("/");
    cy.contains("button", "Urgent").click();
    cy.wait("@create");
    cy.contains("Queue is full");
    cy.location("pathname").should("eq", "/");
  });
});

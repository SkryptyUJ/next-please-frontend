import { adminDoctor, loginResponse, stubLogin } from "../support/api";
import type { AdminDoctor } from "@/lib/types";

const ADMIN_TOKEN_KEY = "np_admin_token";

// Lands directly on the panel with a seeded admin token, stubbing the two
// lists the page loads on mount.
function visitPanel(pending: AdminDoctor[], doctors: AdminDoctor[]) {
  cy.intercept("GET", "**/api/admin/doctors/pending", {
    statusCode: 200,
    body: pending,
  }).as("pending");
  cy.intercept("GET", "**/api/admin/doctors", {
    statusCode: 200,
    body: doctors,
  }).as("doctors");
  cy.visit("/admin", {
    onBeforeLoad(win) {
      win.sessionStorage.setItem(ADMIN_TOKEN_KEY, "admin-token");
    },
  });
  cy.wait(["@pending", "@doctors"]);
}

describe("Admin flow", () => {
  it("rejects a non-admin account at login", () => {
    stubLogin(loginResponse({ role: "DOCTOR" }));
    cy.visit("/admin/login");
    cy.get('input[name="email"]').type("doc@example.com");
    cy.get('input[name="password"]').type("secret123");
    cy.contains("button", "Sign in").click();
    cy.wait("@login");
    cy.contains("not an administrator");
    cy.location("pathname").should("eq", "/admin/login");
  });

  it("logs an admin in and lists pending requests and doctors", () => {
    stubLogin(loginResponse({ role: "ADMIN", email: "admin@example.com" }));
    cy.intercept("GET", "**/api/admin/doctors/pending", {
      statusCode: 200,
      body: [adminDoctor({ id: 2, status: "PENDING", email: "new@example.com" })],
    }).as("pending");
    cy.intercept("GET", "**/api/admin/doctors", {
      statusCode: 200,
      body: [adminDoctor({ id: 1, status: "ACTIVE", email: "anna@example.com" })],
    }).as("doctors");

    cy.visit("/admin/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("secret123");
    cy.contains("button", "Sign in").click();
    cy.wait("@login");

    cy.location("pathname").should("eq", "/admin");
    cy.wait(["@pending", "@doctors"]);
    cy.contains("Pending requests");
    cy.contains("new@example.com");
    cy.contains("All doctors");
    cy.contains("anna@example.com");
  });

  it("approves a pending request", () => {
    cy.intercept("POST", "**/api/admin/doctors/2/approve", {
      statusCode: 200,
    }).as("approve");
    visitPanel(
      [adminDoctor({ id: 2, status: "PENDING", email: "new@example.com" })],
      [adminDoctor({ id: 1, status: "ACTIVE", email: "anna@example.com" })],
    );

    cy.contains("li", "new@example.com").within(() => {
      cy.contains("button", "Approve").click();
    });
    cy.wait("@approve");
  });

  it("denies a pending request after confirmation", () => {
    cy.intercept("POST", "**/api/admin/doctors/2/reject", {
      statusCode: 200,
    }).as("reject");
    visitPanel(
      [adminDoctor({ id: 2, status: "PENDING", email: "new@example.com" })],
      [adminDoctor({ id: 1, status: "ACTIVE", email: "anna@example.com" })],
    );

    cy.contains("li", "new@example.com").within(() => {
      cy.contains("button", "Deny").click();
    });
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Deny request?");
      cy.contains("button", "Deny").click();
    });
    cy.wait("@reject");
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("deletes a doctor after confirmation", () => {
    cy.intercept("DELETE", "**/api/admin/users/1", { statusCode: 200 }).as(
      "delete",
    );
    visitPanel(
      [],
      [adminDoctor({ id: 1, status: "ACTIVE", email: "anna@example.com" })],
    );

    cy.contains("li", "anna@example.com").within(() => {
      cy.contains("button", "Delete").click();
    });
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Delete user?");
      cy.contains("button", "Delete").click();
    });
    cy.wait("@delete");
    cy.get('[role="dialog"]').should("not.exist");
  });
});

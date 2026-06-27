import {
  loginResponse,
  room,
  stubLogin,
  stubLoginError,
  ticketDetails,
} from "../support/api";

describe("Doctor flow", () => {
  describe("registration", () => {
    it("submits an account request", () => {
      cy.intercept("POST", "**/api/auth/register-doctor", {
        statusCode: 201,
      }).as("register");

      cy.visit("/doctor/register");
      cy.get('input[name="email"]').type("new.doc@example.com");
      cy.get('input[name="name"]').type("New");
      cy.get('input[name="surname"]').type("Doc");
      cy.get('input[name="password"]').type("hunter2hunter2");
      cy.get('input[name="confirm-password"]').type("hunter2hunter2");
      cy.contains("button", "Submit request").click();

      cy.wait("@register");
      cy.contains("Request submitted");
      cy.contains("An admin must approve your account");
    });

    it("blocks mismatched passwords before calling the API", () => {
      cy.visit("/doctor/register");
      cy.get('input[name="email"]').type("new.doc@example.com");
      cy.get('input[name="name"]').type("New");
      cy.get('input[name="surname"]').type("Doc");
      cy.get('input[name="password"]').type("hunter2hunter2");
      cy.get('input[name="confirm-password"]').type("different");
      cy.contains("button", "Submit request").click();

      cy.contains("Passwords do not match");
    });
  });

  describe("login errors", () => {
    it("explains a pending account (403)", () => {
      stubLoginError(403);
      cy.visit("/doctor/login");
      cy.get('input[name="email"]').type("pending@example.com");
      cy.get('input[name="password"]').type("secret123");
      cy.contains("button", "Sign in").click();
      cy.wait("@login");
      cy.contains("awaiting admin approval");
    });

    it("explains bad credentials (401)", () => {
      stubLoginError(401);
      cy.visit("/doctor/login");
      cy.get('input[name="email"]').type("doc@example.com");
      cy.get('input[name="password"]').type("wrong");
      cy.contains("button", "Sign in").click();
      cy.wait("@login");
      cy.contains("Wrong email or password");
    });
  });

  it("logs in, claims a room, sees a patient, stops the consultation, logs out", () => {
    stubLogin(loginResponse());
    cy.intercept("GET", "**/api/rooms/available", {
      statusCode: 200,
      body: [room({ id: 1, name: "Room 1" })],
    }).as("rooms");
    cy.intercept("POST", "**/api/rooms/1/claim", {
      statusCode: 200,
      body: room({ id: 1, name: "Room 1" }),
    }).as("claim");
    cy.intercept("GET", "**/api/doctors/available-types", {
      statusCode: 200,
      body: ["CONSULTATION"],
    }).as("types");
    cy.intercept("POST", "**/api/doctors/next-patient*", {
      statusCode: 200,
      body: ticketDetails({ id: 42, ticketName: "A-001", type: "CONSULTATION" }),
    }).as("next");
    cy.intercept("POST", "**/api/doctors/complete-patient/42", {
      statusCode: 200,
    }).as("complete");
    cy.intercept("POST", "**/api/rooms/1/release", { statusCode: 200 }).as(
      "release",
    );

    // Login
    cy.visit("/doctor/login");
    cy.get('input[name="email"]').type("doc@example.com");
    cy.get('input[name="password"]').type("secret123");
    cy.contains("button", "Sign in").click();
    cy.wait("@login");

    // Pick + claim a room
    cy.location("pathname").should("eq", "/doctor/room");
    cy.wait("@rooms");
    cy.get("select").select("Room 1");
    cy.contains("button", "Claim room").click();
    cy.wait("@claim");

    // Pick a type → paired with the next patient
    cy.location("pathname").should("eq", "/doctor/types");
    cy.contains("button", "Consultation").click();
    cy.wait("@next");

    // Visit screen
    cy.location("pathname").should("eq", "/doctor/visit");
    cy.contains("Now seeing");
    cy.contains("A-001");

    // Stop consultation → back to type picker
    cy.contains("button", "Stop consultation").click();
    cy.wait("@complete");
    cy.location("pathname").should("eq", "/doctor/types");

    // Log out releases the room
    cy.contains("button", "Log out").click();
    cy.wait("@release");
    cy.location("pathname").should("eq", "/doctor/login");
  });
});

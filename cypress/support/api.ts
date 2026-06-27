// Typed cy.intercept helpers for the next-please backend. The app calls an
// absolute base URL (NEXT_PUBLIC_API_BASE_URL, default http://localhost:8080),
// so every matcher is a `**/api/...` glob that ignores origin and query string.
import type {
  AdminDoctor,
  CreateTicketResponse,
  LoginResponse,
  QueueStatusResponse,
  RoomResponse,
  TicketDetails,
} from "@/lib/types";

/** Build a LoginResponse, defaulting to an active doctor. */
export function loginResponse(
  overrides: Partial<LoginResponse> = {},
): LoginResponse {
  return {
    token: "test-token",
    email: "doc@example.com",
    name: "Dana",
    surname: "Doctor",
    role: "DOCTOR",
    ...overrides,
  };
}

export function ticketResponse(
  overrides: Partial<CreateTicketResponse> = {},
): CreateTicketResponse {
  return { ticketNumber: "A-001", token: "patient-token", ...overrides };
}

export function queueStatus(
  overrides: Partial<QueueStatusResponse> = {},
): QueueStatusResponse {
  return {
    ticketNumber: "A-001",
    status: "WAITING",
    type: "CONSULTATION",
    positionInQueue: 3,
    queueSize: 5,
    roomId: null,
    calledAt: null,
    ...overrides,
  };
}

export function room(overrides: Partial<RoomResponse> = {}): RoomResponse {
  return {
    id: 1,
    name: "Room 1",
    isActive: true,
    doctorId: null,
    doctorName: null,
    doctorSurname: null,
    waitingQueueSize: 2,
    ...overrides,
  };
}

export function ticketDetails(
  overrides: Partial<TicketDetails> = {},
): TicketDetails {
  return {
    id: 42,
    ticketName: "A-001",
    status: "CALLED",
    createdAt: new Date().toISOString(),
    calledAt: new Date().toISOString(),
    roomId: 1,
    doctorId: 7,
    type: "CONSULTATION",
    ...overrides,
  };
}

export function adminDoctor(overrides: Partial<AdminDoctor> = {}): AdminDoctor {
  return {
    id: 1,
    email: "doc@example.com",
    name: "Dana",
    surname: "Doctor",
    status: "ACTIVE",
    ...overrides,
  };
}

/** Stub POST /api/auth/login. */
export function stubLogin(body: LoginResponse): void {
  cy.intercept("POST", "**/api/auth/login", {
    statusCode: 200,
    body,
  }).as("login");
}

/** Stub POST /api/auth/login with an error status (e.g. 401, 403). */
export function stubLoginError(statusCode: number, body = ""): void {
  cy.intercept("POST", "**/api/auth/login", { statusCode, body }).as("login");
}

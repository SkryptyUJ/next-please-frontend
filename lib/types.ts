export type Role = "DOCTOR" | "PATIENT";

export type TicketType = "CONSULTATION" | "CHECKUP" | "URGENT";

export type TicketStatus = "WAITING" | "CALLED" | "COMPLETED" | "CANCELLED";

export type LoginResponse = {
  token: string;
  email: string;
  name: string;
  surname: string;
  role: Role;
};

export type PatientTokenResponse = {
  token: string;
  ticketId: string;
};

export type CreateTicketResponse = {
  ticketNumber: string;
  token: string;
};

// GET /api/tickets/status/{id} and SSE `queue-update` payload.
// `roomId`/`calledAt` are null until a doctor pairs with the ticket.
export type QueueStatusResponse = {
  ticketNumber: string;
  status: TicketStatus;
  type: TicketType;
  positionInQueue: number;
  queueSize: number;
  roomId: number | null;
  calledAt: string | null;
};

export type RoomResponse = {
  id: number;
  name: string;
  isActive: boolean;
  doctorId: number | null;
  doctorName: string | null;
  doctorSurname: string | null;
  waitingQueueSize: number;
};

export type TicketDetails = {
  id: number;
  ticketName: string;
  status: TicketStatus;
  createdAt: string;
  calledAt: string | null;
  roomId: number | null;
  doctorId: number | null;
  type: TicketType;
};

// POST /api/doctors/next-patient response.
export type VisitResponse = {
  ticket: TicketDetails;
  visitEndsAt: string;
};

export type QueueUpdateEvent = QueueStatusResponse;

export type PatientCalledEvent = {
  ticketNumber: string;
  roomNumber: string;
  visitEndsAt: string;
};

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetch, jsonResponse, textResponse } from "@/test/helpers";
import { router } from "@/test/router";
import { DoctorProvider } from "@/lib/doctor-context";
import type { RoomResponse } from "@/lib/types";
import PickRoomPage from "./page";

const room = (id: number, name: string): RoomResponse => ({
  id,
  name,
  isActive: true,
  doctorId: null,
  doctorName: null,
  doctorSurname: null,
  waitingQueueSize: 0,
});

function renderPage() {
  return render(
    <DoctorProvider>
      <PickRoomPage />
    </DoctorProvider>,
  );
}

beforeEach(() => sessionStorage.setItem("np_doctor_token", "doc-tok"));
afterEach(() => vi.unstubAllGlobals());

describe("PickRoomPage", () => {
  it("redirects to login without a token", async () => {
    sessionStorage.clear();
    installFetch({ "GET /api/rooms/available": () => jsonResponse([]) });
    renderPage();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/login"),
    );
  });

  it("lists the available rooms", async () => {
    installFetch({
      "GET /api/rooms/available": () =>
        jsonResponse([room(1, "Room 1"), room(2, "Room 2")]),
    });
    renderPage();
    expect(await screen.findByRole("option", { name: "Room 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Room 2" })).toBeInTheDocument();
  });

  it("claims the selected room and advances to the type picker", async () => {
    installFetch({
      "GET /api/rooms/available": () => jsonResponse([room(5, "Room 5")]),
      "POST /api/rooms/5/claim": () => jsonResponse(room(5, "Room 5")),
    });
    renderPage();
    await screen.findByRole("option", { name: "Room 5" });

    await userEvent.click(screen.getByRole("button", { name: "Claim room" }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/doctor/types"),
    );
    expect(JSON.parse(sessionStorage.getItem("np_doctor_room")!)).toEqual({
      id: 5,
      name: "Room 5",
    });
  });

  it("shows a contention message and refetches on a 409 claim", async () => {
    let available = [room(5, "Room 5")];
    installFetch({
      "GET /api/rooms/available": () => jsonResponse(available),
      "POST /api/rooms/5/claim": () => {
        available = [];
        return textResponse("taken", 409);
      },
    });
    renderPage();
    await screen.findByRole("option", { name: "Room 5" });

    await userEvent.click(screen.getByRole("button", { name: "Claim room" }));

    expect(
      await screen.findByText("That room was just taken. Pick another."),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows an empty state when no rooms are free", async () => {
    installFetch({ "GET /api/rooms/available": () => jsonResponse([]) });
    renderPage();
    expect(
      await screen.findByText("No free rooms right now."),
    ).toBeInTheDocument();
  });
});

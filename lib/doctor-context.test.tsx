import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DoctorProvider, useDoctor } from "./doctor-context";

function renderDoctor() {
  return renderHook(() => useDoctor(), { wrapper: DoctorProvider });
}

describe("DoctorProvider", () => {
  it("hydrates as empty by default", async () => {
    const { result } = renderDoctor();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.token).toBeNull();
    expect(result.current.roomId).toBeNull();
    expect(result.current.visit).toBeNull();
  });

  it("hydrates token, room and visit from sessionStorage", async () => {
    sessionStorage.setItem("np_doctor_token", "doc-tok");
    sessionStorage.setItem(
      "np_doctor_room",
      JSON.stringify({ id: 7, name: "Room 7" }),
    );
    sessionStorage.setItem(
      "np_doctor_visit",
      JSON.stringify({ ticketId: 12, ticketNumber: "C-001", type: "URGENT" }),
    );

    const { result } = renderDoctor();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.token).toBe("doc-tok");
    expect(result.current.roomId).toBe(7);
    expect(result.current.roomName).toBe("Room 7");
    expect(result.current.visit).toEqual({
      ticketId: 12,
      ticketNumber: "C-001",
      type: "URGENT",
    });
  });

  it("setRoom stores id and name", async () => {
    const { result } = renderDoctor();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setRoom(3, "Room 3"));

    expect(result.current.roomId).toBe(3);
    expect(result.current.roomName).toBe("Room 3");
    expect(JSON.parse(sessionStorage.getItem("np_doctor_room")!)).toEqual({
      id: 3,
      name: "Room 3",
    });
  });

  it("setVisit then clearVisit toggles the visit without touching the room", async () => {
    const { result } = renderDoctor();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setRoom(2, "Room 2"));

    act(() =>
      result.current.setVisit({
        ticketId: 5,
        ticketNumber: "K-010",
        type: "CHECKUP",
      }),
    );
    expect(result.current.visit?.ticketId).toBe(5);

    act(() => result.current.clearVisit());
    expect(result.current.visit).toBeNull();
    expect(result.current.roomId).toBe(2);
    expect(sessionStorage.getItem("np_doctor_visit")).toBeNull();
  });

  it("clear wipes token, room and visit", async () => {
    const { result } = renderDoctor();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setToken("t"));
    act(() => result.current.setRoom(1, "Room 1"));

    act(() => result.current.clear());

    expect(result.current.token).toBeNull();
    expect(result.current.roomId).toBeNull();
    expect(sessionStorage.getItem("np_doctor_token")).toBeNull();
    expect(sessionStorage.getItem("np_doctor_room")).toBeNull();
  });
});

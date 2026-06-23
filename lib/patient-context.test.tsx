import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatientProvider, usePatient } from "./patient-context";

function renderPatient() {
  return renderHook(() => usePatient(), { wrapper: PatientProvider });
}

describe("PatientProvider", () => {
  it("hydrates as empty when sessionStorage has nothing", async () => {
    const { result } = renderPatient();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.ticketNumber).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.visit).toBeNull();
  });

  it("hydrates from existing sessionStorage values", async () => {
    sessionStorage.setItem("np_patient_ticket", "C-001");
    sessionStorage.setItem("np_patient_token", "tok");
    sessionStorage.setItem(
      "np_patient_visit",
      JSON.stringify({ roomNumber: "Room 1" }),
    );

    const { result } = renderPatient();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.ticketNumber).toBe("C-001");
    expect(result.current.token).toBe("tok");
    expect(result.current.visit).toEqual({ roomNumber: "Room 1" });
  });

  it("setTicket persists ticket + token and clears any prior visit", async () => {
    const { result } = renderPatient();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setVisit({ roomNumber: "Room 9" }));
    act(() => result.current.setTicket("K-042", "newtok"));

    expect(result.current.ticketNumber).toBe("K-042");
    expect(result.current.token).toBe("newtok");
    expect(result.current.visit).toBeNull();
    expect(sessionStorage.getItem("np_patient_ticket")).toBe("K-042");
    expect(sessionStorage.getItem("np_patient_visit")).toBeNull();
  });

  it("setVisit persists the visit", async () => {
    const { result } = renderPatient();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setVisit({ roomNumber: "Room 3" }));

    expect(result.current.visit).toEqual({ roomNumber: "Room 3" });
    expect(sessionStorage.getItem("np_patient_visit")).toBe(
      JSON.stringify({ roomNumber: "Room 3" }),
    );
  });

  it("clear wipes everything from state and sessionStorage", async () => {
    const { result } = renderPatient();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setTicket("C-001", "tok"));

    act(() => result.current.clear());

    expect(result.current.ticketNumber).toBeNull();
    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem("np_patient_ticket")).toBeNull();
    expect(sessionStorage.getItem("np_patient_token")).toBeNull();
  });
});

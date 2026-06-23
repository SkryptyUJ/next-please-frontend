import type { ReactNode } from "react";
import { PatientProvider } from "@/lib/patient-context";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PatientProvider>{children}</PatientProvider>;
}

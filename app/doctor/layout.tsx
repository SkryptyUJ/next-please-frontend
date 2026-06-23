import type { ReactNode } from "react";
import { DoctorProvider } from "@/lib/doctor-context";
import { DoctorChrome } from "./DoctorChrome";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <DoctorProvider>
      <DoctorChrome>{children}</DoctorChrome>
    </DoctorProvider>
  );
}

import type { ReactNode } from "react";
import { AdminProvider } from "@/lib/admin-context";
import { AdminChrome } from "./AdminChrome";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminProvider>
  );
}

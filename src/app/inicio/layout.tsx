import { DashboardShell } from "@/components/layout/DashboardShell";
export default function InicioLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

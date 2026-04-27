import { DashboardShell } from "@/components/layout/DashboardShell";
export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

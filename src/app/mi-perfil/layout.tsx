import { DashboardShell } from "@/components/layout/DashboardShell";

export default function MiPerfilLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable>{children}</DashboardShell>;
}

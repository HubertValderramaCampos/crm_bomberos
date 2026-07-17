import { DashboardShell } from "@/components/layout/DashboardShell";
export default function GuardiasLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable>{children}</DashboardShell>;
}

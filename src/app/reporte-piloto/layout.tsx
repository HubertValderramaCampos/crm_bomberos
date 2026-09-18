import { DashboardShell } from "@/components/layout/DashboardShell";
export default function ReportePilotoLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

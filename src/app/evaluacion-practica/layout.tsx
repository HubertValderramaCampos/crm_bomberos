import { DashboardShell } from "@/components/layout/DashboardShell";
export default function EvaluacionPracticaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

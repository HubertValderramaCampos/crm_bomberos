import { DashboardShell } from "@/components/layout/DashboardShell";
export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

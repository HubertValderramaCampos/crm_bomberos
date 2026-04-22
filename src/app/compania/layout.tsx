import { DashboardShell } from "@/components/layout/DashboardShell";
export default function CompaniaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell scrollable>{children}</DashboardShell>;
}

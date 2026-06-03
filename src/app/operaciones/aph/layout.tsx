import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function AphLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Jefe puede gestionar, bombero evaluador puede acceder al formulario
  return <DashboardShell scrollable>{children}</DashboardShell>;
}

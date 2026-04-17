import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["JEFE_COMPANIA", "INSTRUCCION"].includes(session.user.rol)) {
    redirect("/dashboard");
  }
  return <DashboardShell>{children}</DashboardShell>;
}

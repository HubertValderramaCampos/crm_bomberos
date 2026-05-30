import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function FormativaLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const categoria = session.user.categoria ?? "BOMBERO";
  const esFormativo = ["ASPIRANTE", "POSTULANTE"].includes(categoria);
  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);

  if (!esFormativo && !esAdmin) redirect("/dashboard");

  return <DashboardShell scrollable>{children}</DashboardShell>;
}

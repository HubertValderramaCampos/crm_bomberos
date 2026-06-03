import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Todos los roles pueden acceder a /operaciones/aph (evaluaciones)
  // Los demás roles operativos tienen acceso normal
  const rolPermitido = ["JEFE_COMPANIA", "OPERACIONES", "BOMBERO"].includes(session.user.rol);
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const esRutaAph = pathname.startsWith("/operaciones/aph");

  if (!rolPermitido && !esRutaAph) {
    redirect("/dashboard");
  }
  return <DashboardShell scrollable wide>{children}</DashboardShell>;
}

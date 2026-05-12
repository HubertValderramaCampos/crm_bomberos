import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { calcularRacha } from "@/lib/racha";
import { headers } from "next/headers";

// Rutas dentro de /administracion accesibles a bomberos con racha >= 4
const RUTAS_BOMBERO_RACHA = ["/administracion/donaciones", "/administracion/programacion"];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = session.user.rol;

  if (["JEFE_COMPANIA", "ADMINISTRACION"].includes(rol)) {
    return <DashboardShell scrollable>{children}</DashboardShell>;
  }

  // Bomberos con racha >= 4 pueden acceder solo a ciertas rutas
  if (rol === "BOMBERO" && session.user.bomberoId) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const rutaPermitida = RUTAS_BOMBERO_RACHA.some(r => pathname.startsWith(r));

    if (rutaPermitida) {
      const racha = await calcularRacha(session.user.bomberoId);
      if (racha.rachaActual >= 4) {
        return <DashboardShell scrollable>{children}</DashboardShell>;
      }
    }
  }

  redirect("/dashboard");
}

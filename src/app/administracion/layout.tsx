import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { calcularRacha } from "@/lib/racha";
import { headers } from "next/headers";
import pool from "@/lib/db";

// Mapa de ruta → seccion en bombero_acceso_racha
const RUTA_SECCION: Record<string, string> = {
  "/administracion/donaciones":   "donaciones",
  "/administracion/programacion": "programacion",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = session.user.rol;

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Programación es libre para todos
  if (pathname.startsWith("/administracion/programacion")) {
    return <DashboardShell scrollable>{children}</DashboardShell>;
  }

  if (["JEFE_COMPANIA", "ADMINISTRACION"].includes(rol)) {
    return <DashboardShell scrollable>{children}</DashboardShell>;
  }

  // Cuentas de área (no BOMBERO): acceso libre a sus rutas permitidas
  if (["OPERACIONES","SERVICIOS_GENERALES","INSTRUCCION","SANIDAD","IMAGEN"].includes(rol)) {
    return <DashboardShell scrollable>{children}</DashboardShell>;
  }

  // Bomberos: verificar racha mínima desde BD para otras rutas (donaciones)
  if (rol === "BOMBERO" && session.user.bomberoId) {
    const seccion = Object.entries(RUTA_SECCION).find(([ruta]) => pathname.startsWith(ruta))?.[1];

    if (seccion) {
      const configRes = await pool.query<{ racha_min: number }>(
        `SELECT racha_min FROM bombero_acceso_racha WHERE seccion = $1`, [seccion]
      );
      const rachaMin = configRes.rows[0]?.racha_min ?? 4;
      if (rachaMin === -1) redirect("/dashboard");
      const racha = await calcularRacha(session.user.bomberoId);
      if (racha.rachaActual >= rachaMin) {
        return <DashboardShell scrollable>{children}</DashboardShell>;
      }
    }
  }

  redirect("/dashboard");
}

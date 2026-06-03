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

  if (["JEFE_COMPANIA", "ADMINISTRACION"].includes(rol)) {
    return <DashboardShell scrollable>{children}</DashboardShell>;
  }

  // Bomberos: verificar racha mínima desde BD para la ruta actual
  if (rol === "BOMBERO" && session.user.bomberoId) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";

    const seccion = Object.entries(RUTA_SECCION).find(([ruta]) => pathname.startsWith(ruta))?.[1];

    if (seccion) {
      // Leer racha_min desde BD
      const configRes = await pool.query<{ racha_min: number }>(
        `SELECT racha_min FROM bombero_acceso_racha WHERE seccion = $1`, [seccion]
      );
      const rachaMin = configRes.rows[0]?.racha_min ?? 4; // fallback 4 si no está en BD

      if (rachaMin === -1) redirect("/dashboard"); // bloqueado explícitamente

      const racha = await calcularRacha(session.user.bomberoId);
      if (racha.rachaActual >= rachaMin) {
        return <DashboardShell scrollable>{children}</DashboardShell>;
      }
    }
  }

  redirect("/dashboard");
}

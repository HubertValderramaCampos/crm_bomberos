import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReporteFormativoClient } from "@/components/ui-custom/ReporteFormativoClient";

export default async function ReporteFormativoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Solo instrucción y jefatura/administración ven las asistencias de todos
  // los aspirantes y postulantes. El resto (incluidos aspirantes/postulantes)
  // solo debe ver su propia asistencia, en /formativa/inicio.
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session.user.rol)) {
    redirect("/formativa/inicio");
  }

  return <ReporteFormativoClient />;
}

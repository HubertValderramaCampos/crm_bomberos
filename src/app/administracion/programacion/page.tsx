import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { ProgramacionCalendario } from "@/components/ui-custom/ProgramacionCalendario";

export default async function ProgramacionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const puedeCrear = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={CalendarDays} title="Programación de Actividades" subtitle="Calendario de actividades y capacitaciones" />
      <ProgramacionCalendario puedeCrear={puedeCrear} />
    </div>
  );
}

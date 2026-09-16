import { esRolJefe } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { EvaluacionPracticaEditoresClient } from "@/components/ui-custom/EvaluacionPracticaEditoresClient";

export default async function EvaluacionPracticaEditoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!esRolJefe(session.user.rol)) redirect("/evaluacion-practica");

  return (
    <div className="space-y-4 pb-6 max-w-2xl">
      <PageHeader
        icon={Users}
        title="Quién puede llenar evaluaciones"
        subtitle="Operaciones y Jefes ya pueden llenarlas. Autoriza aquí a otras personas puntuales."
      />
      <EvaluacionPracticaEditoresClient />
    </div>
  );
}

import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { PermisosGestion } from "@/components/ui-custom/PermisosGestion";

export default async function PermisosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!ROLES_JEFE.includes(session.user.rol)) redirect("/dashboard");

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={Lock}
        title="Gestión de Permisos"
        subtitle="Controla el rol y accesos de cada cuenta del sistema"
      />
      <PermisosGestion selfId={Number(session.user.id)} />
    </div>
  );
}

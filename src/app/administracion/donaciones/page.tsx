import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { DonacionesGestion } from "@/components/ui-custom/DonacionesGestion";

export default async function DonacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const esAdmin = ROLES_JEFE.includes(session.user.rol);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={Gift} title="Donaciones" subtitle="Registro y seguimiento de donaciones recibidas" />
      <DonacionesGestion esAdmin={esAdmin} />
    </div>
  );
}

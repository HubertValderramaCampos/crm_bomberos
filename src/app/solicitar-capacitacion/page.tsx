import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { EscanerDocumento } from "@/components/ui-custom/EscanerDocumento";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function SolicitarCapacitacionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);

  return (
    <DashboardShell>
      <div className="space-y-4 pb-6">
        <PageHeader
          icon={ScanLine}
          title="Subir Documento"
          subtitle={esAdmin
            ? "Gestiona y clasifica documentos recibidos"
            : "Fotografía o sube un documento y la IA lo clasificará automáticamente"}
        />
        <EscanerDocumento esAdmin={esAdmin} />
      </div>
    </DashboardShell>
  );
}

import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { DocumentosVista } from "@/components/ui-custom/DocumentosVista";
import pool from "@/lib/db";
import { obtenerUrlFirmada } from "@/lib/storage";

async function getData() {
  const { rows } = await pool.query(`
    SELECT s.*, e.nombre AS entidad_nombre
    FROM solicitud_capacitacion s
    LEFT JOIN entidad e ON e.id = s.entidad_id
    ORDER BY s.creado_en DESC
  `);

  return Promise.all(
    rows.map(async (row) => {
      if (row.imagen_key) {
        try { row.imagen_url = await obtenerUrlFirmada(row.imagen_key, 3600); }
        catch { row.imagen_url = null; }
      }
      return row;
    })
  );
}

export default async function ComercialDocumentosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"].includes(session.user.rol)) {
    redirect("/dashboard");
  }

  const esAdmin = ROLES_JEFE.includes(session.user.rol);
  const documentos = await getData().catch(() => []);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={FileText}
        title="Oficios y Documentos"
        subtitle="Gestión de oficios institucionales y varios"
      />
      <DocumentosVista documentos={documentos} esAdmin={esAdmin} />
    </div>
  );
}

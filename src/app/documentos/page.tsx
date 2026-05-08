import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DocumentosTabla } from "@/components/ui-custom/DocumentosTabla";
import pool from "@/lib/db";
import { obtenerUrlFirmada } from "@/lib/storage";

export default async function DocumentosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);

  const { rows } = await pool.query(`
    SELECT s.*, e.nombre AS entidad_nombre
    FROM solicitud_capacitacion s
    LEFT JOIN entidad e ON e.id = s.entidad_id
    ${!esAdmin ? "WHERE s.subido_por_nombre = $1" : ""}
    ORDER BY s.creado_en DESC
  `, !esAdmin ? [session.user.nombres ?? ""] : []);

  const documentos = await Promise.all(
    rows.map(async (row) => {
      if (row.imagen_key) {
        try { row.imagen_url = await obtenerUrlFirmada(row.imagen_key, 3600); }
        catch { row.imagen_url = null; }
      }
      return row;
    })
  );

  return (
    <DashboardShell>
      <div className="space-y-4 pb-6">
        <PageHeader
          icon={FileText}
          title="Documentos"
          subtitle={`${documentos.length} documento${documentos.length !== 1 ? "s" : ""} registrado${documentos.length !== 1 ? "s" : ""}`}
        />
        <DocumentosTabla documentos={documentos} esAdmin={esAdmin} />
      </div>
    </DashboardShell>
  );
}

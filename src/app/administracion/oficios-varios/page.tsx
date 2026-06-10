import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import pool from "@/lib/db";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { obtenerUrlFirmada } from "@/lib/storage";
import { DocumentosVista } from "@/components/ui-custom/DocumentosVista";

export default async function OficiosVariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const esAdmin = ROLES_JEFE.includes(session.user.rol);

  const { rows } = await pool.query(`
    SELECT s.*, e.nombre AS entidad_nombre
    FROM solicitud_capacitacion s
    LEFT JOIN entidad e ON e.id = s.entidad_id
    WHERE s.tipo_documento = 'oficio'
      AND (s.subtipo_oficio = 'VARIOS' OR s.subtipo_oficio IS NULL)
    ORDER BY s.creado_en DESC
  `);

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
    <div className="space-y-4 pb-6">
      <PageHeader icon={FileText} title="Oficios Varios" subtitle="Oficios de otras instituciones y particulares" />
      <DocumentosVista documentos={documentos} esAdmin={esAdmin} vistaOficio="varios" />
    </div>
  );
}

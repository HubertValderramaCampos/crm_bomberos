import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { SociosEstrategicos } from "@/components/ui-custom/SociosEstrategicos";
import pool from "@/lib/db";

async function getData() {
  const { rows } = await pool.query<{
    id: number; empresa: string; tipo_proceso: string; contacto: string | null;
    telefono: string | null; correo: string | null; estado: string; notas: string | null;
    clasificacion_id: number | null; tamano: string | null; tipo_apoyo: string | null; nivel: string | null;
  }>(`
    SELECT s.id, s.empresa, s.tipo_proceso, s.contacto, s.telefono, s.correo,
           s.estado, s.notas,
           c.id AS clasificacion_id, c.tamano, c.tipo_apoyo, c.nivel
    FROM socio_estrategico s
    LEFT JOIN clasificacion_socio c ON c.socio_id = s.id
    ORDER BY s.empresa
  `);
  return rows;
}

export default async function SociosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const puedeAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const socios = await getData().catch(() => []);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={Briefcase}
        title="Socios Estratégicos"
        subtitle={`${socios.length} registrados`}
      />
      <SociosEstrategicos socios={socios} puedeAdmin={puedeAdmin} />
    </div>
  );
}

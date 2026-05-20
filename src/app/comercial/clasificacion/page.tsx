import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { ClasificacionSocios } from "@/components/ui-custom/ClasificacionSocios";
import pool from "@/lib/db";

async function getData() {
  const [{ rows: clasificaciones }, { rows: socios }] = await Promise.all([
    pool.query<{
      id: number; socio_id: number; socio_empresa: string;
      tamano: string; tipo_apoyo: string; nivel: string; descripcion: string | null;
    }>(`
      SELECT c.id, c.socio_id, c.tamano, c.tipo_apoyo, c.nivel, c.descripcion,
             s.empresa AS socio_empresa
      FROM clasificacion_socio c
      JOIN socio_estrategico s ON s.id = c.socio_id
      ORDER BY s.empresa
    `),
    pool.query<{ id: number; empresa: string }>(`
      SELECT id, empresa FROM socio_estrategico ORDER BY empresa
    `),
  ]);
  return { clasificaciones, socios };
}

export default async function ClasificacionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const puedeAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const { clasificaciones, socios } = await getData().catch(() => ({ clasificaciones: [], socios: [] }));

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={Tag}
        title="Clasificación de Socios"
        subtitle={`${clasificaciones.length} clasificaciones registradas`}
      />
      <ClasificacionSocios clasificaciones={clasificaciones} socios={socios} puedeAdmin={puedeAdmin} />
    </div>
  );
}

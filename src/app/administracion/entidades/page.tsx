import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { EntidadesDirectorio } from "@/components/ui-custom/EntidadesDirectorio";
import pool from "@/lib/db";

async function getData() {
  const { rows } = await pool.query<{
    id: number; nombre: string; tipo: string; contacto: string | null;
    telefono: string | null; correo: string | null;
    total_actividades: number; total_oficios: number; total_donaciones: number;
  }>(`
    SELECT e.id, e.nombre, e.tipo, e.contacto, e.telefono, e.correo,
      (SELECT COUNT(*) FROM programacion_actividad WHERE entidad_id = e.id)::int AS total_actividades,
      (SELECT COUNT(*) FROM oficio_institucional    WHERE entidad_id = e.id)::int +
      (SELECT COUNT(*) FROM oficio_varios           WHERE entidad_id = e.id)::int AS total_oficios,
      (SELECT COUNT(*) FROM donacion                WHERE entidad_id = e.id)::int AS total_donaciones
    FROM entidad e ORDER BY e.nombre
  `);
  return rows;
}

export default async function EntidadesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const puedeCrear = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const entidades  = await getData().catch(() => []);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={Building2} title="Empresas e Instituciones" subtitle={`${entidades.length} registradas`} />
      <EntidadesDirectorio entidades={entidades} puedeCrear={puedeCrear} />
    </div>
  );
}

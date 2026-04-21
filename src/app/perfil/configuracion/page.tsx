import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { Settings, ArrowLeft } from "lucide-react";
import { PerfilEditForm } from "@/components/ui-custom/PerfilEditForm";

async function getDatosEditables(bomberoId: number) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{
      fecha_nacimiento: string | null;
      correo: string | null;
      telefono: string | null;
      contacto_emergencia_nombre: string | null;
      contacto_emergencia_telefono: string | null;
    }>(`
      SELECT fecha_nacimiento::text, correo, telefono,
             contacto_emergencia_nombre, contacto_emergencia_telefono
      FROM bombero WHERE id = $1
    `, [bomberoId]);
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.bomberoId) redirect("/inicio");

  const datos = await getDatosEditables(session.user.bomberoId!).catch(() => null);
  if (!datos) redirect("/perfil");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/perfil"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mi perfil
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          Configuración de perfil
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Actualiza tus datos de contacto y cambia tu contraseña
        </p>
      </div>

      <PerfilEditForm datos={datos} />
    </div>
  );
}

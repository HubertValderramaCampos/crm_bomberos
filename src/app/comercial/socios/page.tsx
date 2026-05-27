import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Briefcase, Gift, Building2, Phone, Mail, User, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import pool from "@/lib/db";

async function getData() {
  const { rows } = await pool.query<{
    id: number; nombre: string; tipo: string;
    contacto: string | null; telefono: string | null; correo: string | null;
    total_donaciones: number; ultima_donacion: string | null;
  }>(`
    SELECT e.id, e.nombre, e.tipo, e.contacto, e.telefono, e.correo,
           COUNT(d.id)::int AS total_donaciones,
           MAX(d.fecha::text) AS ultima_donacion
    FROM entidad e
    JOIN donacion d ON d.entidad_id = e.id
    GROUP BY e.id, e.nombre, e.tipo, e.contacto, e.telefono, e.correo
    ORDER BY total_donaciones DESC, e.nombre
  `);
  return rows;
}

const TIPO_COLOR: Record<string, string> = {
  "EMPRESA":             "bg-blue-100 text-blue-700",
  "INSTITUCIÓN PÚBLICA": "bg-purple-100 text-purple-700",
  "ONG":                 "bg-green-100 text-green-700",
  "HOSPITAL":            "bg-red-100 text-red-700",
  "MUNICIPALIDAD":       "bg-amber-100 text-amber-700",
  "OTRO":                "bg-gray-100 text-gray-600",
};

function formatFecha(s: string) {
  return new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function SociosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) redirect("/dashboard");

  const socios = await getData().catch(() => []);
  const totalDonaciones = socios.reduce((s, e) => s + e.total_donaciones, 0);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={Briefcase}
        title="Socios Estratégicos"
        subtitle="Entidades que han realizado donaciones a la compañía"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Socios</p>
          <p className="text-2xl font-bold text-gray-700">{socios.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Total donaciones</p>
          <p className="text-2xl font-bold text-green-600">{totalDonaciones}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Última donación</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {socios[0]?.ultima_donacion ? formatFecha(socios[0].ultima_donacion) : "—"}
          </p>
        </div>
      </div>

      {/* Lista */}
      {socios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aún no hay entidades donantes registradas.</p>
          <p className="text-xs text-gray-400 mt-1">Las donaciones se registran en Gestión Administrativa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socios.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight truncate">{s.nombre}</p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIPO_COLOR[s.tipo] ?? TIPO_COLOR["OTRO"]}`}>
                    {s.tipo}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {s.contacto && <p className="text-xs text-gray-600 flex items-center gap-1.5"><User    className="w-3 h-3 text-gray-400 shrink-0" />{s.contacto}</p>}
                {s.telefono && <p className="text-xs text-gray-600 flex items-center gap-1.5"><Phone   className="w-3 h-3 text-gray-400 shrink-0" />{s.telefono}</p>}
                {s.correo   && <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-gray-400 shrink-0" />{s.correo}</p>}
                {!s.contacto && !s.telefono && !s.correo && (
                  <p className="text-xs text-gray-400 italic">Sin datos de contacto</p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-green-600">
                  <Gift className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{s.total_donaciones}</span>
                  <span className="text-xs text-gray-400">donación{s.total_donaciones !== 1 ? "es" : ""}</span>
                </div>
                {s.ultima_donacion && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays className="w-3 h-3" />
                    {formatFecha(s.ultima_donacion)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

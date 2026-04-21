import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import {
  User, Clock, CalendarCheck, Siren, BookOpen, ShieldCheck,
  Phone, Mail, UserCircle2, Settings,
} from "lucide-react";
import { HORAS_REGLAMENTO } from "@/lib/reglamento";

const MESES_ES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface BomberoRow {
  id: number; codigo: string; grado: string; apellidos: string; nombres: string;
  dni: string | null; foto_url: string | null; fecha_ingreso: string | null;
  fecha_nacimiento: string | null;
  correo: string | null; telefono: string | null;
  contacto_emergencia_nombre: string | null; contacto_emergencia_telefono: string | null;
  activo: boolean; estado_actual: string | null;
}

async function getPerfilData(bomberoId: number) {
  const client = await pool.connect();
  try {
    const [bombero, historial, emergencias, cursos] = await Promise.all([

      client.query<BomberoRow>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres, b.dni,
               b.foto_url, b.fecha_ingreso::text, b.fecha_nacimiento::text,
               b.correo, b.telefono,
               b.contacto_emergencia_nombre, b.contacto_emergencia_telefono,
               b.activo,
               CASE WHEN bea.estado ILIKE '%turno%' THEN 'en_turno'
                    ELSE NULL END AS estado_actual
        FROM bombero b
        LEFT JOIN bombero_estado_actual bea ON bea.bombero_id = b.id
        WHERE b.id = $1
      `, [bomberoId]),

      client.query<{
        mes: number; anio: number; dias_asistidos: number;
        dias_guardia: number; horas_acumuladas: number; num_emergencias: number;
      }>(`
        SELECT mes, anio, dias_asistidos, dias_guardia, horas_acumuladas, num_emergencias
        FROM asistencia_mensual WHERE bombero_id = $1
        ORDER BY anio DESC, mes DESC LIMIT 12
      `, [bomberoId]),

      client.query<{
        numero_parte: string; tipo_desc: string | null; tipo_raw: string;
        fecha_salida: string | null; fecha_despacho: string | null; direccion: string | null;
      }>(`
        SELECT e.numero_parte,
               te.descripcion AS tipo_desc, e.tipo AS tipo_raw,
               e.fecha_salida::text, e.fecha_despacho::text, e.direccion
        FROM emergencia_efectivo ee
        JOIN emergencia e ON e.id = ee.emergencia_id
        LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ee.bombero_id = $1
        ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho) DESC NULLS LAST
        LIMIT 20
      `, [bomberoId]),

      client.query<{
        nombre: string; institucion: string | null; horas: number | null;
        fecha_inicio: string; aprobado: boolean | null;
      }>(`
        SELECT ce.nombre, ce.institucion, ce.horas, bc.fecha_inicio::text, bc.aprobado
        FROM bombero_curso bc
        JOIN curso_externo ce ON ce.id = bc.curso_id
        WHERE bc.bombero_id = $1
        ORDER BY bc.fecha_inicio DESC
      `, [bomberoId]),
    ]);

    return {
      bombero:     bombero.rows[0] ?? null,
      historial:   historial.rows,
      emergencias: emergencias.rows,
      cursos:      cursos.rows,
    };
  } finally {
    client.release();
  }
}

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.bomberoId) redirect("/inicio");

  const { bomberoId } = session.user;
  const { bombero, historial, emergencias, cursos } = await getPerfilData(bomberoId!).catch(() => ({
    bombero: null, historial: [], emergencias: [], cursos: [],
  }));

  if (!bombero) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">No se encontró tu perfil. Contacta a Administración.</p>
    </div>
  );

  const ultimoMes = historial[0];
  const totalHoras = historial.reduce((s, h) => s + (h.horas_acumuladas ?? 0), 0);
  const meta = HORAS_REGLAMENTO[bombero.grado] ?? 20;
  const pct = ultimoMes ? Math.min(100, Math.round(((ultimoMes.horas_acumuladas ?? 0) / meta) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xl font-bold text-red-700 overflow-hidden">
          {bombero.foto_url
            ? <img src={bombero.foto_url} alt="foto" className="w-full h-full object-cover" />
            : `${bombero.apellidos.trim()[0]}${bombero.nombres[0]}`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{bombero.grado}</p>
          <h1 className="text-xl font-bold text-gray-900 truncate">{bombero.apellidos.trim()}, {bombero.nombres}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
            <span className="font-mono font-medium text-gray-600">{bombero.codigo}</span>
            {bombero.dni && <span>DNI {bombero.dni}</span>}
            {bombero.fecha_ingreso && (
              <span>Ingreso: {new Date(bombero.fecha_ingreso).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            bombero.estado_actual === "en_turno"
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            {bombero.estado_actual === "en_turno" ? "En turno" : "Franco"}
          </span>
          <Link
            href="/perfil/configuracion"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Editar datos
          </Link>
        </div>
      </div>

      {/* Datos de contacto (lectura) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCircle2 className="w-4 h-4 text-gray-400" />
          Información de contacto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Correo</p>
              <p className="text-gray-800 font-medium">{bombero.correo ?? <span className="text-gray-400 italic">No registrado</span>}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
              <p className="text-gray-800 font-medium">{bombero.telefono ?? <span className="text-gray-400 italic">No registrado</span>}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Contacto de emergencia</p>
              <p className="text-gray-800 font-medium">
                {bombero.contacto_emergencia_nombre
                  ? `${bombero.contacto_emergencia_nombre}${bombero.contacto_emergencia_telefono ? ` · ${bombero.contacto_emergencia_telefono}` : ""}`
                  : <span className="text-gray-400 italic">No registrado</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Clock,         label: "Horas últ. mes", value: ultimoMes ? `${ultimoMes.horas_acumuladas}h` : "—", sub: `Meta: ${meta}h · ${pct}%` },
          { icon: CalendarCheck, label: "Días últ. mes",  value: ultimoMes?.dias_asistidos ?? "—",    sub: ultimoMes ? `${MESES_ES[ultimoMes.mes]} ${ultimoMes.anio}` : "sin datos" },
          { icon: Siren,         label: "Emergencias",    value: emergencias.length,                  sub: "registradas" },
          { icon: BookOpen,      label: "Cursos",         value: cursos.length,                       sub: "completados" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Progreso reglamentario */}
      {ultimoMes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Cumplimiento reglamentario</h2>
              <p className="text-xs text-gray-400 mt-0.5">{MESES_ES[ultimoMes.mes]} {ultimoMes.anio} · Meta: {meta}h para {bombero.grado}</p>
            </div>
            <span className={`text-2xl font-bold ${pct >= 100 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
              {pct}%
            </span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-400">
            <span>{ultimoMes.horas_acumuladas}h acumuladas</span>
            <span>{Math.max(0, meta - (ultimoMes.horas_acumuladas ?? 0))}h restantes</span>
          </div>
        </div>
      )}

      {/* Historial mensual */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Historial de asistencia</h2>
          <p className="text-xs text-gray-400 mt-0.5">Total: {totalHoras}h en {historial.length} meses</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Mes","Días asist.","Guardias","Horas","Cumpl.","Emergencias"].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historial.map((h, i) => {
                const p = Math.min(100, Math.round(((h.horas_acumuladas ?? 0) / meta) * 100));
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700 text-xs">{MESES_ES[h.mes]} {h.anio}</td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{h.dias_asistidos ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{h.dias_guardia ?? "—"}</td>
                    <td className="px-5 py-3 font-bold text-gray-900 text-xs">{h.horas_acumuladas ?? "—"}h</td>
                    <td className="px-5 py-3 text-xs">
                      <span className={`font-semibold ${p >= 100 ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-500"}`}>
                        {p}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{h.num_emergencias ?? "—"}</td>
                  </tr>
                );
              })}
              {historial.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Sin historial disponible.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergencias recientes */}
      {emergencias.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Emergencias registradas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{emergencias.length} partes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["N.° Parte","Tipo","Fecha","Dirección"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emergencias.map((e, i) => {
                  const fecha = e.fecha_salida ?? e.fecha_despacho;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-500">{e.numero_parte}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 max-w-[220px]"><p className="truncate">{e.tipo_desc ?? e.tipo_raw}</p></td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fecha ? new Date(fecha).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px]"><p className="truncate">{e.direccion ?? "—"}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cursos */}
      {cursos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Cursos y capacitaciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Curso","Institución","Horas","Fecha","Estado"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cursos.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs font-medium text-gray-900 max-w-[200px]"><p className="truncate">{c.nombre}</p></td>
                    <td className="px-5 py-3 text-xs text-gray-500">{c.institucion ?? "—"}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-gray-700">{c.horas ? `${c.horas}h` : "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(c.fecha_inicio).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        c.aprobado ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {c.aprobado ? "Aprobado" : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">Solo tú puedes ver y editar esta información. Para cambios en datos institucionales comunícate con Administración.</p>
      </div>

    </div>
  );
}

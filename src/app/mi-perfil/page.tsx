import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, CalendarCheck, Siren, BookOpen, Clock, ShieldCheck } from "lucide-react";
import pool from "@/lib/db";

interface BomberoDetalle {
  id: number;
  codigo: string;
  grado: string;
  apellidos: string;
  nombres: string;
  dni: string | null;
  foto_url: string | null;
  fecha_ingreso: string | null;
  activo: boolean;
  estado_actual: string | null;
  estado_desde: string | null;
}

interface AsistenciaRow {
  fecha: string;
  hora_ingreso: string;
  hora_salida: string | null;
  cantidad_horas: number | null;
}

interface EmergenciaRow {
  numero_parte: string;
  tipo_desc: string | null;
  tipo_raw: string;
  fecha_salida: string | null;
  rol: string | null;
  direccion: string | null;
}

interface CursoRow {
  nombre: string;
  institucion: string | null;
  tipo: string | null;
  horas: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  aprobado: boolean | null;
}

async function getBomberoData(bomberoId: number) {
  const client = await pool.connect();
  try {
    const [detalle, asistencia, emergencias, cursos] = await Promise.all([
      client.query<BomberoDetalle>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres, b.dni,
               b.foto_url, b.fecha_ingreso::text, b.activo,
               CASE WHEN bea.estado ILIKE '%turno%' THEN 'en_turno'
                    WHEN bea.estado ILIKE '%franco%' THEN 'franco'
                    ELSE bea.estado END AS estado_actual,
               bea.desde::text AS estado_desde
        FROM bombero b
        LEFT JOIN bombero_estado_actual bea ON bea.bombero_id = b.id
        WHERE b.id = $1
      `, [bomberoId]),

      client.query<AsistenciaRow>(`
        SELECT fecha::text, hora_ingreso::text, hora_salida::text, cantidad_horas
        FROM asistencia_diaria
        WHERE bombero_id = $1
        ORDER BY fecha DESC
        LIMIT 30
      `, [bomberoId]),

      client.query<EmergenciaRow>(`
        SELECT e.numero_parte,
               te.descripcion AS tipo_desc, e.tipo AS tipo_raw,
               e.fecha_salida::text,
               ee.rol,
               e.direccion
        FROM emergencia_efectivo ee
        JOIN emergencia e ON e.id = ee.emergencia_id
        LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ee.bombero_id = $1
        ORDER BY e.fecha_salida DESC NULLS LAST
        LIMIT 20
      `, [bomberoId]),

      client.query<CursoRow>(`
        SELECT ce.nombre, ce.institucion, ce.tipo, ce.horas,
               bc.fecha_inicio::text, bc.fecha_fin::text, bc.aprobado
        FROM bombero_curso bc
        JOIN curso_externo ce ON ce.id = bc.curso_id
        WHERE bc.bombero_id = $1
        ORDER BY bc.fecha_inicio DESC
      `, [bomberoId]),
    ]);

    return {
      bombero:      detalle.rows[0] ?? null,
      asistencia:   asistencia.rows,
      emergencias:  emergencias.rows,
      cursos:       cursos.rows,
    };
  } finally {
    client.release();
  }
}

export default async function MiPerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Solo bomberos y jefe pueden ver esta página
  const { rol, bomberoId } = session.user;
  if (rol !== "BOMBERO" && rol !== "JEFE_COMPANIA") redirect("/dashboard");
  if (!bomberoId) redirect("/dashboard");

  const { bombero, asistencia, emergencias, cursos } = await getBomberoData(bomberoId).catch(() => ({
    bombero: null, asistencia: [], emergencias: [], cursos: [],
  }));

  if (!bombero) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">No se encontró información del efectivo.</p>
      </div>
    );
  }

  const totalHoras = asistencia.reduce((s, a) => s + (Number(a.cantidad_horas) || 0), 0);
  const asistenciaMes = asistencia.filter((a) => {
    const fecha = new Date(a.fecha);
    const hoy = new Date();
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  }).length;

  const estadoBadge = bombero.estado_actual === "en_turno"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header perfil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shrink-0 overflow-hidden">
          {bombero.foto_url
            ? <img src={bombero.foto_url} alt="foto" className="w-full h-full object-cover" />
            : <User className="w-8 h-8 text-red-700" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{bombero.grado}</p>
          <h1 className="text-xl font-bold text-gray-900 truncate">{bombero.apellidos}, {bombero.nombres}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 font-mono font-medium">{bombero.codigo}</span>
            {bombero.dni && <span className="text-xs text-gray-400">DNI {bombero.dni}</span>}
            {bombero.fecha_ingreso && (
              <span className="text-xs text-gray-400">
                Ingreso: {new Date(bombero.fecha_ingreso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${estadoBadge}`}>
          {bombero.estado_actual === "en_turno" ? "En Turno" : "Franco"}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Asistencias Mes</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{asistenciaMes}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Horas Totales</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalHoras.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Siren className="w-4 h-4 text-red-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Emergencias</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{emergencias.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cursos</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{cursos.length}</p>
        </div>
      </div>

      {/* Asistencia */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Registro de Asistencia</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimas {asistencia.length} guardias</p>
        </div>
        {asistencia.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin registros de asistencia aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Fecha", "Ingreso", "Salida", "Horas"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {asistencia.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700 font-medium text-xs">
                      {new Date(a.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{a.hora_ingreso}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{a.hora_salida ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700 font-semibold text-xs">
                      {a.cantidad_horas != null ? `${Number(a.cantidad_horas).toFixed(1)}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergencias */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Emergencias Atendidas</h2>
          <p className="text-xs text-gray-400 mt-0.5">{emergencias.length} partes registrados</p>
        </div>
        {emergencias.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin emergencias registradas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["N.° Parte", "Tipo", "Fecha", "Rol", "Dirección"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emergencias.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 font-medium whitespace-nowrap">{e.numero_parte}</td>
                    <td className="px-5 py-3 text-gray-800 max-w-xs">
                      <p className="truncate text-xs">{e.tipo_desc ?? e.tipo_raw}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {e.fecha_salida
                        ? new Date(e.fecha_salida).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium capitalize">
                        {e.rol ?? "efectivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px]">
                      <p className="truncate">{e.direccion ?? "—"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cursos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cursos y Capacitaciones</h2>
          <p className="text-xs text-gray-400 mt-0.5">{cursos.length} cursos registrados</p>
        </div>
        {cursos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin cursos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Curso", "Institución", "Tipo", "Horas", "Fecha", "Estado"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cursos.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px]">
                      <p className="truncate text-xs">{c.nombre}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.institucion ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.tipo ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700 text-xs font-semibold">{c.horas != null ? `${c.horas}h` : "—"}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(c.fecha_inicio).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        c.aprobado ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                      }`}>
                        {c.aprobado ? "Aprobado" : "No aprobado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nota de privacidad */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">Solo tú puedes ver esta información. Cualquier consulta comunícate con Administración.</p>
      </div>

    </div>
  );
}

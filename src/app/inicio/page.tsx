import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { MascotaHero } from "@/components/ui-custom/MascotaHero";
import { ProgresoCard } from "@/components/ui-custom/ProgresoCard";
import { HORAS_REGLAMENTO } from "@/lib/reglamento";
import { calcularRacha } from "@/lib/racha";
import {
  Users, Siren, Clock, Truck, ShieldCheck,
  CalendarCheck, AlertTriangle, Award,
} from "lucide-react";
import Link from "next/link";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

async function getInicioData(usuarioId: string, bomberoId: number | null) {
  const now    = new Date();
  const mesHoy = now.getMonth() + 1;
  const anioHoy = now.getFullYear();

  // Si el mes actual ya tiene datos úsalo, si no cae al último mes con datos
  const hayMesActualRes = await pool.query<{ existe: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM asistencia_mensual WHERE mes = $1 AND anio = $2) AS existe`,
    [mesHoy, anioHoy]
  );
  const hayMesActual = hayMesActualRes.rows[0]?.existe ?? false;

  let mes: number, anioMes: number;
  if (hayMesActual) {
    mes = mesHoy; anioMes = anioHoy;
  } else {
    const ultimoRes = await pool.query<{ mes: number; anio: number }>(
      `SELECT mes, anio FROM asistencia_mensual ORDER BY anio DESC, mes DESC LIMIT 1`
    );
    ({ mes, anio: anioMes } = ultimoRes.rows[0] ?? { mes: mesHoy, anio: anioHoy });
  }

  const [
    ecRes, bomberos, enTurno, vehiculosRes,
    emergAnio, emergActivas, emergMes,
    asistMes, ranking, miAsistencia,
    bomberoNombre, vehiculosDetalle,
  ] = await Promise.all([

    pool.query<{
      estado_general: string | null; personal_disponible: number | null;
      pilotos_disponibles: number | null; primer_jefe: string | null;
      segundo_jefe: string | null; created_at: string;
    }>(`SELECT estado_general, personal_disponible, pilotos_disponibles,
               primer_jefe, segundo_jefe, created_at
        FROM estado_compania ORDER BY created_at DESC LIMIT 1`),

    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM bombero WHERE activo = true`),

    pool.query<{ count: string }>(`
      SELECT COUNT(*) FROM asistencia_turno
      WHERE estado_compania_id = (SELECT id FROM estado_compania ORDER BY created_at DESC LIMIT 1)
    `),

    pool.query<{ estado: string; motivo: string | null; count: string }>(
      `SELECT estado, motivo, COUNT(*) FROM vehiculo GROUP BY estado, motivo`),

    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM emergencia
       WHERE EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $1`, [anioHoy]),

    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM emergencia
       WHERE estado = 'ATENDIENDO'
         AND fecha_ingreso IS NULL
         AND COALESCE(fecha_salida, fecha_despacho) >= NOW() - INTERVAL '24 hours'`),

    pool.query<{ count: string; total_efectivos: string }>(
      `SELECT COUNT(*) AS count, COALESCE(SUM(numero_efectivos),0) AS total_efectivos
       FROM emergencia
       WHERE DATE_TRUNC('month', COALESCE(fecha_salida,fecha_despacho,created_at)) = DATE_TRUNC('month', CURRENT_DATE)`),

    pool.query<{ horas: string; emerg: string; activos: string; dias: string }>(
      `SELECT COALESCE(SUM(horas_acumuladas),0) AS horas,
              COALESCE(SUM(num_emergencias),0)  AS emerg,
              COUNT(DISTINCT bombero_id)         AS activos,
              COALESCE(AVG(dias_asistidos),0)    AS dias
       FROM asistencia_mensual WHERE mes = $1 AND anio = $2`, [mes, anioMes]),

    pool.query<{
      id: number; apellidos: string; nombres: string; grado: string; codigo: string;
      horas_acumuladas: number; dias_asistidos: number; num_emergencias: number;
    }>(`SELECT b.id, b.apellidos, b.nombres, b.grado, b.codigo,
               am.horas_acumuladas, am.dias_asistidos, am.num_emergencias
        FROM asistencia_mensual am
        JOIN bombero b ON b.id = am.bombero_id
        WHERE am.mes = $1 AND am.anio = $2 AND b.activo = true AND am.horas_acumuladas > 0
        ORDER BY am.horas_acumuladas DESC LIMIT 10`, [mes, anioMes]),

    bomberoId ? pool.query<{
      horas_acumuladas: number; dias_asistidos: number; num_emergencias: number; grado: string;
    }>(`SELECT am.horas_acumuladas, am.dias_asistidos, am.num_emergencias, b.grado
        FROM asistencia_mensual am JOIN bombero b ON b.id = am.bombero_id
        WHERE am.bombero_id = $1 AND am.mes = $2 AND am.anio = $3`,
      [bomberoId, mes, anioMes]) : Promise.resolve({ rows: [] }),

    bomberoId ? pool.query<{ apellidos: string; nombres: string; grado: string }>(
      `SELECT apellidos, nombres, grado FROM bombero WHERE id = $1`, [bomberoId]
    ) : Promise.resolve({ rows: [] }),

    pool.query<{ codigo: string; tipo: string; estado: string; motivo: string | null }>(
      `SELECT codigo, tipo, estado, motivo FROM vehiculo ORDER BY codigo`),
  ]);

  // Vehículos operativos = EN BASE sin motivo de falla
  const vTotal = vehiculosRes.rows.reduce((s, r) => s + Number(r.count), 0);
  const vBase  = vehiculosDetalle.rows.filter(v => v.estado === "EN BASE" && !v.motivo).length;
  const vFalla = vehiculosDetalle.rows.filter(v => v.motivo).length;

  const bNombre = bomberoNombre.rows[0];
  const nombreMostrar = bNombre
    ? bNombre.apellidos.trim().split(",")[0].trim()
    : null;

  return {
    mes, anioMes,
    ec:             ecRes.rows[0] ?? null,
    totalBomberos:  Number(bomberos.rows[0].count),
    enTurno:        Number(enTurno.rows[0].count),
    vehiculosEnBase: vBase,
    vehiculosTotal:  vTotal,
    vehiculosFalla:  vFalla,
    vehiculosDetalle: vehiculosDetalle.rows,
    emergAnio:      Number(emergAnio.rows[0].count),
    emergActivas:   Number(emergActivas.rows[0].count),
    emergMes:       Number(emergMes.rows[0].count),
      totalEfectivos: Number(emergMes.rows[0].total_efectivos),
      asistMes:       asistMes.rows[0],
      ranking:        ranking.rows,
      miAsistencia:   miAsistencia.rows[0] ?? null,
      nombreMostrar,
      gradoDB:        bNombre?.grado ?? null,
    };
}

export default async function InicioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { bomberoId, nombres, rol, grado } = session.user;
  const esBombero  = rol === "BOMBERO";
  const esOperativo = rol === "JEFE_COMPANIA" || rol === "OPERACIONES";

  const [data, racha] = await Promise.all([
    getInicioData(session.user.id, bomberoId ?? null).catch(() => null),
    esBombero && bomberoId ? calcularRacha(bomberoId).catch(() => null) : Promise.resolve(null),
  ]);

  // Nombre para el saludo: primero apellido real de DB, fallback a token
  const primerApellido = data?.nombreMostrar
    ?? nombres?.split(",")[0]?.trim()
    ?? nombres
    ?? "Bombero";

  const miHoras   = data?.miAsistencia?.horas_acumuladas ?? 0;
  const miGrado   = data?.miAsistencia?.grado ?? data?.gradoDB ?? grado ?? "";
  const metaHoras = HORAS_REGLAMENTO[miGrado] ?? 20;
  const pctMeta   = Math.min(100, Math.round((miHoras / metaHoras) * 100));
  const miPos     = bomberoId ? ((data?.ranking?.findIndex(r => r.id === bomberoId) ?? -1) + 1) : 0;

  const estadoEC = data?.ec?.estado_general;
  const estadoColor = estadoEC === "EN SERVICIO" ? "bg-green-500"
    : estadoEC === "EN EMERGENCIA" ? "bg-red-500 animate-pulse" : "bg-amber-400";
  const estadoText  = estadoEC === "EN SERVICIO" ? "text-green-600"
    : estadoEC === "EN EMERGENCIA" ? "text-red-600" : "text-amber-600";

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-4 pb-6">

      {/* ── Saludo ── */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {saludo}, {primerApellido}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Cía. B. V. N.° 150 — Puente Piedra</p>
        </div>
        {data?.emergActivas && data.emergActivas > 0 ? (
          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-xl text-white text-sm font-semibold transition-colors animate-pulse">
            <Siren className="w-4 h-4" />
            {data.emergActivas} emergencia{data.emergActivas > 1 ? "s" : ""} activa{data.emergActivas > 1 ? "s" : ""}
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">Sin emergencias activas</span>
          </div>
        )}
      </div>

      {/* ── STATUS GENERAL DE LA COMPAÑÍA — compacto ── */}
      <div data-tour="estado-cia" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${estadoColor}`} />
          <h2 className="font-semibold text-gray-900 text-xs uppercase tracking-widest">Estado de la Compañía</h2>
          {data?.ec?.primer_jefe && (
            <span className="text-xs text-gray-400 ml-1">
              · {data.ec.primer_jefe.replace(/^(Sub)?T(nte|te)\s*/i, "").split(",")[0].trim()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
          {[
            { icon: ShieldCheck, label: "Estado",              value: estadoEC ?? "—",                                                          sub: null,                                                                           color: estadoText,                                                          bg: "bg-white" },
            { icon: Users,       label: "En turno",            value: data?.enTurno ?? "—",                                                     sub: `de ${data?.totalBomberos ?? "—"} activos`,                                    color: "text-blue-600",                                                     bg: "bg-white" },
            { icon: Truck,       label: "Flota operativa",     value: `${data?.vehiculosEnBase ?? "—"}/${data?.vehiculosTotal ?? "—"}`,           sub: data?.vehiculosFalla ? `${data.vehiculosFalla} con falla` : "todas operativas", color: data?.vehiculosFalla ? "text-amber-600" : "text-green-600",          bg: "bg-white" },
            { icon: Siren,       label: "Emergencias activas", value: data?.emergActivas ?? 0,                                                   sub: data?.emergActivas ? "en atención ahora" : "sin emergencias",                  color: (data?.emergActivas ?? 0) > 0 ? "text-red-600" : "text-gray-400",   bg: (data?.emergActivas ?? 0) > 0 ? "bg-red-50" : "bg-white" },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className={`${bg} px-3 py-3`}>
              <div className="flex items-center gap-1 mb-1">
                <Icon className={`w-3 h-3 ${color}`} />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN BOMBERO — layout 2 columnas ── */}
      {esBombero && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Columna izquierda: mascota + KPIs personales */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Mascota + KPIs en fila */}
            <div data-tour="mis-kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 flex justify-center sm:justify-start">
                <MascotaHero horas={miHoras} meta={metaHoras} pct={pctMeta} grado={miGrado} nombre={primerApellido} />
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                {[
                  { icon: Clock,         label: "Mis horas",       value: miHoras > 0 ? `${miHoras}h` : "—",            sub: `Meta: ${metaHoras}h · ${pctMeta}%`,                  color: pctMeta >= 100 ? "text-green-600" : pctMeta >= 60 ? "text-amber-600" : "text-red-600" },
                  { icon: CalendarCheck, label: "Días asistidos",  value: data?.miAsistencia?.dias_asistidos ?? "—",     sub: `${MESES_ES[data?.mes ?? 1]} ${data?.anioMes ?? ""}`, color: "text-blue-600"   },
                  { icon: Siren,         label: "Mis emergencias", value: data?.miAsistencia?.num_emergencias ?? "—",    sub: `${MESES_ES[data?.mes ?? 1]}`,                        color: "text-red-600"    },
                  { icon: Award,         label: "Mi posición",     value: miPos > 0 ? `#${miPos}` : "—",                sub: "ranking de horas",                                   color: "text-purple-600" },
                ].map(({ icon: Icon, label, value, sub, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
                    </div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranking — próximamente */}
            <div data-tour="ranking-card" className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Ranking de Asistencia</h2>
                  <p className="text-xs text-gray-400">Próximamente — Nivel 2</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-6 gap-1">
                <p className="text-xs font-semibold text-gray-500">Disponible en la siguiente versión</p>
              </div>
            </div>
          </div>

          {/* Columna derecha: progreso */}
          <div data-tour="progreso-card" className="lg:col-span-2">
            {racha && (
              <ProgresoCard racha={racha} horas={miHoras} meta={metaHoras} pct={pctMeta} />
            )}
          </div>

        </div>
      )}

      {/* ── SECCIÓN OPERATIVA / JEFE ── */}
      {esOperativo && data && (
        <>
          {/* Alerta emergencias activas */}
          {data.emergActivas > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700">
                  {data.emergActivas} emergencia{data.emergActivas > 1 ? "s" : ""} activa{data.emergActivas > 1 ? "s" : ""} en este momento
                </p>
                <p className="text-xs text-red-500 mt-0.5">Ver detalles en Operatividad o Partes de Emergencia</p>
              </div>
              <Link href="/dashboard" className="ml-auto text-xs font-semibold text-red-700 hover:underline whitespace-nowrap">
                Ver ahora →
              </Link>
            </div>
          )}

          {/* Status de flota */}
          {data.vehiculosDetalle.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">Estado de Flota</h2>
                <span className="ml-auto text-xs text-gray-400">{data.vehiculosDetalle.length} unidades registradas</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-100">
                {data.vehiculosDetalle.map(v => {
                  const operativo = v.estado === "EN BASE" && !v.motivo;
                  const emergencia = v.estado === "EN EMERGENCIA";
                  return (
                    <div key={v.codigo} className="bg-white px-3 py-3 text-center">
                      <p className="text-xs font-bold text-gray-900">{v.codigo}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{v.tipo}</p>
                      <span className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        operativo  ? "bg-green-100 text-green-700" :
                        emergencia ? "bg-red-100 text-red-700 animate-pulse" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {operativo ? "OPERATIVO" : emergencia ? "EN EMERG." : "CON FALLA"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-base">🔒</span>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Ranking de Asistencia</h2>
                <p className="text-xs text-gray-400">Próximamente — Nivel 2</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm font-semibold text-gray-500">Disponible en la siguiente versión</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">El ranking completo de asistencia estará disponible próximamente.</p>
            </div>
          </div>
        </>
      )}

      {/* ── OTROS ROLES ── */}
      {!esBombero && !esOperativo && data && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Ranking de Asistencia</h2>
              <p className="text-xs text-gray-400">Próximamente — Nivel 2</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm font-semibold text-gray-500">Disponible en la siguiente versión</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">El ranking completo de asistencia estará disponible próximamente.</p>
          </div>
        </div>
      )}

    </div>
  );
}

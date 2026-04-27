import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  User, CalendarCheck, Siren, Clock, ShieldCheck,
  Flame, Lock, CheckCircle, Star, Award, TrendingUp,
  Truck, Users, Phone, Mail, Calendar, Heart,
} from "lucide-react";
import pool from "@/lib/db";
import { calcularRacha } from "@/lib/racha";
import { HORAS_REGLAMENTO } from "@/lib/reglamento";
import { GuiaBienvenidaWrapper } from "@/components/ui-custom/GuiaBienvenidaWrapper";

interface BomberoDetalle {
  id: number;
  codigo: string;
  grado: string;
  apellidos: string;
  nombres: string;
  dni: string | null;
  foto_url: string | null;
  fecha_ingreso: string | null;
  fecha_nacimiento: string | null;
  correo: string | null;
  telefono: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  activo: boolean;
  perfil_completado: boolean;
  estado_actual: string | null;
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

async function getBomberoData(bomberoId: number) {
  const client = await pool.connect();
  try {
    const [detalle, asistencia, emergencias, asistMes] = await Promise.all([
      client.query<BomberoDetalle>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres, b.dni,
               b.foto_url, b.fecha_ingreso::text, b.fecha_nacimiento::text,
               b.correo, b.telefono,
               b.contacto_emergencia_nombre, b.contacto_emergencia_telefono,
               b.activo, COALESCE(b.perfil_completado, false) AS perfil_completado,
               bea.estado AS estado_actual
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

      client.query<{ horas: string; dias: string; num_emergencias: string }>(`
        SELECT COALESCE(SUM(horas_acumuladas), 0) AS horas,
               COALESCE(SUM(dias_asistidos), 0)  AS dias,
               COALESCE(SUM(num_emergencias), 0) AS num_emergencias
        FROM asistencia_mensual
        WHERE bombero_id = $1
          AND mes  = EXTRACT(month FROM CURRENT_DATE)
          AND anio = EXTRACT(year  FROM CURRENT_DATE)
      `, [bomberoId]),
    ]);

    return {
      bombero:    detalle.rows[0] ?? null,
      asistencia: asistencia.rows,
      emergencias: emergencias.rows,
      asistMes:   asistMes.rows[0] ?? null,
    };
  } finally {
    client.release();
  }
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export default async function MiPerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { rol, bomberoId } = session.user;
  if (rol !== "BOMBERO" && rol !== "JEFE_COMPANIA") redirect("/dashboard");
  if (!bomberoId) redirect("/dashboard");

  const [{ bombero, asistencia, emergencias, asistMes }, racha] = await Promise.all([
    getBomberoData(bomberoId).catch(() => ({
      bombero: null, asistencia: [], emergencias: [], asistMes: null,
    })),
    calcularRacha(bomberoId).catch(() => null),
  ]);

  if (!bombero) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">No se encontró información del efectivo.</p>
      </div>
    );
  }

  const hoy = new Date();
  const semanaActual = isoWeek(hoy);
  function semanaOffset(n: number) {
    const d = new Date(hoy); d.setDate(d.getDate() - n * 7); return isoWeek(d);
  }

  const miHoras  = Number(asistMes?.horas ?? 0);
  const miGrado  = bombero.grado;
  const metaHoras = HORAS_REGLAMENTO[miGrado] ?? 20;
  const pctMeta  = Math.min(100, Math.round((miHoras / metaHoras) * 100));

  const rachaActual = racha?.rachaActual ?? 0;
  const rachaMejor  = racha?.rachaMejor  ?? 0;

  const recompensas = [
    {
      icon: Users,
      label: "Ver quién está en turno",
      descripcion: "Consulta en tiempo real quién está en la compañía ahora mismo.",
      requisito: "Asistir al menos 1 vez esta semana",
      desbloqueada: racha?.asistioEstaSemana ?? false,
      color: "blue",
    },
    {
      icon: Truck,
      label: "Ver estado de unidades",
      descripcion: "Estado operativo de cada vehículo en tiempo real.",
      requisito: "Mantener racha de 2 semanas seguidas",
      desbloqueada: rachaActual >= 2,
      color: "amber",
    },
    {
      icon: Star,
      label: "Ver ranking completo",
      descripcion: "Accede al ranking de horas de todos los bomberos del mes.",
      requisito: "Cumplir la meta de horas del mes",
      desbloqueada: pctMeta >= 100,
      color: "purple",
    },
  ] as const;

  const desbloqueadas = recompensas.filter(r => r.desbloqueada).length;

  const nombre = bombero.apellidos.trim().split(",")[0].trim();

  return (
    <>
      {/* Guía interactiva — solo si perfil no completado */}
      {!bombero.perfil_completado && (
        <GuiaBienvenidaWrapper
          nombre={nombre}
          grado={bombero.grado}
          datosIniciales={{
            fecha_nacimiento:             bombero.fecha_nacimiento,
            correo:                       bombero.correo,
            telefono:                     bombero.telefono,
            contacto_emergencia_nombre:   bombero.contacto_emergencia_nombre,
            contacto_emergencia_telefono: bombero.contacto_emergencia_telefono,
          }}
        />
      )}

      <div className="space-y-4 pb-6">

        {/* ── Header perfil ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 overflow-hidden">
            {bombero.foto_url
              ? <img src={bombero.foto_url} alt="foto" className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-red-700" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{bombero.grado}</p>
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              bombero.estado_actual === "en_turno"
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {bombero.estado_actual === "en_turno" ? "En Turno" : "Franco"}
            </span>
            {rachaActual > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Flame className="w-3 h-3" /> {rachaActual} sem.
              </span>
            )}
          </div>
        </div>

        {/* ── KPIs del mes ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock,         color: "text-amber-600",  label: "Horas este mes",    value: `${miHoras}h`,                               sub: `Meta: ${metaHoras}h · ${pctMeta}%` },
            { icon: CalendarCheck, color: "text-blue-600",   label: "Días asistidos",    value: asistMes?.dias ?? "0",                        sub: "este mes" },
            { icon: Siren,         color: "text-red-600",    label: "Emergencias",        value: asistMes?.num_emergencias ?? "0",             sub: "este mes" },
            { icon: Award,         color: "text-purple-600", label: "Total emergencias", value: emergencias.length,                           sub: "históricas" },
          ].map(({ icon: Icon, color, label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Layout 2 columnas: Racha + Logros | Info personal + Asistencia ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Columna izquierda: Racha y logros (col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Racha semanal */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <p className="text-sm font-bold text-gray-900">Racha Semanal</p>
                {rachaActual > 0 && (
                  <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    🔥 {rachaActual} sem.
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">

                {/* Estado racha */}
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  rachaActual === 0
                    ? "bg-gray-50 border-gray-200"
                    : rachaActual >= 4
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <Flame className={`w-5 h-5 shrink-0 ${
                    rachaActual === 0 ? "text-gray-300"
                    : rachaActual >= 4 ? "text-red-600"
                    : "text-amber-500"
                  }`} />
                  <div>
                    <p className={`text-sm font-bold ${
                      rachaActual === 0 ? "text-gray-400"
                      : rachaActual >= 4 ? "text-red-700"
                      : "text-amber-700"
                    }`}>
                      {rachaActual === 0
                        ? "Sin racha activa"
                        : `${rachaActual} semana${rachaActual !== 1 ? "s" : ""} seguida${rachaActual !== 1 ? "s" : ""}`
                      }
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {rachaActual === 0
                        ? "Asiste esta semana para comenzar"
                        : `Mejor: ${rachaMejor} sem.`
                      }
                    </p>
                  </div>
                </div>

                {/* Mini calendario 4 semanas */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Últimas 4 semanas</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 2, 1, 0].map(offset => {
                      let asistio = false;
                      if (offset === 0) asistio = racha?.asistioEstaSemana ?? false;
                      else if (offset === 1) asistio = racha?.asistioSemanaAnterior ?? false;
                      else asistio = rachaActual > offset;
                      const label = offset === 0 ? "Esta" : offset === 1 ? "Ant." : `S-${offset + 1}`;
                      return (
                        <div key={offset} className={`rounded-lg px-1 py-2 text-center border ${
                          asistio ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}>
                          <CheckCircle className={`w-3.5 h-3.5 mx-auto mb-0.5 ${asistio ? "text-green-500" : "text-gray-300"}`} />
                          <p className={`text-[10px] font-semibold ${asistio ? "text-green-700" : "text-gray-400"}`}>{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats racha */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Días / 4 sem.</p>
                    <p className="text-lg font-bold text-gray-900">{racha?.diasUltimas4Semanas ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Total turnos</p>
                    <p className="text-lg font-bold text-gray-900">{racha?.totalTurnos ?? 0}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Logros y beneficios */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-bold text-gray-900">Beneficios</p>
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                  {desbloqueadas}/{recompensas.length}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {recompensas.map(r => {
                  const Icon = r.icon;
                  const colorMap = {
                    blue:   { bg: "bg-blue-50 border-blue-200",     icon: "text-blue-600",   text: "text-blue-800"   },
                    amber:  { bg: "bg-amber-50 border-amber-200",   icon: "text-amber-600",  text: "text-amber-800"  },
                    purple: { bg: "bg-purple-50 border-purple-200", icon: "text-purple-600", text: "text-purple-800" },
                  } as const;
                  const c = colorMap[r.color];
                  return (
                    <div key={r.label} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      r.desbloqueada ? c.bg : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        r.desbloqueada ? "bg-white" : "bg-gray-200"
                      }`}>
                        {r.desbloqueada
                          ? <Icon className={`w-4 h-4 ${c.icon}`} />
                          : <Lock className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-tight ${
                          r.desbloqueada ? c.text : "text-gray-500"
                        }`}>{r.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                          {r.desbloqueada ? r.descripcion : r.requisito}
                        </p>
                      </div>
                      {r.desbloqueada && <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />}
                    </div>
                  );
                })}

                {/* Meta horas barra */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Meta de horas</p>
                    <p className="text-[10px] font-bold text-gray-600">{miHoras}h / {metaHoras}h</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pctMeta >= 100 ? "bg-green-500" : pctMeta >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${pctMeta}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{pctMeta}% completado</p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna derecha: Info personal + Asistencia + Emergencias (col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Info personal */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Información Personal</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
                {[
                  { icon: ShieldCheck, label: "Código",         value: bombero.codigo,         color: "text-gray-900" },
                  { icon: Calendar,    label: "Fecha ingreso",  value: bombero.fecha_ingreso
                    ? new Date(bombero.fecha_ingreso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                    : "—",                                                                      color: "text-gray-700" },
                  { icon: Calendar,    label: "Nacimiento",     value: bombero.fecha_nacimiento
                    ? new Date(bombero.fecha_nacimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                    : "—",                                                                      color: "text-gray-700" },
                  { icon: Phone,       label: "Teléfono",       value: bombero.telefono ?? "—", color: "text-gray-700" },
                  { icon: Mail,        label: "Correo",         value: bombero.correo ?? "—",   color: "text-gray-700" },
                  { icon: Heart,       label: "Contacto emerg.", value: bombero.contacto_emergencia_nombre
                    ? `${bombero.contacto_emergencia_nombre}${bombero.contacto_emergencia_telefono ? ` · ${bombero.contacto_emergencia_telefono}` : ""}`
                    : "—",                                                                      color: "text-gray-700" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-gray-400" />
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
                    </div>
                    <p className={`text-sm font-semibold truncate ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Asistencia reciente */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Asistencia Reciente</p>
                <span className="ml-auto text-xs text-gray-400">Últimas {asistencia.length} guardias</span>
              </div>
              {asistencia.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Sin registros de asistencia aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Fecha", "Ingreso", "Salida", "Horas"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {asistencia.map((a, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap">
                            {new Date(a.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" })}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{a.hora_ingreso}</td>
                          <td className="px-4 py-2.5 text-gray-500">{a.hora_salida ?? "—"}</td>
                          <td className="px-4 py-2.5 text-gray-700 font-semibold">
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
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Siren className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Emergencias Atendidas</p>
                <span className="ml-auto text-xs text-gray-400">{emergencias.length} registradas</span>
              </div>
              {emergencias.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Sin emergencias registradas aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["N.° Parte", "Tipo", "Fecha", "Dirección"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {emergencias.map((e, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-gray-500 font-medium whitespace-nowrap">{e.numero_parte}</td>
                          <td className="px-4 py-2.5 text-gray-800 max-w-[180px]">
                            <p className="truncate">{e.tipo_desc ?? e.tipo_raw}</p>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                            {e.fecha_salida
                              ? new Date(e.fecha_salida).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 max-w-[180px]">
                            <p className="truncate">{e.direccion ?? "—"}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">Solo tú puedes ver esta información. Para actualizar tus datos ve a <strong>Configuración</strong>.</p>
        </div>

      </div>
    </>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import {
  User, Clock, CalendarCheck, Siren, ShieldCheck,
  Phone, Mail, UserCircle2, Settings, Cake,
  Flame, Lock, CheckCircle, Star, Award, Truck, Users,
} from "lucide-react";
import { HORAS_REGLAMENTO } from "@/lib/reglamento";
import { calcularRacha } from "@/lib/racha";
import { GuiaBienvenidaWrapper } from "@/components/ui-custom/GuiaBienvenidaWrapper";

const MESES_ES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface BomberoRow {
  id: number; codigo: string; grado: string; apellidos: string; nombres: string;
  dni: string | null; foto_url: string | null; fecha_ingreso: string | null;
  fecha_nacimiento: string | null;
  correo: string | null; telefono: string | null;
  contacto_emergencia_nombre: string | null; contacto_emergencia_telefono: string | null;
  activo: boolean; estado_actual: string | null;
  perfil_completado: boolean;
}

async function getPerfilData(bomberoId: number) {
  const client = await pool.connect();
  try {
    const [bombero, historial, emergencias] = await Promise.all([

      client.query<BomberoRow>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres, b.dni,
               b.foto_url, b.fecha_ingreso::text, b.fecha_nacimiento::text,
               b.correo, b.telefono,
               b.contacto_emergencia_nombre, b.contacto_emergencia_telefono,
               b.activo, COALESCE(b.perfil_completado, false) AS perfil_completado,
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
    ]);

    return {
      bombero:     bombero.rows[0] ?? null,
      historial:   historial.rows,
      emergencias: emergencias.rows,
    };
  } finally {
    client.release();
  }
}

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.bomberoId) redirect("/inicio");

  const bomberoId = session.user.bomberoId!;

  const [{ bombero, historial, emergencias }, racha] = await Promise.all([
    getPerfilData(bomberoId).catch(() => ({ bombero: null, historial: [], emergencias: [] })),
    calcularRacha(bomberoId).catch(() => null),
  ]);

  if (!bombero) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">No se encontró tu perfil. Contacta a Administración.</p>
    </div>
  );

  const ultimoMes  = historial[0];
  const totalHoras = historial.reduce((s, h) => s + (h.horas_acumuladas ?? 0), 0);
  const meta       = HORAS_REGLAMENTO[bombero.grado] ?? 20;
  const miHoras    = ultimoMes?.horas_acumuladas ?? 0;
  const pct        = Math.min(100, Math.round((miHoras / meta) * 100));

  const rachaActual = racha?.rachaActual ?? 0;
  const rachaMejor  = racha?.rachaMejor  ?? 0;

  const recompensas = [
    { icon: Users, label: "Ver quién está en turno",  descripcion: "Consulta en tiempo real quién está en la compañía.", requisito: "Asistir al menos 1 vez esta semana",    desbloqueada: racha?.asistioEstaSemana ?? false, color: "blue"   },
    { icon: Truck, label: "Ver estado de unidades",   descripcion: "Estado operativo de cada vehículo en tiempo real.", requisito: "Mantener racha de 2 semanas seguidas", desbloqueada: rachaActual >= 2,                  color: "amber"  },
    { icon: Star,  label: "Ver ranking completo",     descripcion: "Ranking de horas de todos los bomberos del mes.",   requisito: "Cumplir la meta de horas del mes",     desbloqueada: pct >= 100,                        color: "purple" },
  ] as const;

  const desbloqueadas = recompensas.filter(r => r.desbloqueada).length;

  function calcularEdad(fechaNac: string | null): number | null {
    if (!fechaNac) return null;
    const hoy = new Date(); const nac = new Date(fechaNac);
    if (isNaN(nac.getTime())) return null;
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }
  const edad = calcularEdad(bombero.fecha_nacimiento);
  const nombre = bombero.apellidos.trim().split(",")[0].trim();

  return (
    <>
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

        {/* ── Header ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 text-xl font-bold text-red-700 overflow-hidden">
            {bombero.foto_url
              ? <img src={bombero.foto_url} alt="foto" className="w-full h-full object-cover" />
              : `${bombero.apellidos.trim()[0]}${bombero.nombres[0]}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{bombero.grado}</p>
            <h1 className="text-xl font-bold text-gray-900 truncate">{bombero.apellidos.trim()}, {bombero.nombres}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
              <span className="font-mono font-medium text-gray-600">{bombero.codigo}</span>
              {bombero.dni && <span>DNI {bombero.dni}</span>}
              {bombero.fecha_nacimiento && (
                <span className="flex items-center gap-1">
                  <Cake className="w-3 h-3" />
                  {new Date(bombero.fecha_nacimiento).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}
                  {edad !== null && <span className="font-semibold text-gray-600">· {edad} años</span>}
                </span>
              )}
              {bombero.fecha_ingreso && (
                <span>Ingreso: {new Date(bombero.fecha_ingreso).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}</span>
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
            <Link href="/perfil/configuracion" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-700 transition-colors">
              <Settings className="w-3.5 h-3.5" /> Editar datos
            </Link>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock,         color: "text-amber-600",  label: "Horas últ. mes",   value: `${miHoras}h`,          sub: `Meta: ${meta}h · ${pct}%` },
            { icon: CalendarCheck, color: "text-blue-600",   label: "Días últ. mes",    value: ultimoMes?.dias_asistidos ?? "—", sub: ultimoMes ? `${MESES_ES[ultimoMes.mes]} ${ultimoMes.anio}` : "sin datos" },
            { icon: Siren,         color: "text-red-600",    label: "Emergencias",       value: emergencias.length,     sub: "registradas" },
            { icon: Flame,         color: "text-orange-500", label: "Racha actual",      value: rachaActual > 0 ? `${rachaActual} sem.` : "—", sub: rachaMejor > 0 ? `Mejor: ${rachaMejor} sem.` : "sin racha aún" },
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

        {/* ── Layout 2 col: Racha+Logros | Datos+Historial ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Columna izquierda: Racha y beneficios */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Racha */}
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
              <div className="p-4 space-y-3">
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  rachaActual === 0 ? "bg-gray-50 border-gray-200"
                  : rachaActual >= 4 ? "bg-red-50 border-red-200"
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
                      {rachaActual === 0 ? "Sin racha activa"
                        : `${rachaActual} semana${rachaActual !== 1 ? "s" : ""} seguida${rachaActual !== 1 ? "s" : ""}`}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {rachaActual === 0 ? "Asiste esta semana para comenzar" : `Mejor: ${rachaMejor} sem.`}
                    </p>
                  </div>
                </div>

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
                        <div key={offset} className={`rounded-lg px-1 py-2 text-center border ${asistio ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                          <CheckCircle className={`w-3.5 h-3.5 mx-auto mb-0.5 ${asistio ? "text-green-500" : "text-gray-300"}`} />
                          <p className={`text-[10px] font-semibold ${asistio ? "text-green-700" : "text-gray-400"}`}>{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

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

            {/* Beneficios */}
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
                    <div key={r.label} className={`flex items-start gap-3 p-3 rounded-xl border ${r.desbloqueada ? c.bg : "bg-gray-50 border-gray-200"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.desbloqueada ? "bg-white" : "bg-gray-200"}`}>
                        {r.desbloqueada ? <Icon className={`w-4 h-4 ${c.icon}`} /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-tight ${r.desbloqueada ? c.text : "text-gray-500"}`}>{r.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                          {r.desbloqueada ? r.descripcion : r.requisito}
                        </p>
                      </div>
                      {r.desbloqueada && <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />}
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Meta de horas</p>
                    <p className="text-[10px] font-bold text-gray-600">{miHoras}h / {meta}h</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{pct}% completado</p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna derecha: Contacto + Historial + Emergencias */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Contacto */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <UserCircle2 className="w-4 h-4 text-gray-400" /> Información de contacto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { icon: Mail,  label: "Correo",  value: bombero.correo },
                  { icon: Phone, label: "Teléfono", value: bombero.telefono },
                  { icon: Phone, label: "Contacto de emergencia", value: bombero.contacto_emergencia_nombre
                    ? `${bombero.contacto_emergencia_nombre}${bombero.contacto_emergencia_telefono ? ` · ${bombero.contacto_emergencia_telefono}` : ""}`
                    : null },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-gray-800 font-medium text-sm">
                        {value ?? <span className="text-gray-400 italic text-xs">No registrado</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cumplimiento reglamentario */}
            {ultimoMes && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Cumplimiento reglamentario</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{MESES_ES[ultimoMes.mes]} {ultimoMes.anio} · Meta: {meta}h para {bombero.grado}</p>
                  </div>
                  <span className={`text-2xl font-bold ${pct >= 100 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                  <span>{miHoras}h acumuladas</span>
                  <span>{Math.max(0, meta - miHoras)}h restantes</span>
                </div>
              </div>
            )}

            {/* Historial mensual */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Historial de asistencia</p>
                <span className="ml-auto text-xs text-gray-400">Total: {totalHoras}h</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Mes","Días","Horas","Cumpl.","Emerg."].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historial.map((h, i) => {
                      const p = Math.min(100, Math.round(((h.horas_acumuladas ?? 0) / meta) * 100));
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-700">{MESES_ES[h.mes]} {h.anio}</td>
                          <td className="px-4 py-2.5 text-gray-600">{h.dias_asistidos ?? "—"}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-900">{h.horas_acumuladas ?? "—"}h</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-semibold ${p >= 100 ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-500"}`}>{p}%</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{h.num_emergencias ?? "—"}</td>
                        </tr>
                      );
                    })}
                    {historial.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Sin historial disponible.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Emergencias */}
            {emergencias.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Siren className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">Emergencias registradas</p>
                  <span className="ml-auto text-xs text-gray-400">{emergencias.length} partes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["N.° Parte","Tipo","Fecha","Dirección"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {emergencias.map((e, i) => {
                        const fecha = e.fecha_salida ?? e.fecha_despacho;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-mono font-semibold text-gray-500">{e.numero_parte}</td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[180px]"><p className="truncate">{e.tipo_desc ?? e.tipo_raw}</p></td>
                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                              {fecha ? new Date(fecha).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 max-w-[180px]"><p className="truncate">{e.direccion ?? "—"}</p></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">Solo tú puedes ver y editar esta información. Para cambios en datos institucionales comunícate con Administración.</p>
        </div>

      </div>
    </>
  );
}

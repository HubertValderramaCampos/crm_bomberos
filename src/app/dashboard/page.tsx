import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Truck, Users, Siren, ShieldCheck, Clock, CheckCircle, XCircle, Wrench, Lock } from "lucide-react";
import pool from "@/lib/db";
import { VehiculosDonut, PersonalDonut, RolesBar } from "@/components/ui-custom/OperatividadCharts";
import { calcularRacha } from "@/lib/racha";

interface EstadoCompania {
  id: number;
  primer_jefe: string | null;
  segundo_jefe: string | null;
  estado_general: string | null;
  pilotos_disponibles: number | null;
  paramedicos_disponibles: number | null;
  personal_disponible: number | null;
  observaciones: string | null;
  informante: string | null;
  fecha_hora: string | null;
  created_at: string;
}

interface PersonalTurno {
  id: number;
  nombre_raw: string;
  tipo: string | null;
  hora_ingreso: string | null;
  es_al_mando: boolean | null;
  es_piloto: boolean | null;
  es_medico: boolean | null;
  es_appa: boolean | null;
  es_map: boolean | null;
  es_brec: boolean | null;
  apellidos: string | null;
  nombres: string | null;
  grado: string | null;
  codigo: string | null;
}

interface VehiculoTurno {
  id: number;
  codigo_vehiculo: string;
  estado: string;
  motivo: string | null;
  tipo_vehiculo: string | null;
}

interface Emergencia {
  id: number;
  numero_parte: string;
  tipo_raw: string;
  tipo_desc: string | null;
  estado: string;
  direccion: string | null;
  fecha_despacho: string | null;
  fecha_salida: string | null;
  piloto_nombre: string | null;
  numero_efectivos: number | null;
}

async function getEstadoActual() {
  const ecRes = await pool.query<EstadoCompania>(
    `SELECT * FROM estado_compania ORDER BY created_at DESC LIMIT 1`
  );
  const ec = ecRes.rows[0] ?? null;
  if (!ec) return { ec: null, personal: [], vehiculos: [], emergencias: [] };

  const [personalRes, vehiculosRes, emergenciasRes] = await Promise.all([
    pool.query<PersonalTurno>(`
      SELECT at.id, at.nombre_raw, at.tipo, at.hora_ingreso,
             at.es_al_mando, at.es_piloto, at.es_medico,
             at.es_appa, at.es_map, at.es_brec,
             b.apellidos, b.nombres, b.grado, b.codigo
      FROM asistencia_turno at
      LEFT JOIN bombero b ON b.id = at.bombero_id
      WHERE at.estado_compania_id = $1
      ORDER BY at.es_al_mando DESC, at.hora_ingreso
    `, [ec.id]),
    pool.query<VehiculoTurno>(`
      SELECT id, codigo_vehiculo, estado, motivo, tipo_vehiculo
      FROM estado_compania_vehiculo
      WHERE estado_compania_id = $1
      ORDER BY tipo_vehiculo, codigo_vehiculo
    `, [ec.id]),
    pool.query<Emergencia>(`
      SELECT e.id, e.numero_parte, e.tipo AS tipo_raw,
             te.descripcion AS tipo_desc,
             e.estado, e.direccion,
             e.fecha_despacho::text, e.fecha_salida::text,
             e.piloto_nombre, e.numero_efectivos
      FROM emergencia e
      LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
      WHERE e.estado = 'ATENDIENDO'
        AND e.fecha_ingreso IS NULL
        AND e.fecha_retorno IS NULL
        AND e.km_ingreso IS NULL
        AND COALESCE(e.fecha_salida, e.fecha_despacho) >= NOW() - INTERVAL '24 hours'
      ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho) DESC
    `),
  ]);

  return { ec, personal: personalRes.rows, vehiculos: vehiculosRes.rows, emergencias: emergenciasRes.rows };
}

const ESTADO_CIA_COLOR: Record<string, { dot: string; text: string; bg: string }> = {
  "EN SERVICIO":       { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50 border-green-200"  },
  "FUERA DE SERVICIO": { dot: "bg-red-600",    text: "text-red-700",    bg: "bg-red-50 border-red-200"      },
  "EN EMERGENCIA":     { dot: "bg-amber-500",  text: "text-amber-700",  bg: "bg-amber-50 border-amber-200"  },
};

function getRolesPersonal(p: PersonalTurno): string[] {
  const roles: string[] = [];
  if (p.es_piloto) roles.push("Piloto");
  if (p.es_medico) roles.push("Médico");
  if (p.es_appa)   roles.push("APPA");
  if (p.es_map)    roles.push("MAP");
  if (p.es_brec)   roles.push("BREC");
  return roles;
}

function formatTs(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const esBombero  = session.user.rol === "BOMBERO";
  const bomberoId  = session.user.bomberoId ?? null;

  const [{ ec, personal, vehiculos, emergencias }, rachaDB] = await Promise.all([
    getEstadoActual().catch(() => ({ ec: null, personal: [], vehiculos: [], emergencias: [] })),
    esBombero && bomberoId ? calcularRacha(bomberoId).catch(() => null) : Promise.resolve(null),
  ]);

  // Recompensas del bombero basadas en racha
  const puedeVerTurno     = !esBombero || (rachaDB?.asistioEstaSemana ?? false);
  const puedeVerUnidades  = !esBombero || ((rachaDB?.rachaActual ?? 0) >= 2);

  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const estadoKey   = ec?.estado_general ?? "";
  const estadoStyle = ESTADO_CIA_COLOR[estadoKey] ?? { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50 border-gray-200" };

  const tieneMotivo           = (v: VehiculoTurno) => !!(v.motivo && v.motivo.trim());
  const vehiculosOperativos   = vehiculos.filter(v => v.estado === "EN BASE" && !tieneMotivo(v));
  const vehiculosEnEmergencia = vehiculos.filter(v => v.estado === "EN EMERGENCIA");
  const vehiculosFalla        = vehiculos.filter(v => v.estado !== "EN EMERGENCIA" && tieneMotivo(v));
  const vehiculosFuera        = vehiculos.filter(v => v.estado === "FUERA DE SERVICIO" && !tieneMotivo(v));

  const personalBomberos = personal.filter(p => p.tipo === "BOM");
  const personalRentados = personal.filter(p => p.tipo === "REN");

  const vehiculosChart = [
    { estado: "Operativo",         count: vehiculosOperativos.length },
    { estado: "Con desperfectos",  count: vehiculosFalla.length },
    { estado: "En emergencia",     count: vehiculosEnEmergencia.length },
    { estado: "Fuera de servicio", count: vehiculosFuera.length },
  ].filter(d => d.count > 0);

  const personalChart = [
    { name: "Bomberos",      value: personalBomberos.length, color: "#2563eb" },
    { name: "Pilotos Rent.", value: personalRentados.length, color: "#d97706" },
  ].filter(d => d.value > 0);

  const rolesChart = [
    { rol: "Piloto", total: personal.filter(p => p.es_piloto).length },
    { rol: "Médico", total: personal.filter(p => p.es_medico).length },
    { rol: "APPA",   total: personal.filter(p => p.es_appa).length },
    { rol: "MAP",    total: personal.filter(p => p.es_map).length },
    { rol: "BREC",   total: personal.filter(p => p.es_brec).length },
  ].filter(r => r.total > 0);

  return (
    <div className="space-y-4 pb-6">

      {/* ── Barra de estado ── */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 flex-wrap ${estadoStyle.bg}`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estadoStyle.dot} ${estadoKey === "EN EMERGENCIA" ? "animate-pulse" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-base font-bold text-gray-900">Operatividad</h1>
            <span className={`text-sm font-semibold ${estadoStyle.text}`}>{estadoKey || "Sin datos"}</span>
            {ec?.observaciones && <span className="text-xs text-amber-700">· {ec.observaciones}</span>}
          </div>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{today}</p>
        </div>
        {ec?.primer_jefe && (
          <p className="text-xs text-gray-500 shrink-0 hidden sm:block">
            {ec.primer_jefe.replace(/^(Sub)?T(nte|te)\s*/i, "").split(",")[0].trim()}
          </p>
        )}
        {emergencias.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-700 rounded-lg text-white text-xs font-bold animate-pulse shrink-0">
            <Siren className="w-3.5 h-3.5" />{emergencias.length} ATENDIENDO
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,      label: "En turno",            color: "text-blue-600",
            value: personal.length,
            sub: `${personalBomberos.length} bomberos · ${personalRentados.length} rentados` },
          { icon: Truck,      label: "Flota operativa",     color: vehiculosFalla.length > 0 ? "text-amber-600" : "text-green-600",
            value: `${vehiculosOperativos.length}/${vehiculos.length}`,
            sub: vehiculosFalla.length > 0 ? `${vehiculosFalla.length} con desperfectos` : "todas operativas" },
          { icon: Siren,      label: "Emergencias activas", color: emergencias.length > 0 ? "text-red-600" : "text-gray-400",
            value: emergencias.length,
            sub: emergencias.length > 0 ? "en atención ahora" : "sin emergencias",
            highlight: emergencias.length > 0 },
          { icon: ShieldCheck, label: "Pilotos disponibles", color: "text-purple-600",
            value: ec?.pilotos_disponibles ?? "—",
            sub: `${ec?.paramedicos_disponibles ?? 0} paramédicos` },
        ].map(({ icon: Icon, label, value, sub, color, highlight }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${highlight ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${highlight ? "text-red-700" : "text-gray-900"}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Gráficas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <VehiculosDonut vehiculos={vehiculosChart} />
        <PersonalDonut  personal={personalChart} />
        {rolesChart.length > 0
          ? <RolesBar roles={rolesChart} />
          : <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
              <p className="text-xs text-gray-400">Sin especialidades registradas</p>
            </div>
        }
      </div>

      {/* ── Detalle: Personal + Unidades + Emergencias ── */}
      <div className={`grid grid-cols-1 gap-3 ${esBombero ? "lg:grid-cols-2" : "lg:grid-cols-5"}`}>

        {/* Personal en turno — jefe: col-span-3, bombero con turno: col-span-1 */}
        {!esBombero && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Personal en Turno</p>
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">{personal.length} efectivos</span>
            </div>
            {personal.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">Sin personal registrado.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {personal.map((p) => {
                    const roles = getRolesPersonal(p);
                    const nombre = p.apellidos && p.nombres
                      ? `${p.apellidos}, ${p.nombres}`
                      : p.nombre_raw.replace(/^(Ren)?tado\s+/i, "").replace(/^(BOM|REN|SubTnte|Sec|Tte|Cap|Brig)\s*/i, "").split("(")[0].trim();
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="pl-4 pr-2 py-2 w-1">
                          <span className={`block w-1 h-6 rounded-full ${p.tipo === "REN" ? "bg-amber-400" : "bg-blue-500"}`} />
                        </td>
                        <td className="px-2 py-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 leading-tight truncate">{nombre}</span>
                            {p.es_al_mando && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded uppercase shrink-0">Mando</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.grado && <span className="text-[10px] text-gray-500">{p.grado}</span>}
                            {p.codigo && <span className="text-[10px] text-gray-400 font-mono">{p.codigo}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{r}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right shrink-0">
                          {p.hora_ingreso && <span className="text-[10px] text-gray-400 whitespace-nowrap">{p.hora_ingreso}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Bombero: turno bloqueado o desbloqueado */}
        {esBombero && !puedeVerTurno && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">¿Quién está en turno ahora?</p>
              <p className="text-xs text-gray-400 mt-1">Asiste a la compañía esta semana para ver quién está en servicio en tiempo real.</p>
            </div>
          </div>
        )}

        {esBombero && puedeVerTurno && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">En Turno Ahora</p>
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">{personal.length} efectivos</span>
            </div>
            {personal.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Sin personal registrado.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {personal.map((p) => {
                  const nombre = p.apellidos && p.nombres
                    ? `${p.apellidos.trim().split(",")[0]}, ${p.nombres.split(" ")[0]}`
                    : p.nombre_raw.replace(/^(Ren)?tado\s+/i, "").split("(")[0].trim();
                  const roles = getRolesPersonal(p);
                  return (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className={`block w-1 h-6 rounded-full shrink-0 ${p.tipo === "REN" ? "bg-amber-400" : "bg-blue-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                          {nombre}
                          {p.es_al_mando && <span className="ml-1 text-[9px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded">Mando</span>}
                        </p>
                        {p.grado && <p className="text-[10px] text-gray-400">{p.grado}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {roles.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{r}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Columna derecha: Unidades + Emergencias */}
        <div className={`flex flex-col gap-3 ${esBombero ? "" : "lg:col-span-2"}`}>

          {/* Unidades */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Unidades</p>
              <span className="ml-auto text-xs text-gray-400">{puedeVerUnidades ? `${vehiculos.length} registradas` : "bloqueado"}</span>
            </div>
            {!puedeVerUnidades ? (
              <div className="px-4 py-8 flex flex-col items-center text-center gap-2">
                <Lock className="w-5 h-5 text-gray-300" />
                <p className="text-xs text-gray-400">Mantén racha de 2 semanas seguidas para ver el estado de las unidades.</p>
              </div>
            ) : vehiculos.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Sin unidades.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {vehiculos.map((v) => {
                  const enEmerg   = v.estado === "EN EMERGENCIA";
                  const operativo = v.estado === "EN BASE" && !tieneMotivo(v);
                  const conFalla  = !enEmerg && tieneMotivo(v);
                  return (
                    <div key={v.id} className="px-4 py-2 flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        operativo ? "bg-green-50" : conFalla ? "bg-amber-50" : enEmerg ? "bg-blue-50" : "bg-red-50"
                      }`}>
                        {operativo ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        : conFalla ? <Wrench      className="w-3.5 h-3.5 text-amber-500" />
                        : enEmerg  ? <Siren       className="w-3.5 h-3.5 text-blue-600"  />
                        :            <XCircle     className="w-3.5 h-3.5 text-red-500"   />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 font-mono">{v.codigo_vehiculo}</p>
                        <p className="text-[10px] text-gray-400 truncate">{v.tipo_vehiculo ?? "—"}</p>
                        {v.motivo && <p className="text-[10px] text-amber-600 truncate">{v.motivo}</p>}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        operativo ? "bg-green-100 text-green-700 border-green-200"
                        : conFalla ? "bg-amber-100 text-amber-700 border-amber-200"
                        : enEmerg  ? "bg-blue-100 text-blue-700 border-blue-200"
                        :            "bg-red-100 text-red-700 border-red-200"
                      }`}>
                        {operativo ? "OPER." : conFalla ? "FALLA" : enEmerg ? "EMERG." : "FUERA"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emergencias activas */}
          <div className={`rounded-xl border ${emergencias.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Siren className={`w-4 h-4 ${emergencias.length > 0 ? "text-red-500" : "text-gray-300"}`} />
              <p className="text-sm font-semibold text-gray-900">Emergencias Activas</p>
              {emergencias.length > 0 ? (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />{emergencias.length}
                </span>
              ) : (
                <span className="ml-auto text-xs text-gray-400">ninguna</span>
              )}
            </div>
            {emergencias.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs text-gray-400">Sin emergencias en atención</p>
              </div>
            ) : (
              <div className="divide-y divide-red-100">
                {emergencias.map((e) => {
                  const ts = e.fecha_salida ?? e.fecha_despacho;
                  return (
                    <div key={e.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500">{e.numero_parte}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full ml-auto">ATENDIENDO</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{e.tipo_desc ?? e.tipo_raw}</p>
                      {e.direccion && <p className="text-xs text-gray-500 mt-0.5 truncate">{e.direccion}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTs(ts)}</span>
                        {e.numero_efectivos != null && <span>{e.numero_efectivos} ef.</span>}
                        {e.piloto_nombre && <span>· {e.piloto_nombre.replace(/^(Ren)?tado\s+/i, "")}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

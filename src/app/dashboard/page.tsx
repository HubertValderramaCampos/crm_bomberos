import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users, AlertTriangle, Truck, BookOpen, FileText,
  HeartPulse, Siren, Package, Award, Megaphone, CalendarCheck,
  Wrench, CheckCircle, XCircle, Clock, Building2,
} from "lucide-react";
import { StatCard } from "@/components/ui-custom/StatCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import {
  EmergenciasPorMesChart,
  EmergenciasPorTipoChart,
} from "@/components/ui-custom/EmergenciasChart";
import {
  AsistenciaMensualChart,
  AsistenciaEfectivosTable,
  AsistenciaPorGradoChart,
} from "@/components/ui-custom/AsistenciaChart";
import {
  CapacitacionesChart,
  CapacitacionesTable,
} from "@/components/ui-custom/CapacitacionesChart";

/* ─── DATOS DE DEMO ──────────────────────────────────────────────────────── */

const STATS: Record<string, Record<string, number | string>> = {
  JEFE_COMPANIA:       { bomberos: 10, emergenciasMes: 27, vehiculosOp: 4, cursosActivos: 3, emergenciasEnCurso: 2 },
  ADMINISTRACION:      { bomberos: 10, docsPublicados: 5, borradoresDocs: 2, bomberosInactivos: 2 },
  OPERACIONES:         { emergenciasMes: 27, enCurso: 2, vehiculosOp: 4 },
  SERVICIOS_GENERALES: { vehiculosOp: 4, equiposFalla: 2, mantPendientes: 3 },
  INSTRUCCION:         { cursosActivos: 3, matriculados: 23, certificaciones: 7 },
  SANIDAD:             { aptos: 7, noAptos: 1, itemsBotiquin: 10 },
  IMAGEN:              { publicados: 4, borradores: 2, eventos: 4 },
};

const EMERGENCIAS_RECIENTES = [
  { id: "1",  nroParte: "2026013727", tipo: "EMERGENCIA MEDICA / INCONSCIENTE - DESMAYO",           estado: "ATENDIENDO", maquinas: ["MED-28"],                              fechaHora: "2026-04-17T16:43:00" },
  { id: "2",  nroParte: "2026013726", tipo: "MAT. PELIGROSOS / FUGA GAS GLP / BALÓN DOMICILIARIO",  estado: "ATENDIENDO", maquinas: ["M-150", "AMB-150"],                     fechaHora: "2026-04-17T16:37:00" },
  { id: "3",  nroParte: "2026013725", tipo: "RESCATE / DERRUMBE / CON PERSONAS ATRAPADAS",          estado: "ATENDIENDO", maquinas: ["AMB-150", "RESC-LIG", "M-150"],         fechaHora: "2026-04-17T16:17:00" },
  { id: "4",  nroParte: "2026013724", tipo: "EMERGENCIA MEDICA / HERIDO POR CAÍDA",                 estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T16:16:00" },
  { id: "5",  nroParte: "2026013723", tipo: "EMERGENCIA MEDICA / HERIDO POR ATROPELLO",             estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T16:06:00" },
  { id: "6",  nroParte: "2026013722", tipo: "ACCIDENTE VEHICULAR / DESPISTE DE MOTO",               estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T16:05:00" },
  { id: "7",  nroParte: "2026013721", tipo: "ACCIDENTE VEHICULAR / AUTOMÓVIL",                      estado: "ATENDIENDO", maquinas: ["M-150", "AMB-150"],                     fechaHora: "2026-04-17T15:51:00" },
  { id: "8",  nroParte: "2026013720", tipo: "EMERGENCIA MEDICA / HERIDO POR CAÍDA",                 estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T15:42:00" },
  { id: "9",  nroParte: "2026013719", tipo: "EMERGENCIA MEDICA / PROBLEMAS CARDÍACOS",              estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T15:41:00" },
  { id: "10", nroParte: "2026013718", tipo: "EMERGENCIA MEDICA / INCONSCIENTE - DESMAYO",           estado: "ATENDIENDO", maquinas: ["AMB-150"],                              fechaHora: "2026-04-17T15:40:00" },
  { id: "11", nroParte: "2026013717", tipo: "SERVICIO ESPECIAL / EVENTO PÚBLICO",                   estado: "ATENDIENDO", maquinas: ["RESC"],                                 fechaHora: "2026-04-17T15:27:00" },
  { id: "12", nroParte: "2026013708", tipo: "INCENDIO / FORESTAL / BOSQUES",                        estado: "CERRADO",    maquinas: ["M-150", "CIST-150"],                    fechaHora: "2026-04-17T14:17:00" },
];

const ESTADO_COLOR: Record<string, "red"|"green"|"gray"> = {
  ATENDIENDO: "red", CERRADO: "green", CANCELADO: "gray",
};

const ROL_TITLES: Record<string, string> = {
  JEFE_COMPANIA: "Vista General — Cía. B. V. N.° 150",
  ADMINISTRACION: "Área de Administración",
  SERVICIOS_GENERALES: "Área de Servicios Generales",
  INSTRUCCION: "Área de Instrucción",
  SANIDAD: "Área de Sanidad",
  OPERACIONES: "Área de Operaciones",
  IMAGEN: "Área de Imagen",
};

/* ─── COMPONENTE ─────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = session.user.rol;
  const nombre = session.user.nombres;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (STATS[rol] ?? {}) as any;
  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const enCurso = EMERGENCIAS_RECIENTES.filter((e) => e.estado === "ATENDIENDO").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">{ROL_TITLES[rol] ?? "Dashboard"}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bienvenido, <span className="font-medium text-gray-700">{nombre}</span>
        </p>
      </div>

      {/* Alerta emergencias en curso — solo JEFE y OPERACIONES */}
      {(rol === "JEFE_COMPANIA" || rol === "OPERACIONES") && enCurso > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-700 rounded-xl text-white">
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shrink-0" />
          <div>
            <p className="font-semibold text-sm">{enCurso} partes ATENDIENDO en este momento</p>
            <p className="text-red-200 text-xs mt-0.5">Datos en tiempo real — Cía. 150 Puente Piedra</p>
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {rol === "JEFE_COMPANIA" && (<>
          <StatCard icon={Users}      label="Efectivos Activos"     value={stats.bomberos}         accent="slate" />
          <StatCard icon={Siren}      label="Emergencias (mes)"     value={stats.emergenciasMes}   accent="red"   />
          <StatCard icon={Truck}      label="Unidades Operativas"   value={stats.vehiculosOp}      accent="green" sub="M-150 · AMB-150 · CIST-150 · RESC" />
          <StatCard icon={BookOpen}   label="Cursos Activos"        value={stats.cursosActivos}    accent="blue"  />
        </>)}

        {rol === "ADMINISTRACION" && (<>
          <StatCard icon={Users}      label="Efectivos Activos"     value={stats.bomberos}          accent="slate"  />
          <StatCard icon={FileText}   label="Docs. Publicados"      value={stats.docsPublicados}    accent="green"  />
          <StatCard icon={FileText}   label="Borradores"            value={stats.borradoresDocs}    accent="yellow" />
          <StatCard icon={Users}      label="Bajas / Inactivos"     value={stats.bomberosInactivos} accent="red"    />
        </>)}

        {rol === "OPERACIONES" && (<>
          <StatCard icon={Siren}         label="Emergencias (mes)"   value={stats.emergenciasMes} accent="red"   />
          <StatCard icon={AlertTriangle} label="Atendiendo ahora"    value={stats.enCurso}        accent="red"   />
          <StatCard icon={Truck}         label="Unidades Disponibles" value={stats.vehiculosOp}   accent="green" />
          <StatCard icon={Siren}         label="Total 2026"          value={98}                   accent="slate" />
        </>)}

        {rol === "SERVICIOS_GENERALES" && (<>
          <StatCard icon={Truck}   label="Unidades Operativas" value={stats.vehiculosOp}    accent="green"  />
          <StatCard icon={Wrench}  label="Equipos con Fallas"  value={stats.equiposFalla}   accent="red"    />
          <StatCard icon={Wrench}  label="Mantt. Pendientes"   value={stats.mantPendientes} accent="yellow" />
          <StatCard icon={Package} label="Ítems Inventario"    value={10}                   accent="slate"  />
        </>)}

        {rol === "INSTRUCCION" && (<>
          <StatCard icon={BookOpen}    label="Cursos Activos"       value={stats.cursosActivos}   accent="blue"   />
          <StatCard icon={Users}       label="Matriculados"         value={stats.matriculados}    accent="green"  />
          <StatCard icon={Award}       label="Certificaciones"      value={stats.certificaciones} accent="slate"  />
          <StatCard icon={Building2}   label="Empresas Capacitadas" value={3}                     accent="yellow" />
        </>)}

        {rol === "SANIDAD" && (<>
          <StatCard icon={CheckCircle} label="Aptos Operativos"     value={stats.aptos}         accent="green"  />
          <StatCard icon={XCircle}     label="No Aptos / Restric."  value={stats.noAptos}       accent="red"    />
          <StatCard icon={HeartPulse}  label="Ítems Botiquín"       value={stats.itemsBotiquin} accent="slate"  />
          <StatCard icon={Clock}       label="Evaluaciones 2026"    value={8}                   accent="blue"   />
        </>)}

        {rol === "IMAGEN" && (<>
          <StatCard icon={Megaphone}    label="Comunicados Pub."  value={stats.publicados} accent="blue"   />
          <StatCard icon={FileText}     label="Borradores"        value={stats.borradores} accent="yellow" />
          <StatCard icon={CalendarCheck} label="Próximos Eventos" value={stats.eventos}    accent="green"  />
          <StatCard icon={Megaphone}    label="Noticias (mes)"    value={4}                accent="slate"  />
        </>)}
      </div>

      {/* ── JEFE: Gráficos + tabla de emergencias ── */}
      {rol === "JEFE_COMPANIA" && (
        <>
          {/* Gráficos emergencias */}
          <div className="grid lg:grid-cols-2 gap-5">
            <EmergenciasPorMesChart />
            <EmergenciasPorTipoChart />
          </div>

          {/* Tabla partes del día */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Partes de Emergencia — Hoy</h2>
                <p className="text-xs text-gray-400 mt-0.5">17 de abril de 2026 · {EMERGENCIAS_RECIENTES.length} partes registrados</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                {enCurso} atendiendo
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["N.° Parte","Tipo de Emergencia","Hora","Unidades","Estado"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {EMERGENCIAS_RECIENTES.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 font-medium whitespace-nowrap">{e.nroParte}</td>
                      <td className="px-5 py-3 text-gray-800 max-w-xs">
                        <p className="truncate text-sm font-medium">{e.tipo}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(e.fechaHora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {e.maquinas.map((m) => (
                            <span key={m} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded font-mono font-medium">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={e.estado}
                          color={ESTADO_COLOR[e.estado] ?? "gray"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficos asistencia */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Asistencia de Efectivos</p>
            <div className="grid lg:grid-cols-2 gap-5 mb-5">
              <AsistenciaMensualChart />
              <AsistenciaPorGradoChart />
            </div>
            <AsistenciaEfectivosTable />
          </div>

          {/* Capacitaciones a empresas */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Capacitaciones a Empresas</p>
            <div className="mb-5">
              <CapacitacionesChart />
            </div>
            <CapacitacionesTable />
          </div>
        </>
      )}

      {/* ── OPERACIONES: Tabla de partes ── */}
      {rol === "OPERACIONES" && (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            <EmergenciasPorMesChart />
            <EmergenciasPorTipoChart />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Partes del Día</h2>
              <p className="text-xs text-gray-400 mt-0.5">{EMERGENCIAS_RECIENTES.length} partes — 17 abril 2026</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["N.° Parte","Tipo de Emergencia","Hora","Unidades","Estado"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {EMERGENCIAS_RECIENTES.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 font-medium">{e.nroParte}</td>
                      <td className="px-5 py-3 text-gray-800 max-w-xs"><p className="truncate">{e.tipo}</p></td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(e.fechaHora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {e.maquinas.map((m) => (
                            <span key={m} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded font-mono">{m}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge label={e.estado} color={ESTADO_COLOR[e.estado] ?? "gray"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INSTRUCCION: Gráfico capacitaciones ── */}
      {rol === "INSTRUCCION" && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Capacitaciones a Empresas</p>
          <div className="mb-5"><CapacitacionesChart /></div>
          <CapacitacionesTable />
        </div>
      )}

      {/* ── SANIDAD: Asistencia médica ── */}
      {rol === "SANIDAD" && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Asistencia de Efectivos</p>
          <AsistenciaEfectivosTable />
        </div>
      )}

    </div>
  );
}

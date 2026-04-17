import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users, AlertTriangle, Truck, BookOpen, FileText,
  HeartPulse, Siren, Package, Award, Megaphone, CalendarCheck,
  Wrench, CheckCircle, XCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui-custom/StatCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const STATS: Record<string, Record<string, number | string>> = {
  JEFE_COMPANIA:       { bomberos: 8, emergenciasMes: 6, vehiculosOp: 4, cursosActivos: 3, emergenciasEnCurso: 1 },
  ADMINISTRACION:      { bomberos: 8, docsPublicados: 5, borradoresDocs: 2, bomberosInactivos: 2 },
  OPERACIONES:         { emergenciasMes: 6, enCurso: 1, vehiculosOp: 4 },
  SERVICIOS_GENERALES: { vehiculosOp: 4, equiposFalla: 2, mantPendientes: 3 },
  INSTRUCCION:         { cursosActivos: 3, matriculados: 23, certificaciones: 7 },
  SANIDAD:             { aptos: 6, noAptos: 1, itemsBotiquin: 10 },
  IMAGEN:              { publicados: 4, borradores: 2, eventos: 4 },
};

const EMERGENCIAS_RECIENTES = [
  { id: "1", codigoEmergencia: "EM-2026-041", tipo: "INCENDIO_URBANO", nivel: "SEGUNDA_ALARMA", estado: "EN_CURSO",   direccion: "Av. Brasil 1245",        distrito: "Breña",       fechaHoraAlerta: "2026-04-17T08:30:00", heridos: 2, bajas: 0 },
  { id: "2", codigoEmergencia: "EM-2026-040", tipo: "RESCATE_VEHICULAR", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Carretera Central km 8",  distrito: "Ate",         fechaHoraAlerta: "2026-04-16T15:10:00", heridos: 1, bajas: 0 },
  { id: "3", codigoEmergencia: "EM-2026-039", tipo: "EMERGENCIA_MEDICA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Jr. Huallaga 320",         distrito: "Cercado",     fechaHoraAlerta: "2026-04-15T22:45:00", heridos: 0, bajas: 0 },
  { id: "4", codigoEmergencia: "EM-2026-038", tipo: "INCENDIO_FORESTAL", nivel: "TERCERA_ALARMA", estado: "CONTROLADA", direccion: "Lomas de Carabayllo",  distrito: "Carabayllo",  fechaHoraAlerta: "2026-04-14T11:00:00", heridos: 0, bajas: 0 },
  { id: "5", codigoEmergencia: "EM-2026-037", tipo: "FALSA_ALARMA",      nivel: "PRIMERA_ALARMA", estado: "CANCELADA", direccion: "Av. Arequipa 3100",     distrito: "San Isidro",  fechaHoraAlerta: "2026-04-13T09:15:00", heridos: 0, bajas: 0 },
  { id: "6", codigoEmergencia: "EM-2026-036", tipo: "MATERIALES_PELIGROSOS", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Zona industrial",     distrito: "Ate Vitarte", fechaHoraAlerta: "2026-04-12T14:30:00", heridos: 3, bajas: 0 },
];

const TIPO_LABELS: Record<string, string> = {
  INCENDIO_URBANO: "Incendio Urbano", INCENDIO_FORESTAL: "Incendio Forestal",
  RESCATE_VEHICULAR: "Rescate Vehicular", RESCATE_ALTURA: "Rescate en Altura",
  RESCATE_ACUATICO: "Rescate Acuático", MATERIALES_PELIGROSOS: "Mat. Peligrosos",
  EMERGENCIA_MEDICA: "Emergencia Médica", APOYO_INTER_INSTITUCIONAL: "Apoyo Interinst.",
  FALSA_ALARMA: "Falsa Alarma", OTRO: "Otro",
};
const ESTADO_BADGE: Record<string, { label: string; color: "red"|"yellow"|"green"|"gray" }> = {
  EN_CURSO:   { label: "En Curso",   color: "red"    },
  CONTROLADA: { label: "Controlada", color: "yellow" },
  CERRADA:    { label: "Cerrada",    color: "green"  },
  CANCELADA:  { label: "Cancelada",  color: "gray"   },
};
const NIVEL_BADGE: Record<string, { label: string; color: "blue"|"yellow"|"red" }> = {
  PRIMERA_ALARMA:  { label: "1.ª Alarma", color: "blue"   },
  SEGUNDA_ALARMA:  { label: "2.ª Alarma", color: "yellow" },
  TERCERA_ALARMA:  { label: "3.ª Alarma", color: "red"    },
};
const ROL_TITLES: Record<string, string> = {
  JEFE_COMPANIA: "Vista General de la Compañía",
  ADMINISTRACION: "Área de Administración",
  SERVICIOS_GENERALES: "Área de Servicios Generales",
  INSTRUCCION: "Área de Instrucción",
  SANIDAD: "Área de Sanidad",
  OPERACIONES: "Área de Operaciones",
  IMAGEN: "Área de Imagen",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = session.user.rol;
  const nombre = session.user.nombres;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (STATS[rol] ?? {}) as any;
  const emergencias = rol === "JEFE_COMPANIA" || rol === "OPERACIONES" ? EMERGENCIAS_RECIENTES : [];
  const today = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1 capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">{ROL_TITLES[rol] ?? "Dashboard"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bienvenido, <span className="font-medium text-gray-700">{nombre}</span></p>
        </div>
      </div>

      {rol === "JEFE_COMPANIA" && (stats.emergenciasEnCurso ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-700 rounded-xl text-white">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{stats.emergenciasEnCurso} emergencia{stats.emergenciasEnCurso > 1 ? "s" : ""} EN CURSO</p>
            <p className="text-red-200 text-xs mt-0.5">Revisar módulo de Operaciones</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rol === "JEFE_COMPANIA" && (<>
          <StatCard icon={Users}      label="Bomberos Activos"     value={stats.bomberos}         accent="slate" />
          <StatCard icon={Siren}      label="Emergencias (mes)"    value={stats.emergenciasMes}   accent="red"   />
          <StatCard icon={Truck}      label="Vehículos Operativos" value={stats.vehiculosOp}      accent="green" />
          <StatCard icon={BookOpen}   label="Cursos Activos"       value={stats.cursosActivos}    accent="blue"  />
        </>)}
        {rol === "ADMINISTRACION" && (<>
          <StatCard icon={Users}      label="Bomberos Activos"     value={stats.bomberos}          accent="slate"  />
          <StatCard icon={FileText}   label="Docs. Publicados"     value={stats.docsPublicados}    accent="green"  />
          <StatCard icon={FileText}   label="Borradores"           value={stats.borradoresDocs}    accent="yellow" />
          <StatCard icon={Users}      label="Bajas / Inactivos"    value={stats.bomberosInactivos} accent="red"    />
        </>)}
        {rol === "OPERACIONES" && (<>
          <StatCard icon={Siren}         label="Emergencias (mes)"  value={stats.emergenciasMes} accent="red"   />
          <StatCard icon={AlertTriangle} label="En Curso"           value={stats.enCurso}        accent="red"   />
          <StatCard icon={Truck}         label="Vehículos Disp."    value={stats.vehiculosOp}    accent="green" />
          <StatCard icon={Siren}         label="Total 2026"         value={24}                   accent="slate" />
        </>)}
        {rol === "SERVICIOS_GENERALES" && (<>
          <StatCard icon={Truck}   label="Vehículos Operativos" value={stats.vehiculosOp}    accent="green"  />
          <StatCard icon={Wrench}  label="Equipos con Fallas"   value={stats.equiposFalla}   accent="red"    />
          <StatCard icon={Wrench}  label="Mantt. Pendientes"    value={stats.mantPendientes} accent="yellow" />
          <StatCard icon={Package} label="Total Inventario"     value={10}                   accent="slate"  />
        </>)}
        {rol === "INSTRUCCION" && (<>
          <StatCard icon={BookOpen} label="Cursos Activos"   value={stats.cursosActivos}  accent="blue"   />
          <StatCard icon={Users}    label="Matriculados"     value={stats.matriculados}   accent="green"  />
          <StatCard icon={Award}    label="Certificaciones"  value={stats.certificaciones} accent="slate" />
          <StatCard icon={BookOpen} label="Cursos 2025–2026" value={5}                    accent="yellow" />
        </>)}
        {rol === "SANIDAD" && (<>
          <StatCard icon={CheckCircle} label="Aptos Operativos"    value={stats.aptos}         accent="green"  />
          <StatCard icon={XCircle}     label="No Aptos / Restric." value={stats.noAptos}        accent="red"   />
          <StatCard icon={HeartPulse}  label="Items Botiquín"      value={stats.itemsBotiquin} accent="slate"  />
          <StatCard icon={HeartPulse}  label="Evaluaciones"        value={7}                   accent="blue"   />
        </>)}
        {rol === "IMAGEN" && (<>
          <StatCard icon={Megaphone}    label="Comunicados Pub."  value={stats.publicados} accent="blue"   />
          <StatCard icon={FileText}     label="Borradores"        value={stats.borradores} accent="yellow" />
          <StatCard icon={CalendarCheck} label="Próximos Eventos" value={stats.eventos}    accent="green"  />
          <StatCard icon={Megaphone}    label="Noticias (mes)"    value={3}                accent="slate"  />
        </>)}
      </div>

      {emergencias.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Emergencias Recientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimas {emergencias.length} atenciones registradas</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Código","Tipo","Dirección","Fecha","Nivel","Estado"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emergencias.map((e) => {
                  const estado = ESTADO_BADGE[e.estado] ?? { label: e.estado, color: "gray" as const };
                  const nivel = NIVEL_BADGE[e.nivel] ?? { label: e.nivel, color: "blue" as const };
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-500 font-medium">{e.codigoEmergencia}</td>
                      <td className="px-6 py-3.5 text-gray-800 font-medium">{TIPO_LABELS[e.tipo] ?? e.tipo}</td>
                      <td className="px-6 py-3.5 text-gray-500 max-w-xs truncate">{e.direccion}, {e.distrito}</td>
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(e.fechaHoraAlerta).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3.5"><StatusBadge label={nivel.label} color={nivel.color} /></td>
                      <td className="px-6 py-3.5"><StatusBadge label={estado.label} color={estado.color} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

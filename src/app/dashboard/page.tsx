import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Users, AlertTriangle, Truck, BookOpen, FileText,
  HeartPulse, Siren, Package, Award, Megaphone, CalendarCheck,
  Wrench, CheckCircle, XCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui-custom/StatCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

async function getStats(rol: string) {
  if (rol === "JEFE_COMPANIA") {
    const [bomberos, emergenciasMes, vehiculosOp, cursosActivos, emergenciasEnCurso] = await Promise.all([
      prisma.bombero.count({ where: { estado: "ACTIVO" } }),
      prisma.emergencia.count({ where: { fechaHoraAlerta: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.vehiculo.count({ where: { estado: "OPERATIVO" } }),
      prisma.curso.count({ where: { activo: true } }),
      prisma.emergencia.count({ where: { estado: "EN_CURSO" } }),
    ]);
    return { bomberos, emergenciasMes, vehiculosOp, cursosActivos, emergenciasEnCurso };
  }
  if (rol === "ADMINISTRACION") {
    const [bomberos, docsPublicados, borradoresDocs, bomberosInactivos] = await Promise.all([
      prisma.bombero.count({ where: { estado: "ACTIVO" } }),
      prisma.documento.count({ where: { estado: "PUBLICADO" } }),
      prisma.documento.count({ where: { estado: "BORRADOR" } }),
      prisma.bombero.count({ where: { estado: { not: "ACTIVO" } } }),
    ]);
    return { bomberos, docsPublicados, borradoresDocs, bomberosInactivos };
  }
  if (rol === "OPERACIONES") {
    const [emergenciasMes, enCurso, vehiculosOp] = await Promise.all([
      prisma.emergencia.count({ where: { fechaHoraAlerta: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.emergencia.count({ where: { estado: "EN_CURSO" } }),
      prisma.vehiculo.count({ where: { estado: "OPERATIVO" } }),
    ]);
    return { emergenciasMes, enCurso, vehiculosOp };
  }
  if (rol === "SERVICIOS_GENERALES") {
    const [vehiculosOp, equiposFalla, mantPendientes] = await Promise.all([
      prisma.vehiculo.count({ where: { estado: "OPERATIVO" } }),
      prisma.equipo.count({ where: { estado: { in: ["EN_REPARACION", "FUERA_DE_SERVICIO"] } } }),
      prisma.mantenimiento.count({ where: { estado: "PENDIENTE" } }),
    ]);
    return { vehiculosOp, equiposFalla, mantPendientes };
  }
  if (rol === "INSTRUCCION") {
    const [cursosActivos, matriculados, certificaciones] = await Promise.all([
      prisma.curso.count({ where: { activo: true } }),
      prisma.matricula.count({ where: { estado: "MATRICULADO" } }),
      prisma.certificacion.count(),
    ]);
    return { cursosActivos, matriculados, certificaciones };
  }
  if (rol === "SANIDAD") {
    const [aptos, noAptos, itemsBotiquin] = await Promise.all([
      prisma.fichaMedica.count({ where: { aptitudOperativa: true } }),
      prisma.fichaMedica.count({ where: { aptitudOperativa: false } }),
      prisma.itemBotiquin.count(),
    ]);
    return { aptos, noAptos, itemsBotiquin };
  }
  if (rol === "IMAGEN") {
    const [publicados, borradores, eventos] = await Promise.all([
      prisma.comunicado.count({ where: { estado: "PUBLICADO" } }),
      prisma.comunicado.count({ where: { estado: "BORRADOR" } }),
      prisma.evento.count({ where: { fechaInicio: { gte: new Date() } } }),
    ]);
    return { publicados, borradores, eventos };
  }
  return {};
}

async function getRecentEmergencias() {
  return prisma.emergencia.findMany({
    orderBy: { fechaHoraAlerta: "desc" },
    take: 8,
    select: {
      id: true, codigoEmergencia: true, tipo: true, nivel: true,
      estado: true, direccion: true, distrito: true,
      fechaHoraAlerta: true, heridos: true, bajas: true,
    },
  });
}

const TIPO_LABELS: Record<string, string> = {
  INCENDIO_URBANO: "Incendio Urbano", INCENDIO_FORESTAL: "Incendio Forestal",
  RESCATE_VEHICULAR: "Rescate Vehicular", RESCATE_ALTURA: "Rescate en Altura",
  RESCATE_ACUATICO: "Rescate Acuático", MATERIALES_PELIGROSOS: "Mat. Peligrosos",
  EMERGENCIA_MEDICA: "Emergencia Médica", APOYO_INTER_INSTITUCIONAL: "Apoyo Interinst.",
  FALSA_ALARMA: "Falsa Alarma", OTRO: "Otro",
};

const ESTADO_BADGE: Record<string, { label: string; color: "red" | "yellow" | "green" | "gray" }> = {
  EN_CURSO:   { label: "En Curso",   color: "red"    },
  CONTROLADA: { label: "Controlada", color: "yellow" },
  CERRADA:    { label: "Cerrada",    color: "green"  },
  CANCELADA:  { label: "Cancelada",  color: "gray"   },
};

const NIVEL_BADGE: Record<string, { label: string; color: "blue" | "yellow" | "red" }> = {
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
  const stats = await getStats(rol) as any;
  const emergencias =
    rol === "JEFE_COMPANIA" || rol === "OPERACIONES"
      ? await getRecentEmergencias()
      : [];

  const today = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1 capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">{ROL_TITLES[rol] ?? "Dashboard"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bienvenido, <span className="font-medium text-gray-700">{nombre}</span>
          </p>
        </div>
      </div>

      {/* Alerta emergencia en curso */}
      {rol === "JEFE_COMPANIA" && (stats.emergenciasEnCurso ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-700 rounded-xl text-white">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {stats.emergenciasEnCurso} emergencia{stats.emergenciasEnCurso > 1 ? "s" : ""} EN CURSO
            </p>
            <p className="text-red-200 text-xs mt-0.5">Revisar módulo de Operaciones</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rol === "JEFE_COMPANIA" && (<>
          <StatCard icon={Users}      label="Bomberos Activos"    value={stats.bomberos}       accent="slate" />
          <StatCard icon={Siren}      label="Emergencias (mes)"   value={stats.emergenciasMes} accent="red"   />
          <StatCard icon={Truck}      label="Vehículos Operativos" value={stats.vehiculosOp}   accent="green" />
          <StatCard icon={BookOpen}   label="Cursos Activos"       value={stats.cursosActivos} accent="blue"  />
        </>)}
        {rol === "ADMINISTRACION" && (<>
          <StatCard icon={Users}      label="Bomberos Activos"    value={stats.bomberos}         accent="slate"  />
          <StatCard icon={FileText}   label="Docs. Publicados"    value={stats.docsPublicados}   accent="green"  />
          <StatCard icon={FileText}   label="Borradores"          value={stats.borradoresDocs}   accent="yellow" />
          <StatCard icon={Users}      label="Bajas / Inactivos"   value={stats.bomberosInactivos} accent="red"  />
        </>)}
        {rol === "OPERACIONES" && (<>
          <StatCard icon={Siren}      label="Emergencias (mes)"   value={stats.emergenciasMes} accent="red"   />
          <StatCard icon={AlertTriangle} label="En Curso"         value={stats.enCurso}        accent="red"   />
          <StatCard icon={Truck}      label="Vehículos Disp."    value={stats.vehiculosOp}     accent="green" />
          <StatCard icon={Siren}      label="Total 2026"          value={15}                   accent="slate" />
        </>)}
        {rol === "SERVICIOS_GENERALES" && (<>
          <StatCard icon={Truck}      label="Vehículos Operativos" value={stats.vehiculosOp}   accent="green"  />
          <StatCard icon={Wrench}     label="Equipos con Fallas"  value={stats.equiposFalla}   accent="red"    />
          <StatCard icon={Wrench}     label="Mantt. Pendientes"   value={stats.mantPendientes} accent="yellow" />
          <StatCard icon={Package}    label="Total Inventario"    value={8}                    accent="slate"  />
        </>)}
        {rol === "INSTRUCCION" && (<>
          <StatCard icon={BookOpen}   label="Cursos Activos"      value={stats.cursosActivos}  accent="blue"   />
          <StatCard icon={Users}      label="Matriculados"        value={stats.matriculados}   accent="green"  />
          <StatCard icon={Award}      label="Certificaciones"     value={stats.certificaciones} accent="slate" />
          <StatCard icon={BookOpen}   label="Cursos 2025–2026"   value={6}                    accent="yellow" />
        </>)}
        {rol === "SANIDAD" && (<>
          <StatCard icon={CheckCircle} label="Aptos Operativos"  value={stats.aptos}          accent="green"  />
          <StatCard icon={XCircle}     label="No Aptos / Restric." value={stats.noAptos}       accent="red"   />
          <StatCard icon={HeartPulse}  label="Items Botiquín"    value={stats.itemsBotiquin}  accent="slate"  />
          <StatCard icon={HeartPulse}  label="Evaluaciones"      value={5}                    accent="blue"   />
        </>)}
        {rol === "IMAGEN" && (<>
          <StatCard icon={Megaphone}    label="Comunicados Pub."  value={stats.publicados}     accent="blue"   />
          <StatCard icon={FileText}     label="Borradores"        value={stats.borradores}     accent="yellow" />
          <StatCard icon={CalendarCheck} label="Próximos Eventos" value={stats.eventos}        accent="green"  />
          <StatCard icon={Megaphone}    label="Noticias (mes)"    value={3}                    accent="slate"  />
        </>)}
      </div>

      {/* Tabla emergencias */}
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dirección</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
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
                      <td className="px-6 py-3.5">
                        <StatusBadge label={nivel.label} color={nivel.color} />
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge label={estado.label} color={estado.color} />
                      </td>
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

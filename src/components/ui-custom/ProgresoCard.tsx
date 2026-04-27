"use client";

import { Flame, Lock, CheckCircle, Clock, Shield, TrendingUp } from "lucide-react";
import type { RachaData } from "@/lib/racha";

interface Props {
  racha: RachaData;
  horas: number;
  meta: number;
  pct: number;
}

interface Recompensa {
  id: string;
  icon: React.ElementType;
  label: string;
  descripcion: string;
  requisito: string;
  desbloqueada: boolean;
}

function getRecompensas(racha: RachaData, pct: number): Recompensa[] {
  return [
    {
      id: "turno",
      icon: Shield,
      label: "Ver quién está en turno",
      descripcion: "Consulta en tiempo real quién está en la compañía ahora mismo.",
      requisito: "Asistir al menos 1 vez esta semana",
      desbloqueada: racha.asistioEstaSemana,
    },
    {
      id: "unidades",
      icon: TrendingUp,
      label: "Ver estado de unidades",
      descripcion: "Conoce el estado operativo de cada vehículo de la compañía.",
      requisito: "Mantener racha de 2 semanas",
      desbloqueada: racha.rachaActual >= 2,
    },
    {
      id: "ranking",
      icon: CheckCircle,
      label: "Ver ranking completo",
      descripcion: "Accede al ranking de horas de todos los bomberos del mes.",
      requisito: "Cumplir la meta de horas del mes",
      desbloqueada: pct >= 100,
    },
  ];
}

function RachaIndicator({ semanas, activa }: { semanas: number; activa: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      activa
        ? semanas >= 4 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
        : "bg-gray-50 border-gray-200"
    }`}>
      <Flame className={`w-4 h-4 shrink-0 ${
        activa
          ? semanas >= 4 ? "text-red-600" : "text-amber-500"
          : "text-gray-300"
      }`} />
      <div>
        <p className={`text-sm font-bold leading-tight ${
          activa
            ? semanas >= 4 ? "text-red-700" : "text-amber-700"
            : "text-gray-400"
        }`}>
          {activa ? `${semanas} semana${semanas !== 1 ? "s" : ""} seguida${semanas !== 1 ? "s" : ""}` : "Sin racha activa"}
        </p>
        <p className="text-[11px] text-gray-400 leading-tight">
          {activa ? "racha activa" : "asiste esta semana para empezar"}
        </p>
      </div>
    </div>
  );
}

export function ProgresoCard({ racha, horas, meta, pct }: Props) {
  const recompensas = getRecompensas(racha, pct);
  const desbloqueadas = recompensas.filter(r => r.desbloqueada).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <Flame className="w-4 h-4 text-red-600" />
        <h2 className="font-bold text-gray-900 text-sm">Tu Progreso</h2>
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
          {desbloqueadas}/{recompensas.length} desbloqueados
        </span>
      </div>

      <div className="p-4 space-y-4">

        {/* Racha semanal */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Racha semanal</p>
          <RachaIndicator semanas={racha.rachaActual} activa={racha.rachaActual > 0} />

          {/* Mini calendario últimas 4 semanas */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[3, 2, 1, 0].map(offset => {
              const hoy = new Date();
              const d = new Date(hoy);
              d.setDate(d.getDate() - offset * 7);
              const label = offset === 0 ? "Esta sem." : offset === 1 ? "Ant." : `S-${offset + 1}`;

              // Determinar si asistió esa semana
              let asistio = false;
              if (offset === 0) asistio = racha.asistioEstaSemana;
              else if (offset === 1) asistio = racha.asistioSemanaAnterior;
              else asistio = racha.rachaActual > offset;

              return (
                <div key={offset} className={`rounded-lg px-1.5 py-1.5 text-center border ${
                  asistio ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                }`}>
                  <CheckCircle className={`w-3 h-3 mx-auto mb-0.5 ${asistio ? "text-green-500" : "text-gray-300"}`} />
                  <p className={`text-[10px] font-medium leading-tight ${asistio ? "text-green-700" : "text-gray-400"}`}>
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          {racha.rachaMejor > racha.rachaActual && (
            <p className="text-[11px] text-gray-400 mt-2">
              Mejor racha: <span className="font-semibold text-gray-600">{racha.rachaMejor} semanas</span>
            </p>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-gray-100" />

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Días / 4 sem.</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{racha.diasUltimas4Semanas}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Shield className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total turnos</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{racha.totalTurnos}</p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-100" />

        {/* Recompensas */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Accesos desbloqueables</p>
          <div className="space-y-2">
            {recompensas.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  r.desbloqueada
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    r.desbloqueada ? "bg-green-100" : "bg-gray-200"
                  }`}>
                    {r.desbloqueada
                      ? <Icon className="w-3.5 h-3.5 text-green-700" />
                      : <Lock className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${
                      r.desbloqueada ? "text-green-800" : "text-gray-500"
                    }`}>{r.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      {r.desbloqueada ? r.descripcion : r.requisito}
                    </p>
                  </div>
                  {r.desbloqueada && (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

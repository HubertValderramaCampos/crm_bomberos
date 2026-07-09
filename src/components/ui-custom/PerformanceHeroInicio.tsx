import { Gauge, AlertTriangle, MessageCircle, Siren, Clock, Percent } from "lucide-react";
import type { UnidadPerf } from "@/lib/performanceCia";

interface Props {
  unidades: UnidadPerf[];
  periodoLabel: string;
  linkWa: string | null;
}

const UMBRAL_ALERTA = 70;

function fmtHoras(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(1)} h`;
}

function fmtMin(m: number | null) {
  if (m == null) return "—";
  return `${Math.round(m)} min`;
}

function esCaida(u: UnidadPerf) {
  if (u.motivo) return true;
  return u.estado !== "EN BASE" && u.estado !== "EN EMERGENCIA";
}

export function PerformanceHeroInicio({ unidades, periodoLabel, linkWa }: Props) {
  const totalUnidades = unidades.length;
  const caidas = unidades.filter(esCaida);

  const totalServicios = unidades.reduce((s, u) => s + u.total, 0);
  const totalHorasFuera = unidades.reduce((s, u) => s + u.horasFuera, 0);
  // Performance de la compañía = promedio del indicador de cada unidad, que solo
  // baja por horas fuera de servicio (ver disponibilidadPct en performanceCia.ts).
  const performancePct = totalUnidades > 0
    ? unidades.reduce((s, u) => s + u.disponibilidadPct, 0) / totalUnidades
    : 100;
  const conRespuesta = unidades.filter(u => u.minRespuesta != null);
  const respuestaProm = conRespuesta.length > 0
    ? conRespuesta.reduce((s, u) => s + (u.minRespuesta as number), 0) / conRespuesta.length
    : null;

  const filas = [...unidades].sort((a, b) => a.disponibilidadPct - b.disponibilidadPct);

  const kpis = [
    { icon: Percent, label: "Performance", value: `${performancePct.toFixed(0)}%`, sub: "promedio de disponibilidad de la flota", alerta: performancePct < UMBRAL_ALERTA },
    { icon: Clock, label: "Resp. promedio", value: fmtMin(respuestaProm), sub: "despacho → llegada", alerta: false },
    { icon: AlertTriangle, label: "Horas fuera", value: fmtHoras(totalHorasFuera), sub: "suma de toda la flota", alerta: false },
    { icon: Siren, label: "Servicios", value: String(totalServicios), sub: "atendidos en el período", alerta: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-gray-400" />
        <h2 className="font-semibold text-gray-900 text-sm">Operatividad de la Compañía</h2>
        <span className="ml-auto text-xs text-gray-400">{periodoLabel}</span>
      </div>

      <div className="p-5">
        {caidas.length > 0 && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-red-800 leading-snug">
                <span className="font-bold">{caidas.length} de {totalUnidades} unidades</span> {caidas.length === 1 ? "no está disponible" : "no están disponibles"} ahora mismo.
              </p>
              <p className="text-xs text-red-600/80 mt-1 leading-snug">
                {caidas.map(u => `${u.codigo}${u.motivo ? ` (${u.motivo})` : ""}`).join(" · ")}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden mb-5">
          {kpis.map(({ icon: Icon, label, value, sub, alerta }) => (
            <div key={label} className="bg-white px-3.5 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${alerta ? "text-red-600" : "text-gray-900"}`}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {filas.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Tiempo en base durante el período</p>
            <div className="flex flex-col gap-2">
              {filas.map(u => {
                const alerta = u.disponibilidadPct < UMBRAL_ALERTA;
                const caida = esCaida(u);
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs font-mono font-bold text-gray-700 flex items-center gap-1">
                      {u.codigo}
                      {caida && (
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700 leading-none">FALLA</span>
                      )}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${alerta ? "bg-red-500" : "bg-gray-800"}`} style={{ width: `${u.disponibilidadPct}%` }} />
                    </div>
                    <span className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${alerta ? "text-red-600" : "text-gray-900"}`}>{u.disponibilidadPct.toFixed(0)}%</span>
                    <span className="w-16 shrink-0 text-right text-[10px] text-gray-400 tabular-nums hidden sm:inline">{fmtMin(u.minRespuesta)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {linkWa && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5 pt-4 border-t border-gray-100">
            <a
              href={linkWa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" /> Reservar guardia
            </a>
            <p className="text-xs text-gray-400 leading-snug">
              Más guardias cubiertas significan más unidades disponibles y mejor tiempo de respuesta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Gauge, AlertTriangle, MessageCircle, Siren, Clock, Percent,
  ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import type { UnidadPerf, Periodo } from "@/lib/performanceCia";

interface Props {
  unidades: UnidadPerf[];
  periodo: Periodo;
  fecha: string;
  periodoLabel: string;
  linkWa: string | null;
}

// Semáforo de disponibilidad: 76-100% verde, 51-75% amarillo, ≤50% rojo
const UMBRAL_VERDE = 76;
const UMBRAL_AMARILLO = 51;

function colorEstado(pct: number): { fill: string; text: string; textSuave: string } {
  if (pct >= UMBRAL_VERDE) return { fill: "url(#perfVerde)", text: "text-green-600", textSuave: "text-green-400" };
  if (pct >= UMBRAL_AMARILLO) return { fill: "url(#perfAmarillo)", text: "text-amber-600", textSuave: "text-amber-400" };
  return { fill: "url(#perfRojo)", text: "text-red-600", textSuave: "text-red-400" };
}

// Orden fijo de unidades pedido por la compañía (no alfabético / no por métrica)
const ORDEN_UNIDADES = ["M150-1", "M150-3", "AMB-150", "RESLIG-150", "CIST-150"];

const PERIODOS: { v: Periodo; l: string }[] = [
  { v: "dia",    l: "Día" },
  { v: "semana", l: "Semana" },
  { v: "mes",    l: "Mes" },
];

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

function CeldaTooltip({ active, payload }: { active?: boolean; payload?: { payload: UnidadPerf }[] }) {
  if (!active || !payload?.length) return null;
  const u = payload[0].payload;
  const c = colorEstado(u.disponibilidadPct);
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="font-bold font-mono">{u.codigo}</p>
      <p className={c.textSuave}>
        {u.disponibilidadPct.toFixed(0)}% de tiempo en servicio
      </p>
      <p className="text-white/60">Resp. promedio: {fmtMin(u.minRespuesta)}</p>
      <p className="text-white/60">{u.total} servicio{u.total === 1 ? "" : "s"} en el período</p>
      {esCaida(u) && <p className="text-red-400 font-semibold">⚠ Fuera de servicio ahora {u.motivo ? `(${u.motivo})` : ""}</p>}
    </div>
  );
}

export function PerformanceHeroInicio({ unidades, periodo, fecha, periodoLabel, linkWa }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

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

  // Orden fijo pedido, con cualquier unidad no listada al final (por si se agrega una nueva)
  const datos = [...unidades].sort((a, b) => {
    const ia = ORDEN_UNIDADES.indexOf(a.codigo);
    const ib = ORDEN_UNIDADES.indexOf(b.codigo);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const kpis = [
    { icon: Percent, label: "Performance", value: `${performancePct.toFixed(0)}%`, sub: "promedio de la flota", color: colorEstado(performancePct).text },
    { icon: Clock, label: "Resp. promedio", value: fmtMin(respuestaProm), sub: "despacho → llegada", color: "text-gray-900" },
    { icon: AlertTriangle, label: "Horas fuera", value: fmtHoras(totalHorasFuera), sub: "suma de toda la flota", color: "text-gray-900" },
    { icon: Siren, label: "Servicios", value: String(totalServicios), sub: "atendidos en el período", color: "text-gray-900" },
  ];

  function ir(nuevoPeriodo: Periodo, nuevaFecha: string) {
    const params = new URLSearchParams({ periodo: nuevoPeriodo, fecha: nuevaFecha });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function desplazar(dias: number) {
    const [y, m, d] = fecha.split("-").map(Number);
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + dias);
    const nueva = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
    ir(periodo, nueva);
  }

  function irHoy() {
    const hoy = new Date();
    const nueva = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    ir(periodo, nueva);
  }

  const salto = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-4 h-4 text-gray-400 shrink-0" />
          <h2 className="font-semibold text-gray-900 text-sm truncate">Operatividad de la Compañía</h2>
        </div>

        <div className={`flex items-center gap-2 sm:ml-auto flex-wrap ${pending ? "opacity-60 pointer-events-none" : ""}`}>
          <span className="text-xs text-gray-400 mr-1 hidden sm:inline">{periodoLabel}</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {PERIODOS.map(p => (
              <button
                key={p.v}
                onClick={() => ir(p.v, fecha)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  periodo === p.v ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => desplazar(-salto)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button onClick={irHoy} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-600">
              <CalendarDays className="w-3.5 h-3.5" /> Hoy
            </button>
            <button onClick={() => desplazar(salto)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <p className="px-5 pt-3 text-xs text-gray-400 sm:hidden">{periodoLabel}</p>

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
          {kpis.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white px-3.5 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {datos.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">% de tiempo de servicio por unidad</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datos} margin={{ top: 20, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
                <defs>
                  <linearGradient id="perfVerde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <linearGradient id="perfAmarillo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="perfRojo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="codigo" tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CeldaTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="disponibilidadPct" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="disponibilidadPct" position="top" formatter={(v: string | number | boolean | null | undefined) => typeof v === "number" ? `${v.toFixed(0)}%` : ""} style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }} />
                  {datos.map(u => (
                    <Cell key={u.id} fill={colorEstado(u.disponibilidadPct).fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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

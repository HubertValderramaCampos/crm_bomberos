"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, CalendarCheck, X, ChevronDown, ChevronUp,
  TrendingDown, AlertCircle, CheckCircle2, Search, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const TIPOS_ACTIVIDAD = [
  "Capacitación interna", "Capacitación externa", "Simulacro",
  "Campaña preventiva", "Desfile / Acto cívico", "Reunión de compañía",
  "Mantenimiento", "Proyección social", "Otro",
];

interface ResumenActividad {
  id: number; fecha: string; tipo: string; descripcion: string | null;
  total: number; asistieron: number; faltaron: number; sin_marcar: number;
}
interface RankingBombero {
  id: number; apellidos: string; nombres: string; grado: string; codigo: string;
  faltas: number; asistencias: number; total_convocado: number;
}
interface DetalleRow {
  actividad_id: number; fecha: string; tipo: string; descripcion: string | null;
  bombero_id: number; apellidos: string; nombres: string; grado: string; codigo: string;
  asistio: boolean | null; justificacion: string | null; agregado_al_finalizar: boolean;
}
interface Actividad { id: number; fecha: string; tipo: string; descripcion: string | null; }

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export default function AsistenciasEventosPage() {
  const anioActual = new Date().getFullYear();
  const [anio,          setAnio]          = useState(anioActual);
  const [tipo,          setTipo]          = useState("");
  const [actividadId,   setActividadId]   = useState("");
  const [busqBombero,   setBusqBombero]   = useState("");
  const [resumen,       setResumen]       = useState<ResumenActividad[]>([]);
  const [ranking,       setRanking]       = useState<RankingBombero[]>([]);
  const [actividades,   setActividades]   = useState<Actividad[]>([]);
  const [detalle,       setDetalle]       = useState<DetalleRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expandido,     setExpandido]     = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ anio: String(anio) });
    if (tipo)       params.set("tipo", tipo);
    if (actividadId) params.set("actividad_id", actividadId);
    const data = await fetch(`/api/programacion/asistencias?${params}`).then(r => r.json());
    setResumen(data.resumen ?? []);
    setRanking(data.ranking ?? []);
    setActividades(data.actividades ?? []);
    setDetalle(data.detalle ?? []);
    setLoading(false);
  }, [anio, tipo, actividadId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Datos para gráfica de faltas por bombero (top 10)
  const chartData = ranking
    .filter(b => b.faltas > 0)
    .slice(0, 10)
    .map(b => ({
      nombre: b.apellidos.split(",")[0].trim(),
      faltas: b.faltas,
      asistencias: b.asistencias,
    }));

  // Detalle filtrado por búsqueda de bombero
  const detalleFiltrado = detalle.filter(d =>
    !busqBombero || `${d.apellidos} ${d.nombres} ${d.codigo}`.toLowerCase().includes(busqBombero.toLowerCase())
  );

  const totalConvocados = resumen.reduce((s, r) => s + r.total, 0);
  const totalAsistieron = resumen.reduce((s, r) => s + r.asistieron, 0);
  const totalFaltaron   = resumen.reduce((s, r) => s + r.faltaron, 0);

  function fmt(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-red-700" />
            Asistencias a eventos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Registro de asistencia de efectivos en actividades finalizadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30">
              {[anioActual, anioActual - 1, anioActual - 2].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de actividad</label>
            <select value={tipo} onChange={e => { setTipo(e.target.value); setActividadId(""); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 min-w-[180px]">
              <option value="">Todos los tipos</option>
              {TIPOS_ACTIVIDAD.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Evento específico</label>
            <select value={actividadId} onChange={e => setActividadId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 min-w-[220px]">
              <option value="">Todos los eventos</option>
              {actividades.map(a => (
                <option key={a.id} value={String(a.id)}>
                  {fmt(a.fecha)} — {a.descripcion ?? a.tipo}
                </option>
              ))}
            </select>
          </div>
          {(tipo || actividadId) && (
            <button onClick={() => { setTipo(""); setActividadId(""); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Eventos",         value: resumen.length,   color: "text-gray-900"   },
              { label: "Convocados",       value: totalConvocados,  color: "text-blue-700"   },
              { label: "Asistieron",       value: totalAsistieron,  color: "text-green-700"  },
              { label: "Faltaron",         value: totalFaltaron,    color: "text-red-700"    },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                {k.label === "Asistieron" && totalConvocados > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{pct(totalAsistieron, totalConvocados)}% asistencia</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfica de faltas por bombero */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-bold text-gray-900">Efectivos con más inasistencias</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v, name) => [v, name === "faltas" ? "Faltas" : "Asistencias"]} />
                    <Bar dataKey="faltas" name="Faltas" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? "#dc2626" : i === 1 ? "#ef4444" : "#f87171"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ranking tabla */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" /> Ranking de inasistencias
                </h2>
              </div>
              {ranking.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">Sin datos registrados</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Efectivo", "Faltas", "Asistencias", "% Asist."].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ranking.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-900 text-xs">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                              <p className="text-[10px] text-gray-400">{b.grado}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`font-bold text-sm ${b.faltas > 2 ? "text-red-600" : b.faltas > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                {b.faltas}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-green-700 font-medium">{b.asistencias}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${pct(b.asistencias, b.total_convocado) >= 80 ? "bg-green-500" : pct(b.asistencias, b.total_convocado) >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                    style={{ width: `${pct(b.asistencias, b.total_convocado)}%` }} />
                                </div>
                                <span className="text-xs text-gray-600">{pct(b.asistencias, b.total_convocado)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>

          {/* Resumen por evento */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 px-1 flex items-center gap-2">
              <Filter className="w-4 h-4 text-red-700" /> Detalle por evento
            </h2>
            {resumen.length === 0
              ? <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center"><p className="text-sm text-gray-400">Sin eventos finalizados con registro de asistencia.</p></div>
              : resumen.map(ev => {
                const filas = detalleFiltrado.filter(d => d.actividad_id === ev.id);
                return (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{ev.descripcion ?? ev.tipo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(ev.fecha)} · {ev.tipo}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="font-bold text-green-700">{ev.asistieron}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span className="font-bold text-red-600">{ev.faltaron}</span>
                        </div>
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${pct(ev.asistieron, ev.total) >= 80 ? "bg-green-500" : "bg-amber-400"}`}
                            style={{ width: `${pct(ev.asistieron, ev.total)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{pct(ev.asistieron, ev.total)}%</span>
                        {expandido === ev.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandido === ev.id && (
                      <div className="border-t border-gray-100">
                        {/* Búsqueda dentro del evento */}
                        <div className="px-5 py-3 border-b border-gray-50">
                          <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input value={busqBombero} onChange={e => setBusqBombero(e.target.value)}
                              placeholder="Buscar efectivo..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                          </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Efectivo</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Justificación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filas.map(f => (
                              <tr key={f.bombero_id} className={f.asistio === false ? "bg-red-50/40" : ""}>
                                <td className="px-5 py-2.5">
                                  <p className="font-medium text-gray-900 text-xs">{f.apellidos.split(",")[0]}, {f.nombres.split(" ")[0]}</p>
                                  <p className="text-[10px] text-gray-400">{f.grado}</p>
                                  {f.agregado_al_finalizar && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Agregado</span>}
                                </td>
                                <td className="px-4 py-2.5">
                                  {f.asistio === true  && <span className="flex items-center gap-1 text-xs text-green-700 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Asistió</span>}
                                  {f.asistio === false && <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertCircle className="w-3.5 h-3.5" />Faltó</span>}
                                  {f.asistio === null  && <span className="text-xs text-gray-400">Sin marcar</span>}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-500">{f.justificacion ?? <span className="text-gray-300">—</span>}</td>
                              </tr>
                            ))}
                            {filas.length === 0 && (
                              <tr><td colSpan={3} className="px-5 py-4 text-xs text-gray-400 text-center">Sin efectivos registrados para este evento.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        </>
      )}
    </div>
  );
}

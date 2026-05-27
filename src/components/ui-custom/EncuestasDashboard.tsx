"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  ClipboardList, Users, ThumbsUp, ThumbsDown, Star,
  Filter, TrendingUp, AlertTriangle, RefreshCw,
} from "lucide-react";

/* ── tipos ───────────────────────────────────────────── */
interface Stats {
  totales: { total_respuestas: number; total_tokens: number; total_entidades: number };
  calificaciones: { campo: string; valor: string; cnt: number }[];
  booleanos: { campo: string; si_count: number; no_count: number }[];
  aspectos: { aspecto: string; cnt: number }[];
  porMes: { mes: string; cnt: number }[];
  porEntidad: { entidad_nombre: string; tipo: string; cnt: number }[];
}
interface Entidad { id: number; nombre: string; tipo: string; }

/* ── constantes ──────────────────────────────────────── */
const TIPOS_ENTIDAD = ["EMPRESA", "INSTITUCIÓN PÚBLICA", "ONG", "HOSPITAL", "MUNICIPALIDAD", "OTRO"];

const CALIF_ORDER  = ["Excelente", "Bueno", "Regular", "Malo"];
const CALIF_COLORS: Record<string, string> = {
  Excelente: "#16a34a",
  Bueno:     "#2563eb",
  Regular:   "#d97706",
  Malo:      "#dc2626",
};

const CAMPO_LABEL: Record<string, string> = {
  contenido:     "Contenido",
  materiales:    "Materiales",
  dinamica:      "Dinámica expositores",
  conocimiento:  "Conocimiento expositores",
  objetivos:     "Objetivos alcanzados",
  duracion:      "Duración adecuada",
  dinamicas:     "Dinámicas correctas",
  recomendaria:  "Recomendaría",
};

const TIPO_COLOR: Record<string, string> = {
  "EMPRESA":              "#3b82f6",
  "INSTITUCIÓN PÚBLICA":  "#8b5cf6",
  "ONG":                  "#10b981",
  "HOSPITAL":             "#ef4444",
  "MUNICIPALIDAD":        "#f59e0b",
  "OTRO":                 "#6b7280",
};

/* ── helpers ─────────────────────────────────────────── */
function pct(a: number, b: number) {
  const tot = a + b;
  return tot === 0 ? 0 : Math.round((a / tot) * 100);
}

function scoreNombre(campo: string, datos: { campo: string; valor: string; cnt: number }[]) {
  const filas = datos.filter(d => d.campo === campo);
  const total = filas.reduce((s, d) => s + d.cnt, 0);
  if (!total) return null;
  const peso: Record<string, number> = { Excelente: 4, Bueno: 3, Regular: 2, Malo: 1 };
  const suma = filas.reduce((s, d) => s + (peso[d.valor] ?? 0) * d.cnt, 0);
  const score = suma / total; // 1–4
  if (score >= 3.5) return "Excelente";
  if (score >= 2.5) return "Bueno";
  if (score >= 1.5) return "Regular";
  return "Malo";
}

function fmtMes(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString("es-PE", { month: "short", year: "2-digit" });
}

/* ── componente ──────────────────────────────────────── */
export function EncuestasDashboard({ entidades }: { entidades: Entidad[] }) {
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [entFiltro,  setEntFiltro]  = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tipoFiltro) qs.set("tipo", tipoFiltro);
      if (entFiltro)  qs.set("entidad_id", entFiltro);
      const res = await fetch(`/api/encuestas/stats?${qs}`);
      setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, entFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  /* al cambiar tipo, resetear entidad si no pertenece a ese tipo */
  function onTipoChange(tipo: string) {
    setTipoFiltro(tipo);
    if (tipo) {
      const ent = entidades.find(e => e.id === Number(entFiltro));
      if (ent && ent.tipo !== tipo) setEntFiltro("");
    }
  }

  const entidadesFiltradas = tipoFiltro
    ? entidades.filter(e => e.tipo === tipoFiltro)
    : entidades;

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-52">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const { totales, calificaciones, booleanos, aspectos, porMes, porEntidad } = stats;
  const totalResp = totales.total_respuestas;

  /* Construir datos de calificaciones para las 4 barras apiladas */
  const califData = ["contenido", "materiales", "dinamica", "conocimiento"].map(campo => {
    const filas = calificaciones.filter(d => d.campo === campo);
    const total = filas.reduce((s, d) => s + d.cnt, 0);
    const entry: Record<string, number | string> = { campo: CAMPO_LABEL[campo] };
    for (const v of CALIF_ORDER) {
      const found = filas.find(d => d.valor === v);
      entry[v] = total > 0 ? Math.round(((found?.cnt ?? 0) / total) * 100) : 0;
    }
    return entry;
  });

  /* Booleanos */
  const boolData = ["objetivos", "duracion", "dinamicas", "recomendaria"].map(campo => {
    const row = booleanos.find(b => b.campo === campo);
    const si = row?.si_count ?? 0;
    const no = row?.no_count ?? 0;
    return { campo: CAMPO_LABEL[campo], si, no, pct: pct(si, no) };
  });

  /* Pie por tipo de entidad */
  const porTipo: Record<string, number> = {};
  for (const e of porEntidad) {
    porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + e.cnt;
  }
  const pieData = Object.entries(porTipo)
    .filter(([, v]) => v > 0)
    .map(([tipo, value]) => ({ name: tipo, value }));

  const hayDatos = totalResp > 0;

  return (
    <div className="space-y-5">

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-500">Filtrar:</span>

        <select
          value={tipoFiltro}
          onChange={e => onTipoChange(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_ENTIDAD.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={entFiltro}
          onChange={e => setEntFiltro(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 max-w-[200px]"
        >
          <option value="">Todas las entidades</option>
          {entidadesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>

        {(tipoFiltro || entFiltro) && (
          <button
            onClick={() => { setTipoFiltro(""); setEntFiltro(""); }}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={ClipboardList} label="Respuestas" value={totalResp}   color="text-blue-600"  bg="bg-blue-50"  />
        <KpiCard icon={Users}         label="Entidades"  value={totales.total_entidades} color="text-purple-600" bg="bg-purple-50" />
        <KpiCard icon={Star}          label="Links"      value={totales.total_tokens}    color="text-amber-500" bg="bg-amber-50"  />
      </div>

      {!hayDatos ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <ClipboardList className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Sin respuestas para los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {/* Fila 1: barras calificaciones + pie por tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Calificaciones — ocupa 3/5 */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Calificaciones (% por categoría)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={califData} layout="vertical" barSize={18} margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="campo" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {CALIF_ORDER.map(v => (
                    <Bar key={v} dataKey={v} stackId="a" fill={CALIF_COLORS[v]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              {/* Score resumen */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
                {["contenido", "materiales", "dinamica", "conocimiento"].map(campo => {
                  const s = scoreNombre(campo, calificaciones);
                  return (
                    <div key={campo} className="text-center">
                      <p className={`text-xs font-bold ${s ? CALIF_COLORS[s] && "text-inherit" : "text-gray-400"}`}
                         style={{ color: s ? CALIF_COLORS[s] : undefined }}>
                        {s ?? "—"}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{CAMPO_LABEL[campo]}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pie por tipo — ocupa 2/5 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-500" /> Respuestas por tipo
              </p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value" nameKey="name"
                      label={({ percent }) => percent != null ? `${(percent * 100).toFixed(0)}%` : ""}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={TIPO_COLOR[entry.name] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400 text-center py-10">Sin datos</p>
              )}
            </div>
          </div>

          {/* Fila 2: preguntas Sí/No */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-green-500" /> Preguntas Sí / No
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {boolData.map(({ campo, si, no, pct: p }) => (
                <div key={campo} className="space-y-1.5">
                  <p className="text-[11px] text-gray-500 font-medium leading-tight">{campo}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs font-bold text-green-600 shrink-0 w-8 text-right">{p}%</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5 text-green-400"/>{si}</span>
                    <span className="flex items-center gap-0.5"><ThumbsDown className="w-2.5 h-2.5 text-red-400"/>{no}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fila 3: evolución temporal + aspectos a mejorar */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Evolución por mes — 3/5 */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Respuestas por mes
              </p>
              {porMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={porMes.map(m => ({ ...m, label: fmtMes(m.mes) }))} barSize={22}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={25} />
                    <Tooltip formatter={(v) => [v, "Respuestas"]} />
                    <Bar dataKey="cnt" radius={[3, 3, 0, 0]}>
                      {porMes.map((_, i) => (
                        <Cell key={i} fill={i === porMes.length - 1 ? "#dc2626" : "#fca5a5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400 text-center py-10">Sin datos en los últimos 12 meses</p>
              )}
            </div>

            {/* Aspectos a mejorar — 2/5 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Aspectos a mejorar
              </p>
              {aspectos.length > 0 ? (
                <div className="space-y-2">
                  {aspectos.map(({ aspecto, cnt }) => {
                    const max = aspectos[0].cnt;
                    return (
                      <div key={aspecto} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[11px] text-gray-700 truncate">{aspecto}</p>
                            <span className="text-[11px] font-bold text-gray-500 shrink-0 ml-2">{cnt}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.round((cnt / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">Ningún aspecto mencionado</p>
              )}
            </div>
          </div>

          {/* Fila 4: top entidades */}
          {porEntidad.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-500" /> Respuestas por entidad
              </p>
              <div className="space-y-2">
                {porEntidad.map(({ entidad_nombre, tipo, cnt }) => {
                  const max = porEntidad[0].cnt;
                  return (
                    <div key={entidad_nombre} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-48 shrink-0 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: TIPO_COLOR[tipo] ?? "#6b7280" }}
                        />
                        <p className="text-xs text-gray-700 truncate">{entidad_nombre}</p>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: max > 0 ? `${Math.round((cnt / max) * 100)}%` : "0%",
                            background: TIPO_COLOR[tipo] ?? "#6b7280",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-6 text-right shrink-0">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

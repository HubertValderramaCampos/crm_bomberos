"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  CalendarCheck, Users, TrendingUp, ChevronDown, ChevronUp,
  LogIn, LogOut, Search, Filter, Clock, Plus, Trash2, Pencil,
  X, Save, Loader2, Settings,
} from "lucide-react";

const DIAS      = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIA_COLOR = ["bg-gray-100 text-gray-600","bg-blue-100 text-blue-700","bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700","bg-blue-100 text-blue-700","bg-green-100 text-green-700","bg-gray-100 text-gray-600"];

interface BomberoResumen {
  id: number; apellidos: string; nombres: string; grado: string; categoria: string;
  total: number; regulares: number; extras: number; con_salida: number;
}
interface DetalleRow {
  id: number; fecha: string; hora_entrada: string; hora_salida: string | null;
  tipo: string; motivo: string | null;
  apellidos: string; nombres: string; grado: string; codigo: string;
}
interface Horario { id: number; dia_semana: number; hora_inicio: string; hora_fin: string; descripcion: string | null; activo: boolean; }
interface BomberoFiltro { id: number; apellidos: string; nombres: string; categoria: string; }
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

export function ReporteFormativoClient() {
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioAnio = `${new Date().getFullYear()}-01-01`;

  const [desde,      setDesde]      = useState(inicioAnio);
  const [hasta,      setHasta]      = useState(hoy);
  const [bomberoId,  setBomberoId]  = useState("");
  const [resumen,    setResumen]    = useState<BomberoResumen[]>([]);
  const [detalle,    setDetalle]    = useState<DetalleRow[]>([]);
  const [porDia,     setPorDia]     = useState<{ dia: number; total: number }[]>([]);
  const [porTipo,    setPorTipo]    = useState<{ tipo: string; total: number }[]>([]);
  const [horarios,   setHorarios]   = useState<Horario[]>([]);
  const [bomberos,   setBomberos]   = useState<BomberoFiltro[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [busqBombero,setBusqBombero]= useState("");
  const [expandido,  setExpandido]  = useState<number | null>(null);

  // Gestión de horarios inline
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [modalHorario,    setModalHorario]    = useState(false);
  const [editandoHorario, setEditandoHorario] = useState<Horario | null>(null);
  const [guardandoH,      setGuardandoH]      = useState(false);
  const [formH, setFormH] = useState({ dia_semana: 1, hora_inicio: "08:00", hora_fin: "12:00", descripcion: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ desde, hasta });
    if (bomberoId) params.set("bombero_id", bomberoId);
    const data = await fetch(`/api/formativa/reporte?${params}`).then(r => r.json());
    setResumen(data.resumen ?? []);
    setDetalle(data.detalle ?? []);
    setPorDia(data.porDia ?? []);
    setPorTipo(data.porTipo ?? []);
    setHorarios(data.horarios ?? []);
    if (data.bomberos) setBomberos(data.bomberos);
    setLoading(false);
  }, [desde, hasta, bomberoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalAsistencias = resumen.reduce((s, b) => s + b.total, 0);
  const totalRegulares   = resumen.reduce((s, b) => s + b.regulares, 0);
  const totalExtras      = resumen.reduce((s, b) => s + b.extras, 0);

  // Datos para gráfica por día
  const chartDia = [1,2,3,4,5,6,0].map(d => ({
    dia: DIAS[d],
    asistencias: porDia.find(p => p.dia === d)?.total ?? 0,
    programado: horarios.some(h => h.dia_semana === d),
  }));

  // Datos para gráfica de barras por bombero
  const chartBomberos = resumen.slice(0, 10).map(b => ({
    nombre: b.apellidos.split(",")[0].trim().slice(0, 12),
    regulares: b.regulares,
    extras: b.extras,
  }));

  // Pie tipo
  const pieTipo = [
    { name: "Regular", value: totalRegulares, color: "#16a34a" },
    { name: "Extra",   value: totalExtras,    color: "#f59e0b" },
  ].filter(p => p.value > 0);

  const bomberosFiltrados = bomberos.filter(b =>
    !busqBombero || `${b.apellidos} ${b.nombres}`.toLowerCase().includes(busqBombero.toLowerCase())
  );

  function fmt(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  }

  function abrirCrearHorario() {
    setEditandoHorario(null);
    setFormH({ dia_semana: 1, hora_inicio: "08:00", hora_fin: "12:00", descripcion: "" });
    setModalHorario(true);
  }

  function abrirEditarHorario(h: Horario) {
    setEditandoHorario(h);
    setFormH({ dia_semana: h.dia_semana, hora_inicio: h.hora_inicio.slice(0,5), hora_fin: h.hora_fin.slice(0,5), descripcion: h.descripcion ?? "" });
    setModalHorario(true);
  }

  async function guardarHorario() {
    setGuardandoH(true);
    try {
      if (editandoHorario) {
        await fetch(`/api/formativa/horarios/${editandoHorario.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formH, activo: editandoHorario.activo }),
        });
      } else {
        await fetch("/api/formativa/horarios", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formH),
        });
      }
      setModalHorario(false);
      cargar();
    } finally { setGuardandoH(false); }
  }

  async function eliminarHorario(id: number) {
    if (!confirm("¿Eliminar este horario?")) return;
    await fetch(`/api/formativa/horarios/${id}`, { method: "DELETE" });
    cargar();
  }

  async function toggleHorarioActivo(h: Horario) {
    await fetch(`/api/formativa/horarios/${h.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, activo: !h.activo }),
    });
    cargar();
  }
  function fmtH(t: string | null) { return t ? t.slice(0,5) : "—"; }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-700" />
            Reporte de asistencias formativas
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Seguimiento de aspirantes y postulantes</p>
        </div>
      </div>

      {/* ── Panel de horarios programados ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => setMostrarHorarios(v => !v)}>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-red-700" />
            <span className="text-sm font-bold text-gray-900">Horarios programados</span>
            <span className="text-xs text-gray-400">
              ({horarios.filter(h => h.activo).length} activos · usados en análisis y gráficas)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={e => { e.stopPropagation(); abrirCrearHorario(); }}
              className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
            {mostrarHorarios ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {mostrarHorarios && (
          <div className="border-t border-gray-100 px-5 py-4">
            {horarios.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-200" />
                Sin horarios configurados. Las gráficas no distinguirán días programados de extras.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1,2,3,4,5,6,0].map(diaIdx => {
                  const hDia = horarios.filter(h => h.dia_semana === diaIdx);
                  if (hDia.length === 0) return null;
                  return (
                    <div key={diaIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIA_COLOR[diaIdx]}`}>{DIAS_FULL[diaIdx]}</span>
                      </div>
                      {hDia.map(h => (
                        <div key={h.id} className={`px-3 py-2 flex items-center gap-2 ${!h.activo ? "opacity-50" : ""}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900">{h.hora_inicio.slice(0,5)} – {h.hora_fin.slice(0,5)}</p>
                            {h.descripcion && <p className="text-[10px] text-gray-400">{h.descripcion}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => toggleHorarioActivo(h)}
                              className={`w-7 h-3.5 rounded-full transition-colors relative ${h.activo ? "bg-green-500" : "bg-gray-300"}`}>
                              <span className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${h.activo ? "translate-x-3.5" : "translate-x-0.5"}`} />
                            </button>
                            <button onClick={() => abrirEditarHorario(h)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => eliminarHorario(h.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Vista semanal compacta */}
            <div className="grid grid-cols-7 gap-1 mt-3">
              {[1,2,3,4,5,6,0].map(d => {
                const tiene = horarios.some(h => h.dia_semana === d && h.activo);
                return (
                  <div key={d} className={`rounded-lg py-1.5 text-center text-[10px] font-bold ${tiene ? "bg-red-700 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {DIAS[d]}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Aspirante / Postulante</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={busqBombero} onChange={e => setBusqBombero(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>
            {busqBombero && (
              <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto min-w-[200px]">
                {bomberosFiltrados.map(b => (
                  <button key={b.id} onClick={() => { setBomberoId(String(b.id)); setBusqBombero(`${b.apellidos.split(",")[0]}, ${b.nombres.split(" ")[0]}`); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700">
                    {b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}
                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.categoria === "ASPIRANTE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{b.categoria}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {bomberoId && (
            <button onClick={() => { setBomberoId(""); setBusqBombero(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 border border-gray-200 rounded-lg">
              <Filter className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-sm text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Efectivos",     value: resumen.length,   color: "text-gray-900"   },
              { label: "Asistencias",   value: totalAsistencias, color: "text-blue-700"   },
              { label: "Regulares",     value: totalRegulares,   color: "text-green-700"  },
              { label: "Extras",        value: totalExtras,      color: "text-amber-600"  },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Gráfica por día de semana */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Asistencias por día</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartDia}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="asistencias" radius={[4,4,0,0]}>
                    {chartDia.map((d, i) => (
                      <Cell key={i} fill={d.programado ? "#dc2626" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />Día programado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" />Día extra</span>
              </div>
            </div>

            {/* Pie regular vs extra */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Tipo de asistencia</h2>
              {pieTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieTipo} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0)*100)}%`}>
                      {pieTipo.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>}
            </div>
          </div>

          {/* Gráfica por efectivo */}
          {chartBomberos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Asistencias por efectivo (top 10)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartBomberos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={85} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regulares" name="Regular" stackId="a" fill="#16a34a" radius={[0,0,0,0]} />
                  <Bar dataKey="extras"    name="Extra"   stackId="a" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla resumen por efectivo */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Resumen por efectivo</h2>
            </div>
            {resumen.length === 0
              ? <p className="text-sm text-gray-400 text-center py-10">Sin asistencias en el período</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Efectivo", "Categoría", "Total", "Regular", "Extra", "Con salida", ""].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resumen.map(b => {
                        const detalleB = detalle.filter(d => d.apellidos === b.apellidos && d.nombres === b.nombres);
                        return (
                          <Fragment key={b.id}>
                            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandido(expandido === b.id ? null : b.id)}>
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-gray-900 text-xs">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                                <p className="text-[10px] text-gray-400">{b.grado}</p>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.categoria === "ASPIRANTE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{b.categoria}</span>
                              </td>
                              <td className="px-4 py-2.5 text-sm font-bold text-gray-900">{b.total}</td>
                              <td className="px-4 py-2.5 text-xs text-green-700 font-medium">{b.regulares}</td>
                              <td className="px-4 py-2.5 text-xs text-amber-600 font-medium">{b.extras}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">{b.con_salida}/{b.total}</td>
                              <td className="px-4 py-2.5">
                                {expandido === b.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                              </td>
                            </tr>
                            {expandido === b.id && detalleB.length > 0 && (
                              <tr key={`det-${b.id}`}>
                                <td colSpan={7} className="px-4 pb-3 pt-0 bg-gray-50">
                                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-white border-b border-gray-100">
                                          <th className="text-left px-3 py-1.5 text-gray-400 font-medium">Fecha</th>
                                          <th className="text-left px-3 py-1.5 text-gray-400 font-medium">Entrada</th>
                                          <th className="text-left px-3 py-1.5 text-gray-400 font-medium">Salida</th>
                                          <th className="text-left px-3 py-1.5 text-gray-400 font-medium">Tipo</th>
                                          <th className="text-left px-3 py-1.5 text-gray-400 font-medium">Motivo</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {detalleB.map(d => (
                                          <tr key={d.id} className="bg-white">
                                            <td className="px-3 py-2 font-medium">{fmt(d.fecha)}</td>
                                            <td className="px-3 py-2 flex items-center gap-1"><LogIn className="w-3 h-3 text-green-500" />{fmtH(d.hora_entrada)}</td>
                                            <td className="px-3 py-2"><LogOut className="w-3 h-3 text-blue-500 inline mr-1" />{fmtH(d.hora_salida)}</td>
                                            <td className="px-3 py-2">
                                              <span className={`font-bold px-1.5 py-0.5 rounded-full ${d.tipo === "regular" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.tipo}</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500">{d.motivo ?? "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </>
      )}
      {/* Modal horario */}
      {modalHorario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">{editandoHorario ? "Editar horario" : "Nuevo horario"}</h2>
              <button onClick={() => setModalHorario(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Día de la semana</label>
                <select value={formH.dia_semana} onChange={e => setFormH(f => ({ ...f, dia_semana: Number(e.target.value) }))} className={inputCls}>
                  {DIAS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
                  <input type="time" value={formH.hora_inicio} onChange={e => setFormH(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
                  <input type="time" value={formH.hora_fin} onChange={e => setFormH(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción (opcional)</label>
                <input type="text" value={formH.descripcion} onChange={e => setFormH(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Instrucción teórica" className={inputCls} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModalHorario(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={guardarHorario} disabled={guardandoH}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                {guardandoH ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

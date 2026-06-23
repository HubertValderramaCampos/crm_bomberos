"use client";
import { ROLES_JEFE } from "@/lib/roles";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList, Plus, Trash2, X, Loader2, Search,
  CheckCircle2, Clock, Eye, AlertCircle, Users, BarChart2,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

interface EvalRow {
  id: number; completada: boolean; fecha_asignacion: string;
  numero_parte: string; emerg_tipo: string; emerg_fecha: string;
  evaluador_nombre: string;
  total_evaluados: number; evaluados_completos: number;
  pct_promedio: number | null;
}
interface Parte { id: number; numero_parte: string; tipo: string; created_at: string; }
interface EfectivoModal {
  bombero_id: number; apellidos: string; nombres: string; grado: string; codigo: string;
}
interface StatsRow { vehiculo: string | null; clasificacion: string; total: number; }

const CLASIF_COLORS: Record<string, string> = {
  "Excelente":   "#16a34a",
  "Bueno":       "#2563eb",
  "Regular":     "#d97706",
  "Deficiente":  "#dc2626",
};

export default function AphPage() {
  const { data: session } = useSession();
  const esJefe = ROLES_JEFE.includes(session?.user?.rol ?? "");

  const [evaluaciones, setEvaluaciones] = useState<EvalRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);

  // Modal crear
  const [partes,         setPartes]         = useState<Parte[]>([]);
  const [bomberosTodos,  setBomberosTodos]  = useState<EfectivoModal[]>([]);
  const [parteId,        setParteId]        = useState("");
  const [parteSelec,     setParteSelec]     = useState<Parte | null>(null);
  const [busqParte,      setBusqParte]      = useState("");
  const [evaluadorId,    setEvaluadorId]    = useState("");
  const [busqEvaluador,  setBusqEvaluador]  = useState("");
  const [mostrarEval,    setMostrarEval]    = useState(false);
  const [evaluadorSel,   setEvaluadorSel]   = useState<EfectivoModal | null>(null);
  const [generando,      setGenerando]      = useState(false);
  const [error,          setError]          = useState("");

  // Gráfica
  const hoy = new Date();
  const [grafAnio, setGrafAnio] = useState(hoy.getFullYear());
  const [grafMes,  setGrafMes]  = useState(hoy.getMonth() + 1);
  const [stats,    setStats]    = useState<StatsRow[]>([]);
  const [loadStats,setLoadStats]= useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/aph").then(r => r.json());
    setEvaluaciones(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Cargar stats cuando cambia mes/año (solo jefe)
  useEffect(() => {
    if (!esJefe) return;
    setLoadStats(true);
    fetch(`/api/aph/stats?anio=${grafAnio}&mes=${grafMes}`)
      .then(r => r.json())
      .then(d => { setStats(Array.isArray(d) ? d : []); })
      .finally(() => setLoadStats(false));
  }, [esJefe, grafAnio, grafMes]);

  async function abrirModal() {
    setModal(true); setError("");
    setParteId(""); setParteSelec(null); setBusqParte("");
    setEvaluadorId(""); setBusqEvaluador(""); setEvaluadorSel(null); setMostrarEval(false);
    const [pRes, bRes] = await Promise.all([
      fetch("/api/operaciones/partes-recientes").then(r => r.json()).catch(() => []),
      fetch("/api/aph/efectivos-parte").then(r => r.json()).catch(() => []),
    ]);
    setPartes(Array.isArray(pRes) ? pRes : []);
    setBomberosTodos(Array.isArray(bRes) ? bRes : []);
  }

  function seleccionarParte(p: Parte) {
    setParteSelec(p); setParteId(String(p.id)); setBusqParte("");
  }

  async function crear() {
    if (!parteId || !evaluadorId) { setError("Selecciona el parte y el evaluador"); return; }
    setGenerando(true); setError("");
    const res = await fetch("/api/aph", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergencia_id: Number(parteId), evaluador_id: Number(evaluadorId) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al crear"); setGenerando(false); return; }
    setModal(false); setGenerando(false);
    cargar();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta evaluación? Se perderán todos los datos.")) return;
    await fetch(`/api/aph/${id}`, { method: "DELETE" });
    cargar();
  }

  function fmt(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  }

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Transformar stats para recharts: [{vehiculo, Excelente: n, Bueno: n, ...}]
  const chartData = (() => {
    const map: Record<string, Record<string, number>> = {};
    for (const r of stats) {
      const veh = r.vehiculo ?? "Sin vehículo";
      if (!map[veh]) map[veh] = {};
      map[veh][r.clasificacion] = r.total;
    }
    return Object.entries(map).map(([vehiculo, vals]) => ({ vehiculo, ...vals }));
  })();
  const clasificaciones = [...new Set(stats.map(r => r.clasificacion))];

  const partesFiltrados = partes.filter(p =>
    p.numero_parte.toLowerCase().includes(busqParte.toLowerCase()) ||
    p.tipo.toLowerCase().includes(busqParte.toLowerCase())
  );

  const pendientes  = evaluaciones.filter(e => !e.completada).length;
  const completadas = evaluaciones.filter(e => e.completada).length;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-700" />
            Evaluaciones de Emergencias
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">APH · Máquina · Ambulancia</p>
        </div>
        {esJefe && (
          <button onClick={abrirModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors">
            <Plus className="w-4 h-4" /> Nueva evaluación
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",       value: evaluaciones.length, color: "text-gray-900"  },
          { label: "Pendientes",  value: pendientes,           color: "text-amber-600" },
          { label: "Completadas", value: completadas,           color: "text-green-700" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfica mensual por vehículo (solo jefe) */}
      {esJefe && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Resultados por vehículo</h2>
            </div>
            <div className="flex items-center gap-2">
              <select value={grafMes} onChange={e => setGrafMes(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={grafAnio} onChange={e => setGrafAnio(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="px-4 py-4">
            {loadStats ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
            ) : chartData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Sin evaluaciones completadas en {MESES[grafMes-1]} {grafAnio}.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="vehiculo" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {clasificaciones.map(cl => (
                    <Bar key={cl} dataKey={cl} stackId="a" fill={CLASIF_COLORS[cl] ?? "#6b7280"} radius={cl === clasificaciones[clasificaciones.length-1] ? [4,4,0,0] : [0,0,0,0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={CLASIF_COLORS[cl] ?? "#6b7280"} />)}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : evaluaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay evaluaciones registradas.</p>
          {esJefe && <p className="text-xs text-gray-400 mt-1">Crea una nueva evaluación asignando un evaluador a un parte.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {evaluaciones.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ev.completada ? "bg-green-100" : "bg-amber-100"}`}>
                  {ev.completada ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-gray-500">{ev.numero_parte}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{ev.emerg_tipo}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{fmt(ev.emerg_fecha)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Evaluador: <span className="font-semibold text-gray-800">{ev.evaluador_nombre}</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ev.total_evaluados} evaluado{ev.total_evaluados !== 1 ? "s" : ""}</span>
                      {ev.total_evaluados > 0 && (
                        <span className={`font-medium ${ev.evaluados_completos === ev.total_evaluados ? "text-green-600" : "text-amber-600"}`}>
                          ({ev.evaluados_completos}/{ev.total_evaluados} con clasificación)
                        </span>
                      )}
                    </div>
                    {ev.pct_promedio !== null && ev.pct_promedio > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        ev.pct_promedio >= 80 ? "bg-green-100 text-green-700" :
                        ev.pct_promedio >= 60 ? "bg-blue-100 text-blue-700" :
                        ev.pct_promedio >= 40 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {ev.pct_promedio}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/operaciones/aph/${ev.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={ev.completada ? "Ver evaluación" : "Completar evaluación"}>
                    {ev.completada ? <Eye className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </Link>
                  {esJefe && (
                    <button onClick={() => eliminar(ev.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva evaluación */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Nueva evaluación</h2>
                <p className="text-xs text-white/70 mt-0.5">Solo efectivos que salieron al parte</p>
              </div>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

              {/* Paso 1: buscar y seleccionar parte */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Parte de emergencia *</label>
                {parteSelec ? (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-red-800">{parteSelec.numero_parte}</p>
                      <p className="text-xs text-red-600">{parteSelec.tipo} · {new Date(parteSelec.created_at).toLocaleDateString("es-PE")}</p>
                    </div>
                    <button onClick={() => { setParteSelec(null); setParteId(""); setEvaluadorId(""); setEfectivosModal([]); }}
                      className="text-red-400 hover:text-red-700 ml-2"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input value={busqParte} onChange={e => setBusqParte(e.target.value)}
                        placeholder="Buscar por número o tipo..."
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                    </div>
                    {busqParte.length > 0 && (
                      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
                        {partesFiltrados.length === 0
                          ? <p className="px-4 py-4 text-xs text-gray-400 text-center">Sin resultados</p>
                          : partesFiltrados.slice(0, 20).map(p => (
                            <button key={p.id} onClick={() => seleccionarParte(p)}
                              className="w-full text-left px-3 py-2.5 hover:bg-red-50 transition-colors">
                              <p className="text-sm font-bold text-gray-900">{p.numero_parte}</p>
                              <p className="text-xs text-gray-400">{p.tipo} · {new Date(p.created_at).toLocaleDateString("es-PE")}</p>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Paso 2: seleccionar evaluador */}
              {parteSelec && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Evaluador asignado *
                  </label>
                  {evaluadorSel ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-blue-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {evaluadorSel.apellidos}, {evaluadorSel.nombres.split(" ")[0]}
                        </p>
                        <p className="text-xs text-gray-500">{evaluadorSel.grado}</p>
                      </div>
                      <button type="button" onClick={() => { setEvaluadorSel(null); setEvaluadorId(""); setBusqEvaluador(""); }}
                        className="text-gray-400 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={busqEvaluador}
                        onChange={e => { setBusqEvaluador(e.target.value); setMostrarEval(true); }}
                        onFocus={() => setMostrarEval(true)}
                        onBlur={() => setTimeout(() => setMostrarEval(false), 150)}
                        placeholder="Buscar evaluador por apellido..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                      {mostrarEval && busqEvaluador.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                          {bomberosTodos
                            .filter(b => `${b.apellidos} ${b.nombres} ${b.codigo ?? ""}`.toLowerCase().includes(busqEvaluador.toLowerCase()))
                            .slice(0, 10)
                            .map(b => (
                              <div key={b.bombero_id}
                                onMouseDown={() => { setEvaluadorSel(b); setEvaluadorId(String(b.bombero_id)); setBusqEvaluador(""); setMostrarEval(false); }}
                                className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{b.apellidos}, {b.nombres.split(" ")[0]}</p>
                                  <p className="text-xs text-gray-400">{b.grado}</p>
                                </div>
                              </div>
                            ))}
                          {bomberosTodos.filter(b => `${b.apellidos} ${b.nombres}`.toLowerCase().includes(busqEvaluador.toLowerCase())).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    El evaluador podrá registrar quiénes fueron al parte y completar las evaluaciones.
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={crear} disabled={generando || !parteId || !evaluadorId}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {generando ? "Creando..." : "Crear evaluación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

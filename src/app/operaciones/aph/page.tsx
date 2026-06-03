"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList, Plus, Trash2, X, Loader2, Search,
  CheckCircle2, Clock, Eye, AlertCircle, Users,
} from "lucide-react";
import Link from "next/link";

interface EvalRow {
  id: number; completada: boolean; fecha_asignacion: string;
  numero_parte: string; emerg_tipo: string; emerg_fecha: string;
  evaluador_nombre: string;
  total_evaluados: number; evaluados_completos: number;
}
interface Parte { id: number; numero_parte: string; tipo: string; created_at: string; }
interface Bombero { id: number; apellidos: string; nombres: string; grado: string; }

export default function AphPage() {
  const { data: session } = useSession();
  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session?.user?.rol ?? "");

  const [evaluaciones, setEvaluaciones] = useState<EvalRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);

  const [partes,      setPartes]      = useState<Parte[]>([]);
  const [bomberos,    setBomberos]    = useState<Bombero[]>([]);
  const [parteId,     setParteId]     = useState("");
  const [busqParte,   setBusqParte]   = useState("");
  const [evaluadorId, setEvaluadorId] = useState("");
  const [generando,   setGenerando]   = useState(false);
  const [error,       setError]       = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/aph").then(r => r.json());
    setEvaluaciones(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function abrirModal() {
    setModal(true); setError("");
    setParteId(""); setBusqParte(""); setEvaluadorId("");
    const [pRes, bRes] = await Promise.all([
      fetch("/api/operaciones/partes-recientes").then(r => r.json()).catch(() => []),
      fetch("/api/bomberos").then(r => r.json()),
    ]);
    setPartes(Array.isArray(pRes) ? pRes : []);
    setBomberos(Array.isArray(bRes) ? bRes : []);
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
          <p className="text-sm text-gray-400 mt-0.5">APH, Rescate, Incendios y más</p>
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
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{ev.total_evaluados} evaluado{ev.total_evaluados !== 1 ? "s" : ""}</span>
                    {ev.total_evaluados > 0 && (
                      <span className={`ml-1 font-medium ${ev.evaluados_completos === ev.total_evaluados ? "text-green-600" : "text-amber-600"}`}>
                        ({ev.evaluados_completos}/{ev.total_evaluados} con clasificación)
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Nueva evaluación</h2>
                <p className="text-xs text-white/70 mt-0.5">El evaluador asignará los evaluados en el formulario</p>
              </div>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Parte de emergencia *</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={busqParte} onChange={e => setBusqParte(e.target.value)}
                    placeholder="Buscar por número o tipo..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                </div>
                <select value={parteId} onChange={e => setParteId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                  <option value="">Seleccionar parte...</option>
                  {partesFiltrados.slice(0, 30).map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.numero_parte} — {p.tipo} ({new Date(p.created_at).toLocaleDateString("es-PE")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Evaluador asignado *</label>
                <select value={evaluadorId} onChange={e => setEvaluadorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                  <option value="">Seleccionar evaluador...</option>
                  {bomberos.map(b => (
                    <option key={b.id} value={String(b.id)}>
                      {b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]} — {b.grado}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">El evaluador elegirá a los efectivos a evaluar dentro del formulario.</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={crear} disabled={generando}
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

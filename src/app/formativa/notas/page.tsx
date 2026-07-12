"use client";
import { ROLES_JEFE } from "@/lib/roles";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen, Plus, X, Loader2, Save, Trash2,
  Star, ChevronDown, ChevronUp, Search,
} from "lucide-react";

interface Bombero { id: number; apellidos: string; nombres: string; categoria: string; }
interface Nota {
  id: number; titulo: string; contenido: string | null;
  calificacion: number | null; fecha: string; creado_por_codigo: string | null;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

// Fecha local YYYY-MM-DD — toISOString() da la fecha en UTC (5h adelantada a Perú)
function fechaLocalHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NotasFormativasPage() {
  const { data: session } = useSession();
  const esAdmin = ROLES_JEFE.includes(session?.user?.rol ?? "");

  const [bomberos,     setBomberos]     = useState<Bombero[]>([]);
  const [bomberoSel,   setBomberoSel]   = useState<Bombero | null>(null);
  const [notas,        setNotas]        = useState<Nota[]>([]);
  const [cargando,     setCargando]     = useState(false);
  const [modal,        setModal]        = useState(false);
  const [editando,     setEditando]     = useState<Nota | null>(null);
  const [notaAbierta,  setNotaAbierta]  = useState<number | null>(null);
  const [busq,         setBusq]         = useState("");

  const [form, setForm] = useState({ titulo: "", contenido: "", calificacion: "", fecha: fechaLocalHoy() });
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/bomberos/formativo")
      .then(r => r.json())
      .then(d => setBomberos(Array.isArray(d) ? d : []));
  }, []);

  const cargarNotas = useCallback(async (id: number) => {
    setCargando(true);
    const data = await fetch(`/api/formativa/notas?bombero_id=${id}`).then(r => r.json());
    setNotas(Array.isArray(data) ? data : []);
    setCargando(false);
  }, []);

  function seleccionar(b: Bombero) {
    setBomberoSel(b);
    cargarNotas(b.id);
    setNotaAbierta(null);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ titulo: "", contenido: "", calificacion: "", fecha: fechaLocalHoy() });
    setError("");
    setModal(true);
  }

  function abrirEditar(nota: Nota) {
    setEditando(nota);
    setForm({ titulo: nota.titulo, contenido: nota.contenido ?? "", calificacion: nota.calificacion?.toString() ?? "", fecha: nota.fecha });
    setError("");
    setModal(true);
  }

  async function guardar() {
    if (!bomberoSel || !form.titulo.trim()) { setError("Título obligatorio"); return; }
    setGuardando(true); setError("");
    try {
      const body = {
        bombero_id: bomberoSel.id,
        titulo: form.titulo.trim(),
        contenido: form.contenido || null,
        calificacion: form.calificacion ? Number(form.calificacion) : null,
        fecha: form.fecha,
      };
      if (editando) {
        await fetch(`/api/formativa/notas/${editando.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/formativa/notas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      setModal(false);
      cargarNotas(bomberoSel.id);
    } finally { setGuardando(false); }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta nota?")) return;
    await fetch(`/api/formativa/notas/${id}`, { method: "DELETE" });
    if (bomberoSel) cargarNotas(bomberoSel.id);
  }

  const bomberosFiltrados = bomberos.filter(b =>
    `${b.apellidos} ${b.nombres}`.toLowerCase().includes(busq.toLowerCase())
  );

  if (!esAdmin) return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">Sin permiso</div>
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-red-700" />
        <h1 className="text-xl font-bold text-gray-900">Notas de lecciones</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel izquierdo: lista de aspirantes/postulantes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Aspirantes / Postulantes</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={busq} onChange={e => setBusq(e.target.value)} placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {bomberosFiltrados.length === 0
              ? <p className="px-4 py-8 text-xs text-gray-400 text-center">Sin resultados</p>
              : bomberosFiltrados.map(b => (
                <button key={b.id} onClick={() => seleccionar(b)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${bomberoSel?.id === b.id ? "bg-red-50 border-l-2 border-red-600" : ""}`}>
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.categoria === "ASPIRANTE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {b.categoria}
                  </span>
                </button>
              ))
            }
          </div>
        </div>

        {/* Panel derecho: notas del seleccionado */}
        <div className="lg:col-span-2 space-y-3">
          {!bomberoSel ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
              <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Selecciona un aspirante o postulante para ver sus notas.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{bomberoSel.apellidos.split(",")[0]}, {bomberoSel.nombres.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400">{notas.length} nota{notas.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={abrirCrear}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors">
                  <Plus className="w-4 h-4" /> Nueva nota
                </button>
              </div>

              {cargando ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : notas.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
                  <p className="text-sm text-gray-400">Sin notas para este efectivo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notas.map(nota => (
                    <div key={nota.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button onClick={() => setNotaAbierta(notaAbierta === nota.id ? null : nota.id)} className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{nota.titulo}</p>
                            {nota.calificacion != null && (
                              <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                                nota.calificacion >= 14 ? "bg-green-100 text-green-700" :
                                nota.calificacion >= 11 ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                <Star className="w-3 h-3" />{nota.calificacion}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(nota.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => abrirEditar(nota)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => eliminar(nota.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setNotaAbierta(notaAbierta === nota.id ? null : nota.id)} className="p-1.5 text-gray-400 rounded-md">
                            {notaAbierta === nota.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {notaAbierta === nota.id && nota.contenido && (
                        <div className="px-4 pb-4 border-t border-gray-50">
                          <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{nota.contenido}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal crear/editar nota */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">{editando ? "Editar nota" : "Nueva nota"}</h2>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Título / Lección *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Primeros auxilios — Sesión 1" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Calificación (0–20)</label>
                  <input type="number" min="0" max="20" step="0.5" value={form.calificacion}
                    onChange={e => setForm(f => ({ ...f, calificacion: e.target.value }))}
                    placeholder="—" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contenido / Observaciones</label>
                <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={4} placeholder="Resumen de la lección, observaciones del desempeño..."
                  className={inputCls + " resize-none"} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">
                  {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

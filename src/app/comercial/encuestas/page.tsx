"use client";
import { ROLES_JEFE } from "@/lib/roles";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList, Plus, Copy, Check, Trash2, Loader2,
  ChevronDown, ChevronUp, ExternalLink,
  ThumbsUp, ThumbsDown, Star, Search, X,
  BarChart2, Link2, Calendar, Building2, PlusCircle,
  CheckCircle2, History,
} from "lucide-react";
import { EncuestasDashboard } from "@/components/ui-custom/EncuestasDashboard";

interface Entidad { id: number; nombre: string; tipo: string; }
interface Capacitacion {
  id: number; fecha: string; descripcion: string | null; tipo: string;
  entidad_id: number | null; entidad_nombre: string | null; lugar: string | null;
  tiene_encuesta?: boolean;
}
interface TokenRow {
  id: number; token: string; activo: boolean; created_at: string;
  entidad_id: number; entidad_nombre: string;
  descripcion: string | null; actividad_id: number | null;
  actividad_fecha: string | null; actividad_desc: string | null;
  total_respuestas: number; ultima_respuesta: string | null;
}
interface Respuesta {
  id: number; created_at: string;
  empresa_nombre: string | null; horario: string | null; fecha_capacitacion: string | null;
  objetivos_alcanzados: boolean | null; duracion_adecuada: boolean | null; dinamicas_correctas: boolean | null;
  aspectos_mejora: string[] | null;
  contenido_calif: string | null; materiales_calif: string | null;
  dinamica_expositores: string | null; conocimiento_expositores: string | null;
  recomendaria: boolean | null; comentarios: string | null;
}

function BoolBadge({ v }: { v: boolean | null }) {
  if (v === null) return <span className="text-gray-400 text-xs">—</span>;
  return v
    ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><ThumbsUp className="w-3 h-3" />Sí</span>
    : <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><ThumbsDown className="w-3 h-3" />No</span>;
}

const CALIF_COLOR: Record<string, string> = {
  "Excelente": "text-green-600 font-semibold",
  "Bueno":     "text-blue-600 font-semibold",
  "Regular":   "text-amber-600 font-semibold",
  "Malo":      "text-red-600 font-semibold",
};

function RespuestaDetalle({ r }: { r: Respuesta }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div><span className="text-xs text-gray-400">Empresa</span><p className="font-medium">{r.empresa_nombre ?? "—"}</p></div>
        <div><span className="text-xs text-gray-400">Horario</span><p>{r.horario ?? "—"}</p></div>
        <div><span className="text-xs text-gray-400">Fecha capacitación</span><p>{r.fecha_capacitacion ? new Date(r.fecha_capacitacion).toLocaleDateString("es-PE") : "—"}</p></div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">
        <div><p className="text-xs text-gray-400 mb-0.5">Objetivos</p><BoolBadge v={r.objetivos_alcanzados} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Duración</p><BoolBadge v={r.duracion_adecuada} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Dinámicas</p><BoolBadge v={r.dinamicas_correctas} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-gray-200 pt-3">
        {[["Contenido", r.contenido_calif], ["Materiales", r.materiales_calif], ["Dinámica", r.dinamica_expositores], ["Conocimiento", r.conocimiento_expositores]].map(([label, val]) => (
          <div key={label as string}><p className="text-xs text-gray-400 mb-0.5">{label}</p><span className={`text-xs ${CALIF_COLOR[val as string] ?? "text-gray-700"}`}>{val ?? "—"}</span></div>
        ))}
      </div>
      {r.aspectos_mejora && r.aspectos_mejora.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-400 mb-1">Aspectos a mejorar</p>
          <div className="flex flex-wrap gap-1.5">
            {r.aspectos_mejora.map(a => <span key={a} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{a}</span>)}
          </div>
        </div>
      )}
      <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
        <div><p className="text-xs text-gray-400 mb-0.5">¿Recomendaría?</p><BoolBadge v={r.recomendaria} /></div>
        <p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleString("es-PE")}</p>
      </div>
      {r.comentarios && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-400 mb-1">Comentarios</p>
          <p className="text-sm text-gray-700 italic">"{r.comentarios}"</p>
        </div>
      )}
    </div>
  );
}

function TokenCard({ tk, baseUrl, puedeEditar, onDesactivar, onEliminar, modoHistorial = false }: {
  tk: TokenRow; baseUrl: string; puedeEditar: boolean; modoHistorial?: boolean;
  onDesactivar: (id: number) => void; onEliminar: (id: number) => void;
}) {
  const [copiado,      setCopiado]      = useState(false);
  const [abierto,      setAbierto]      = useState(false);
  const [respuestas,   setRespuestas]   = useState<Respuesta[] | null>(null);
  const [cargando,     setCargando]     = useState(false);
  const [finalizando,  setFinalizando]  = useState(false);
  const [eliminando,   setEliminando]   = useState(false);
  const [confirmFin,   setConfirmFin]   = useState(false);

  const url = `${baseUrl}/encuesta/${tk.token}`;

  function copiar() {
    navigator.clipboard.writeText(url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  }

  async function toggleRespuestas() {
    if (abierto) { setAbierto(false); return; }
    setAbierto(true);
    if (respuestas !== null) return;
    setCargando(true);
    try { setRespuestas(await fetch(`/api/encuestas/${tk.id}`).then(r => r.json())); }
    finally { setCargando(false); }
  }

  async function finalizar() {
    setFinalizando(true);
    try { await fetch(`/api/encuestas/${tk.id}`, { method: "DELETE" }); onDesactivar(tk.id); }
    finally { setFinalizando(false); setConfirmFin(false); }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar permanentemente? Se borrarán sus respuestas.")) return;
    setEliminando(true);
    try { await fetch(`/api/encuestas/${tk.id}?eliminar=1`, { method: "DELETE" }); onEliminar(tk.id); }
    finally { setEliminando(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* URL + acciones */}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 truncate">{url}</code>
        <button onClick={copiar} className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Copiar enlace">
          {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Abrir encuesta">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        {puedeEditar && modoHistorial && !eliminando && (
          <button onClick={eliminar} className="shrink-0 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar permanentemente">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Botón finalizar encuesta */}
      {puedeEditar && !modoHistorial && (
        confirmFin ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-700 flex-1">¿Cerrar esta encuesta? Ya no recibirá respuestas.</p>
            <button onClick={() => setConfirmFin(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded">No</button>
            <button onClick={finalizar} disabled={finalizando}
              className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50">
              {finalizando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Finalizar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmFin(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs font-medium text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 rounded-lg transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar encuesta
          </button>
        )
      )}

      <button onClick={toggleRespuestas}
        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-800 transition-colors border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <strong className="text-gray-800">{tk.total_respuestas}</strong> respuesta{tk.total_respuestas !== 1 ? "s" : ""}
          {tk.ultima_respuesta && <span className="text-gray-400">· última: {new Date(tk.ultima_respuesta).toLocaleDateString("es-PE")}</span>}
        </span>
        {abierto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {abierto && (
        <div className="space-y-3 pt-1">
          {cargando && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>}
          {!cargando && respuestas?.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Aún no hay respuestas.</p>}
          {!cargando && respuestas?.map(r => <RespuestaDetalle key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

/* ── Modal nuevo enlace ─────────────────────────────────────────── */
function ModalNuevoEnlace({ entidades, onClose, onCreado }: {
  entidades: Entidad[];
  onClose: () => void;
  onCreado: () => void;
}) {
  // Paso 1: seleccionar/crear evento | Paso 2: confirmar y generar
  const [paso, setPaso] = useState<1 | 2>(1);

  // Búsqueda de capacitación
  const [busqCap,  setBusqCap]  = useState("");
  const [caps,     setCaps]     = useState<Capacitacion[]>([]);
  const [capSel,   setCapSel]   = useState<Capacitacion | null>(null);
  const [showCaps, setShowCaps] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Crear nueva capacitación inline
  const [creandoCap,  setCreandoCap]  = useState(false);
  const [nuevaCap,    setNuevaCap]    = useState({ descripcion: "", fecha: new Date().toISOString().slice(0, 10), lugar: "" });
  const [entidadIdNueva, setEntidadIdNueva] = useState<string>("");
  const [busqEntNueva,   setBusqEntNueva]   = useState("");
  const [showDropNueva,  setShowDropNueva]  = useState(false);
  const [guardandoCap,   setGuardandoCap]   = useState(false);

  // Generación
  const [generando,  setGenerando]  = useState(false);
  const [error,      setError]      = useState("");

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

  useEffect(() => {
    buscarCaps("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscarCaps(q: string) {
    setCargando(true);
    try {
      const data = await fetch(`/api/capacitaciones?q=${encodeURIComponent(q)}`).then(r => r.json());
      setCaps(Array.isArray(data) ? data : []);
    } finally { setCargando(false); }
  }

  function seleccionarCap(cap: Capacitacion) {
    setCapSel(cap);
    setBusqCap(cap.descripcion ?? cap.tipo);
    setShowCaps(false);
    setCreandoCap(false);
  }

  async function crearCapacitacion() {
    if (!nuevaCap.descripcion || !nuevaCap.fecha) return;
    setGuardandoCap(true);
    try {
      const res = await fetch("/api/capacitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevaCap, entidad_id: entidadIdNueva ? Number(entidadIdNueva) : null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al crear evento"); return; }

      // Recargar lista y seleccionar el nuevo
      await buscarCaps("");
      setCapSel({ id: data.id, fecha: nuevaCap.fecha, descripcion: nuevaCap.descripcion, tipo: "Capacitación externa", entidad_id: entidadIdNueva ? Number(entidadIdNueva) : null, entidad_nombre: data.entidad_nombre, lugar: nuevaCap.lugar || null });
      setBusqCap(nuevaCap.descripcion);
      setCreandoCap(false);
      setNuevaCap({ descripcion: "", fecha: new Date().toISOString().slice(0, 10), lugar: "" });
    } finally { setGuardandoCap(false); }
  }

  async function generarEnlaces() {
    if (!capSel) return;
    if (!capSel.entidad_id) { setError("La capacitación debe tener una entidad vinculada."); return; }
    setGenerando(true); setError("");
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entidad_id: capSel.entidad_id,
          actividad_id: capSel.id,
          descripcion: capSel.descripcion,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al generar"); return; }
      onCreado();
      onClose();
    } finally { setGenerando(false); }
  }

  const entsFiltradas = entidades.filter(e => e.nombre.toLowerCase().includes(busqEntNueva.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            <h2 className="text-base font-bold">Generar enlace de encuesta</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

          {/* Buscar capacitación */}
          {!creandoCap ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Evento de capacitación *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={busqCap}
                  onChange={e => { setBusqCap(e.target.value); setCapSel(null); setShowCaps(true); buscarCaps(e.target.value); }}
                  onFocus={() => setShowCaps(true)}
                  onBlur={() => setTimeout(() => setShowCaps(false), 150)}
                  placeholder="Buscar capacitación..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>

              {showCaps && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-1 shadow-lg max-h-52 overflow-y-auto bg-white">
                  {cargando && <p className="px-3 py-2 text-xs text-gray-400">Buscando...</p>}
                  {!cargando && caps.length === 0 && <p className="px-3 py-3 text-xs text-gray-400 text-center">No se encontraron capacitaciones</p>}
                  {caps.map(c => (
                    <button key={c.id} type="button" onMouseDown={() => seleccionarCap(c)}
                      disabled={c.tiene_encuesta}
                      className="w-full text-left px-3 py-2.5 border-b border-gray-50 last:border-0 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.descripcion ?? c.tipo}</p>
                        {c.tiene_encuesta && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">Ya tiene encuesta</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.fecha + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        {c.entidad_nombre && <><Building2 className="w-3 h-3 ml-1" />{c.entidad_nombre}</>}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => { setCreandoCap(true); setCapSel(null); setBusqCap(""); }}
                className="mt-2 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Crear nuevo evento de capacitación
              </button>
            </div>
          ) : (
            /* Formulario crear capacitación inline */
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-800">Nuevo evento de capacitación</p>
                <button onClick={() => setCreandoCap(false)} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción *</label>
                <input type="text" value={nuevaCap.descripcion}
                  onChange={e => setNuevaCap(n => ({ ...n, descripcion: e.target.value }))}
                  placeholder="Ej: Primeros auxilios básicos" className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={nuevaCap.fecha}
                    onChange={e => setNuevaCap(n => ({ ...n, fecha: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lugar</label>
                  <input type="text" value={nuevaCap.lugar}
                    onChange={e => setNuevaCap(n => ({ ...n, lugar: e.target.value }))}
                    placeholder="Cuartel B-150" className={inputCls} />
                </div>
              </div>

              {/* Entidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Empresa / Institución *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={busqEntNueva}
                    onChange={e => { setBusqEntNueva(e.target.value); setEntidadIdNueva(""); setShowDropNueva(true); }}
                    onFocus={() => setShowDropNueva(true)}
                    onBlur={() => setTimeout(() => setShowDropNueva(false), 150)}
                    placeholder="Buscar entidad..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
                </div>
                {showDropNueva && entsFiltradas.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {entsFiltradas.slice(0, 6).map(e => (
                      <li key={e.id}>
                        <button type="button" onMouseDown={() => { setEntidadIdNueva(String(e.id)); setBusqEntNueva(e.nombre); setShowDropNueva(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 transition-colors">
                          {e.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setCreandoCap(false)}
                  className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="button" onClick={crearCapacitacion} disabled={guardandoCap || !nuevaCap.descripcion || !nuevaCap.fecha || !entidadIdNueva}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5">
                  {guardandoCap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Crear y seleccionar
                </button>
              </div>
            </div>
          )}

          {/* Preview del evento seleccionado */}
          {capSel && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Evento seleccionado</p>
              <p className="text-sm font-bold text-gray-900">{capSel.descripcion ?? capSel.tipo}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(capSel.fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </span>
                {capSel.entidad_nombre && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />{capSel.entidad_nombre}
                  </span>
                )}
              </div>
              {!capSel.entidad_id && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Esta capacitación no tiene entidad vinculada. Edítala en Programación o crea un nuevo evento con entidad.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={generarEnlaces}
            disabled={!capSel || !capSel.entidad_id || generando}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
          >
            {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generar enlace
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Grupo de encuestas por evento ─────────────────────────────── */
function GrupoEncuesta({ grupo, baseUrl, puedeEditar, onDesactivar, onEliminar, modoHistorial }: {
  grupo: { key: string; fecha: string | null; desc: string; entidad: string; tokens: TokenRow[] };
  baseUrl: string; puedeEditar: boolean; modoHistorial: boolean;
  onDesactivar: (id: number) => void; onEliminar: (id: number) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-3 px-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${modoHistorial ? "bg-gray-100" : "bg-red-50"}`}>
          <Calendar className={`w-4 h-4 ${modoHistorial ? "text-gray-400" : "text-red-600"}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{grupo.desc}</p>
          {grupo.fecha && (
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(grupo.fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
          <p className="text-xs text-gray-400">{grupo.entidad}</p>
        </div>
      </div>
      <div className="space-y-2 pl-11">
        {grupo.tokens.map(tk => (
          <TokenCard key={tk.id} tk={tk} baseUrl={baseUrl} puedeEditar={puedeEditar}
            onDesactivar={onDesactivar} onEliminar={onEliminar} modoHistorial={modoHistorial} />
        ))}
      </div>
    </div>
  );
}

/* ── Página principal ───────────────────────────────────────────── */
export default function EncuestasPage() {
  const { data: session } = useSession();
  const puedeEditar = ROLES_JEFE.includes(session?.user?.rol ?? "");

  const [tab,       setTab]       = useState<"dashboard" | "enlaces">("dashboard");
  const [tokens,    setTokens]    = useState<TokenRow[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [baseUrl,   setBaseUrl]   = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [tkRes, entRes] = await Promise.all([
        fetch("/api/encuestas").then(r => r.json()),
        fetch("/api/entidades").then(r => r.json()),
      ]);
      setTokens(Array.isArray(tkRes) ? tkRes : []);
      setEntidades(Array.isArray(entRes) ? entRes : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { setBaseUrl(window.location.origin); cargar(); }, [cargar]);

  const [verHistorial, setVerHistorial] = useState(false);

  function desactivarLocal(id: number) { setTokens(prev => prev.map(t => t.id === id ? { ...t, activo: false } : t)); }
  function eliminarLocal(id: number)   { setTokens(prev => prev.filter(t => t.id !== id)); }

  function agrupar(lista: TokenRow[]) {
    return lista.reduce<Record<string, { key: string; fecha: string | null; desc: string; entidad: string; tokens: TokenRow[] }>>((acc, tk) => {
      const key = tk.actividad_id ? `act-${tk.actividad_id}` : `sin-${tk.entidad_id}-${tk.descripcion}`;
      if (!acc[key]) acc[key] = {
        key,
        fecha: tk.actividad_fecha,
        desc: tk.actividad_desc ?? tk.descripcion ?? "Sin descripción",
        entidad: tk.entidad_nombre,
        tokens: [],
      };
      acc[key].tokens.push(tk);
      return acc;
    }, {});
  }

  const activos   = tokens.filter(t => t.activo);
  const inactivos = tokens.filter(t => !t.activo);
  const gruposActivos   = agrupar(activos);
  const gruposInactivos = agrupar(inactivos);

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-700" />
            Encuestas de Satisfacción
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Encuestas vinculadas a eventos de capacitación</p>
        </div>
        {puedeEditar && tab === "enlaces" && (
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors">
            <Plus className="w-4 h-4" /> Generar enlace
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("dashboard")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <BarChart2 className="w-3.5 h-3.5" /> Dashboard
        </button>
        <button onClick={() => setTab("enlaces")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "enlaces" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Link2 className="w-3.5 h-3.5" /> Gestión de enlaces
          {tokens.filter(t => t.activo).length > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              {tokens.filter(t => t.activo).length}
            </span>
          )}
        </button>
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && <EncuestasDashboard entidades={entidades} />}

      {/* Tab enlaces */}
      {tab === "enlaces" && (
        loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : (
          <div className="space-y-6">

            {/* Encuestas activas */}
            {activos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
                <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No hay encuestas activas.</p>
                <p className="text-xs text-gray-400 mt-1">Genera un enlace vinculado a un evento de capacitación.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(gruposActivos).map(grupo => (
                  <GrupoEncuesta key={grupo.key} grupo={grupo} baseUrl={baseUrl} puedeEditar={puedeEditar}
                    onDesactivar={desactivarLocal} onEliminar={eliminarLocal} modoHistorial={false} />
                ))}
              </div>
            )}

            {/* Historial */}
            {inactivos.length > 0 && (
              <div>
                <button onClick={() => setVerHistorial(v => !v)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                  <History className="w-4 h-4" />
                  Historial ({inactivos.length} finalizadas)
                  {verHistorial ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {verHistorial && (
                  <div className="mt-4 space-y-6 opacity-75">
                    {Object.values(gruposInactivos).map(grupo => (
                      <GrupoEncuesta key={grupo.key} grupo={grupo} baseUrl={baseUrl} puedeEditar={puedeEditar}
                        onDesactivar={desactivarLocal} onEliminar={eliminarLocal} modoHistorial={true} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {modal && (
        <ModalNuevoEnlace
          entidades={entidades}
          onClose={() => setModal(false)}
          onCreado={() => { setModal(false); cargar(); }}
        />
      )}
    </div>
  );
}

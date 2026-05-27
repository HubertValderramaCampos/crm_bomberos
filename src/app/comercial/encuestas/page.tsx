"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Plus, Copy, Check, Trash2, Loader2,
  ChevronDown, ChevronUp, Building2, ExternalLink,
  ThumbsUp, ThumbsDown, Star, PlusCircle, X,
} from "lucide-react";

interface Entidad { id: number; nombre: string; tipo: string; }
interface TokenRow {
  id: number; token: string; activo: boolean; created_at: string;
  entidad_id: number; entidad_nombre: string;
  descripcion: string | null;
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

const CALIF_COLOR: Record<string, string> = {
  "Excelente": "text-green-600 font-semibold",
  "Bueno":     "text-blue-600 font-semibold",
  "Regular":   "text-amber-600 font-semibold",
  "Malo":      "text-red-600 font-semibold",
};

function BoolBadge({ v }: { v: boolean | null }) {
  if (v === null) return <span className="text-gray-400 text-xs">—</span>;
  return v
    ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><ThumbsUp className="w-3 h-3" />Sí</span>
    : <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><ThumbsDown className="w-3 h-3" />No</span>;
}

function CalifBadge({ v }: { v: string | null }) {
  if (!v) return <span className="text-gray-400 text-xs">—</span>;
  return <span className={`text-xs ${CALIF_COLOR[v] ?? "text-gray-700"}`}>{v}</span>;
}

function RespuestaDetalle({ r }: { r: Respuesta }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div><span className="text-xs text-gray-400">Empresa</span><p className="font-medium">{r.empresa_nombre ?? "—"}</p></div>
        <div><span className="text-xs text-gray-400">Horario</span><p>{r.horario ?? "—"}</p></div>
        <div><span className="text-xs text-gray-400">Fecha capacitación</span><p>{r.fecha_capacitacion ? new Date(r.fecha_capacitacion).toLocaleDateString("es-PE") : "—"}</p></div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">
        <div><p className="text-xs text-gray-400 mb-0.5">Objetivos alcanzados</p><BoolBadge v={r.objetivos_alcanzados} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Duración adecuada</p><BoolBadge v={r.duracion_adecuada} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Dinámicas correctas</p><BoolBadge v={r.dinamicas_correctas} /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-gray-200 pt-3">
        <div><p className="text-xs text-gray-400 mb-0.5">Contenido</p><CalifBadge v={r.contenido_calif} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Materiales</p><CalifBadge v={r.materiales_calif} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Dinámica expositores</p><CalifBadge v={r.dinamica_expositores} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">Conocimiento</p><CalifBadge v={r.conocimiento_expositores} /></div>
      </div>

      {r.aspectos_mejora && r.aspectos_mejora.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-400 mb-1">Aspectos a mejorar</p>
          <div className="flex flex-wrap gap-1.5">
            {r.aspectos_mejora.map(a => (
              <span key={a} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{a}</span>
            ))}
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

function TokenCard({ tk, baseUrl, onDesactivar }: {
  tk: TokenRow; baseUrl: string; onDesactivar: (id: number) => void;
}) {
  const [copiado,     setCopiado]     = useState(false);
  const [abierto,     setAbierto]     = useState(false);
  const [respuestas,  setRespuestas]  = useState<Respuesta[] | null>(null);
  const [cargando,    setCargando]    = useState(false);
  const [eliminando,  setEliminando]  = useState(false);

  const url = `${baseUrl}/encuesta/${tk.token}`;

  function copiar() {
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  async function toggleRespuestas() {
    if (abierto) { setAbierto(false); return; }
    setAbierto(true);
    if (respuestas !== null) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/encuestas/${tk.id}`);
      setRespuestas(await res.json());
    } finally {
      setCargando(false);
    }
  }

  async function desactivar() {
    if (!confirm("¿Desactivar este enlace? Ya no podrá recibir nuevas respuestas.")) return;
    setEliminando(true);
    try {
      await fetch(`/api/encuestas/${tk.id}`, { method: "DELETE" });
      onDesactivar(tk.id);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${tk.activo ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tk.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {tk.activo ? "ACTIVO" : "INACTIVO"}
            </span>
            <span className="text-xs text-gray-400">Creado {new Date(tk.created_at).toLocaleDateString("es-PE")}</span>
          </div>
          {tk.descripcion && (
            <p className="text-sm font-semibold text-gray-800 mt-1">{tk.descripcion}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <code className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 truncate max-w-xs">{url}</code>
            <button onClick={copiar} className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Copiar enlace">
              {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Abrir formulario">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        {tk.activo && (
          <button onClick={desactivar} disabled={eliminando} className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Desactivar">
            {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Respuestas */}
      <button
        onClick={toggleRespuestas}
        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-800 transition-colors border-t border-gray-100 pt-3"
      >
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
          {!cargando && respuestas?.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Aún no hay respuestas para este enlace.</p>}
          {!cargando && respuestas?.map(r => <RespuestaDetalle key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

export default function EncuestasPage() {
  const [tokens,    setTokens]    = useState<TokenRow[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creando,       setCreando]       = useState(false);
  const [entidadId,     setEntidadId]     = useState<string>("");
  const [descripcion,   setDescripcion]   = useState("");
  const [generando,     setGenerando]     = useState(false);
  const [baseUrl,       setBaseUrl]       = useState("");
  const [nuevaEntidad,  setNuevaEntidad]  = useState(false);
  const [nuevoNombre,   setNuevoNombre]   = useState("");
  const [nuevoTipo,     setNuevoTipo]     = useState("EMPRESA");
  const [creandoEnt,    setCreandoEnt]    = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [tkRes, entRes] = await Promise.all([
        fetch("/api/encuestas").then(r => r.json()),
        fetch("/api/entidades").then(r => r.json()),
      ]);
      setTokens(Array.isArray(tkRes) ? tkRes : []);
      setEntidades(Array.isArray(entRes) ? entRes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    cargar();
  }, [cargar]);

  async function generarToken() {
    if (!entidadId) return;
    setGenerando(true);
    try {
      await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entidad_id: Number(entidadId), descripcion: descripcion.trim() || null }),
      });
      setCreando(false);
      setEntidadId("");
      setDescripcion("");
      cargar();
    } finally {
      setGenerando(false);
    }
  }

  async function crearEntidad() {
    if (!nuevoNombre.trim()) return;
    setCreandoEnt(true);
    try {
      const res = await fetch("/api/entidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre.trim(), tipo: nuevoTipo }),
      });
      const data = await res.json();
      // Recargar entidades y seleccionar la nueva
      const entRes = await fetch("/api/entidades").then(r => r.json());
      setEntidades(Array.isArray(entRes) ? entRes : []);
      setEntidadId(String(data.id));
      setNuevaEntidad(false);
      setNuevoNombre("");
    } finally {
      setCreandoEnt(false);
    }
  }

  function desactivarLocal(id: number) {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, activo: false } : t));
  }

  // Agrupar por entidad
  const porEntidad: Record<number, { nombre: string; tokens: TokenRow[] }> = {};
  for (const tk of tokens) {
    if (!porEntidad[tk.entidad_id]) porEntidad[tk.entidad_id] = { nombre: tk.entidad_nombre, tokens: [] };
    porEntidad[tk.entidad_id].tokens.push(tk);
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-700" />
            Encuestas de Satisfacción
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Genera un enlace por empresa y monitorea sus respuestas</p>
        </div>
        {!creando && (
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Generar enlace
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Empresas</p>
          <p className="text-2xl font-bold text-gray-800">{Object.keys(porEntidad).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Links activos</p>
          <p className="text-2xl font-bold text-green-600">{tokens.filter(t => t.activo).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Respuestas</p>
          <p className="text-2xl font-bold text-blue-600">{tokens.reduce((s, t) => s + t.total_respuestas, 0)}</p>
        </div>
      </div>

      {/* Formulario generar */}
      {creando && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Generar enlace de encuesta</h3>

          {!nuevaEntidad ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Empresa / Entidad</label>
                <select
                  value={entidadId}
                  onChange={e => setEntidadId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                >
                  <option value="">Seleccionar entidad…</option>
                  {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <button
                  onClick={() => setNuevaEntidad(true)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Crear nueva entidad
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Descripción de la capacitación <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej: Capacitación Primeros Auxilios — Mayo 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ayuda a distinguir esta encuesta de otras de la misma empresa.</p>
              </div>
            </>
          ) : (
            <div className="border border-red-100 bg-red-50/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-red-700">Nueva entidad</p>
                <button onClick={() => { setNuevaEntidad(false); setNuevoNombre(""); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                placeholder="Nombre de la empresa"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white"
              />
              <select
                value={nuevoTipo}
                onChange={e => setNuevoTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white"
              >
                {["EMPRESA","INSTITUCIÓN PÚBLICA","ONG","HOSPITAL","MUNICIPALIDAD","OTRO"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="flex justify-end">
                <button
                  disabled={!nuevoNombre.trim() || creandoEnt}
                  onClick={crearEntidad}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creandoEnt && <Loader2 className="w-3 h-3 animate-spin" />}
                  Guardar entidad
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setCreando(false); setEntidadId(""); setDescripcion(""); setNuevaEntidad(false); setNuevoNombre(""); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={!entidadId || generando || nuevaEntidad}
              onClick={generarToken}
              className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Generar enlace
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : tokens.length === 0 && !creando ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aún no hay encuestas generadas.</p>
          <p className="text-xs text-gray-400 mt-1">Genera un enlace por empresa para enviarle el formulario.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(porEntidad).map(([eid, { nombre, tokens: tks }]) => (
            <div key={eid}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Building2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">{nombre}</p>
              </div>
              <div className="space-y-2">
                {tks.map(tk => (
                  <TokenCard key={tk.id} tk={tk} baseUrl={baseUrl} onDesactivar={desactivarLocal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

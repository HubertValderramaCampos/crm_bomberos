"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, MapPin,
  Users, BookOpen, Calendar, Check, Loader2, Building2, Search,
  CheckCircle2, AlertCircle, CalendarClock, RotateCcw, Copy, ClipboardList, Pencil,
} from "lucide-react";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const TIPOS = [
  "Capacitación interna","Capacitación externa","Simulacro","Campaña preventiva",
  "Desfile / Acto cívico","Reunión de compañía","Mantenimiento","Otro",
];

// Colores por ÁREA (prioridad sobre tipo)
const AREAS = ["ADMINISTRACION", "IMAGEN", "INSTRUCCION"] as const;
type Area = typeof AREAS[number];

const AREA_COLOR: Record<Area, { badge: string; dia: string; hex: string }> = {
  "ADMINISTRACION": { badge: "bg-red-100 text-red-700 border-red-200",    dia: "bg-red-600",    hex: "#dc2626" },
  "IMAGEN":         { badge: "bg-orange-100 text-orange-700 border-orange-200", dia: "bg-orange-500", hex: "#f97316" },
  "INSTRUCCION":    { badge: "bg-green-100 text-green-700 border-green-200",  dia: "bg-green-600",  hex: "#16a34a" },
};

function getColorBadge(area: string | null | undefined, tipo: string): string {
  if (area && area in AREA_COLOR) return AREA_COLOR[area as Area].badge;
  return COLOR[tipo] ?? COLOR["Otro"];
}

function getColorDia(area: string | null | undefined, tipo: string): string {
  if (area && area in AREA_COLOR) return AREA_COLOR[area as Area].dia;
  return COLOR_DIA[tipo] ?? "bg-gray-400";
}

const COLOR: Record<string, string> = {
  "Capacitación interna":  "bg-blue-100 text-blue-700 border-blue-200",
  "Capacitación externa":  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Simulacro":             "bg-amber-100 text-amber-700 border-amber-200",
  "Campaña preventiva":    "bg-green-100 text-green-700 border-green-200",
  "Desfile / Acto cívico": "bg-purple-100 text-purple-700 border-purple-200",
  "Reunión de compañía":   "bg-gray-100 text-gray-600 border-gray-200",
  "Mantenimiento":         "bg-orange-100 text-orange-700 border-orange-200",
  "Proyección social":     "bg-rose-100 text-rose-700 border-rose-200",
  "Otro":                  "bg-gray-100 text-gray-500 border-gray-200",
};

const COLOR_DIA: Record<string, string> = {
  "Capacitación interna":  "bg-blue-500",
  "Capacitación externa":  "bg-indigo-500",
  "Simulacro":             "bg-amber-500",
  "Campaña preventiva":    "bg-green-500",
  "Desfile / Acto cívico": "bg-purple-500",
  "Reunión de compañía":   "bg-gray-500",
  "Mantenimiento":         "bg-orange-500",
  "Proyección social":     "bg-rose-500",
  "Otro":                  "bg-gray-400",
};

interface Actividad {
  id: number; fecha: string; tipo: string; descripcion: string | null;
  lugar: string | null; es_capacitacion: boolean;
  hora_inicio: string | null; hora_fin: string | null;
  efectivos_asistentes: number; participantes: number;
  finalizado: boolean; reprogramada_de: number | null;
  area: string | null;
}

interface Bombero { id: number; apellidos: string; nombres: string; grado: string; codigo: string; }
interface Entidad { id: number; nombre: string; tipo: string; }

interface Detalle extends Omit<Actividad, "participantes"> {
  entidad_id?: number | null;
  entidad_nombre?: string | null;
  area: string | null;
  participantes: { bombero_id: number; apellidos: string; nombres: string; grado: string; asistio: boolean | null }[];
}

function hhmm(t: string | null) { return t ? t.slice(0, 5) : ""; }

function fechaHaPasado(fecha: string) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const f = new Date(fecha + "T00:00:00"); f.setHours(0,0,0,0);
  return f < hoy;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

/* ── Modal Reprogramar ── */
function ModalReprogramar({ actividad, onClose, onReprogramado }: {
  actividad: Detalle; onClose: () => void; onReprogramado: (nuevaId: number) => void;
}) {
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [horaIni, setHoraIni]       = useState(hhmm(actividad.hora_inicio));
  const [horaFin, setHoraFin]       = useState(hhmm(actividad.hora_fin));
  const [lugar, setLugar]           = useState(actividad.lugar ?? "");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaFecha) { setError("La nueva fecha es obligatoria."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/programacion/${actividad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "reprogramar",
          nueva_fecha: nuevaFecha,
          hora_inicio: horaIni || null,
          hora_fin: horaFin || null,
          lugar: lugar || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al reprogramar."); return; }
      onReprogramado(data.id);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            <h2 className="text-base font-bold">Reprogramar actividad</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
            <p className="font-semibold">{actividad.descripcion ?? actividad.tipo}</p>
            <p className="opacity-70 mt-0.5">
              Fecha original: {new Date(actividad.fecha + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nueva fecha *</label>
            <input type="date" required value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
              <input type="time" value={horaIni} onChange={e => setHoraIni(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
              <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lugar</label>
            <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Cuartel B-150" className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {loading ? "Reprogramando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Editar Actividad ── */
function ModalEditar({ actividad, onClose, onEditado }: {
  actividad: Detalle; onClose: () => void; onEditado: () => void;
}) {
  const [form, setForm] = useState({
    tipo:        actividad.tipo,
    descripcion: actividad.descripcion ?? "",
    fecha:       actividad.fecha,
    lugar:       actividad.lugar ?? "",
    hora_inicio: hhmm(actividad.hora_inicio),
    hora_fin:    hhmm(actividad.hora_fin),
    efectivos_asistentes: String(actividad.efectivos_asistentes ?? 0),
    area:        actividad.area ?? "",
  });
  const [bomberos,       setBomberos]       = useState<Bombero[]>([]);
  const [seleccionados,  setSeleccionados]  = useState<number[]>(
    actividad.es_capacitacion ? actividad.participantes.map(p => p.bombero_id) : []
  );
  const [busqueda,       setBusqueda]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  const [entidades,          setEntidades]          = useState<Entidad[]>([]);
  const [entidadId,          setEntidadId]          = useState<number | null>(actividad.entidad_id ?? null);
  const [entidadSel,         setEntidadSel]         = useState<Entidad | null>(null);
  const [busqEntidad,        setBusqEntidad]        = useState("");
  const [mostrarEntidades,   setMostrarEntidades]   = useState(false);

  useEffect(() => {
    if (actividad.es_capacitacion)
      fetch("/api/bomberos").then(r => r.json()).then(setBomberos);
    fetch("/api/entidades").then(r => r.json()).then((data: Entidad[]) => {
      setEntidades(data);
      if (actividad.entidad_id) {
        const found = data.find((e: Entidad) => e.id === actividad.entidad_id);
        if (found) setEntidadSel(found);
      }
    });
  }, [actividad.es_capacitacion, actividad.entidad_id]);

  const filtrados = bomberos.filter(b =>
    `${b.apellidos} ${b.nombres} ${b.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  function toggleBombero(id: number) {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/programacion/${actividad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "editar",
          tipo:        form.tipo,
          descripcion: form.descripcion || null,
          fecha:       form.fecha,
          lugar:       form.lugar || null,
          hora_inicio: form.hora_inicio || null,
          hora_fin:    form.hora_fin || null,
          efectivos_asistentes: actividad.es_capacitacion ? seleccionados.length : Number(form.efectivos_asistentes) || 0,
          entidad_id:  entidadId,
          participantes: actividad.es_capacitacion ? seleccionados : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
      onEditado();
      onClose();
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            <h2 className="text-base font-bold">Editar actividad</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de actividad</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Área</label>
              <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className={inputCls}>
                <option value="">Sin área</option>
                {AREAS.map(a => (
                  <option key={a} value={a}>{a === "ADMINISTRACION" ? "Administración" : a === "IMAGEN" ? "Imagen" : "Instrucción"}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción / Tema</label>
            <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Ej: Primeros auxilios básicos" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Entidad</label>
            <div className="relative">
              {entidadSel ? (
                <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-indigo-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold text-indigo-800 truncate">{entidadSel.nombre}</span>
                  </div>
                  <button type="button" onClick={() => { setEntidadId(null); setEntidadSel(null); setBusqEntidad(""); }}
                    className="text-gray-400 hover:text-red-500 ml-2 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar entidad..."
                    value={busqEntidad}
                    onChange={e => { setBusqEntidad(e.target.value); setMostrarEntidades(true); }}
                    onFocus={() => setMostrarEntidades(true)}
                    onBlur={() => setTimeout(() => setMostrarEntidades(false), 150)}
                    className={`${inputCls} pl-8`}
                  />
                  {mostrarEntidades && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                      {entidades.filter(e => e.nombre.toLowerCase().includes(busqEntidad.toLowerCase())).slice(0, 8).map(e => (
                        <div key={e.id} onMouseDown={() => { setEntidadId(e.id); setEntidadSel(e); setBusqEntidad(""); setMostrarEntidades(false); }}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{e.nombre}</p>
                            <p className="text-[10px] text-gray-400">{e.tipo}</p>
                          </div>
                        </div>
                      ))}
                      {entidades.filter(e => e.nombre.toLowerCase().includes(busqEntidad.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha</label>
              <input type="date" required value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lugar</label>
              <input type="text" value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Cuartel B-150" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
              <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
              <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
            </div>
          </div>

          {!actividad.es_capacitacion && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Efectivos asistentes</label>
              <input type="number" min="0" value={form.efectivos_asistentes}
                onChange={e => setForm(f => ({ ...f, efectivos_asistentes: e.target.value }))} className={inputCls} />
            </div>
          )}

          {actividad.es_capacitacion && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">
                  Participantes <span className="text-red-600 font-bold ml-1">{seleccionados.length} seleccionados</span>
                </label>
                <button type="button" onClick={() => setSeleccionados(filtrados.map(b => b.id))}
                  className="text-xs text-red-700 hover:underline">Seleccionar todos</button>
              </div>
              <input type="text" placeholder="Buscar bombero..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)} className={`${inputCls} mb-2`} />
              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-40 divide-y divide-gray-50">
                {filtrados.map(b => {
                  const sel = seleccionados.includes(b.id);
                  return (
                    <div key={b.id} onClick={() => toggleBombero(b.id)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${sel ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? "bg-red-600 border-red-600" : "border-gray-300"}`}>
                        {sel && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                        <p className="text-[10px] text-gray-400">{b.grado} · {b.codigo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><Pencil className="w-4 h-4" />Guardar cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tipos para asistencia ── */
interface RegistroAsistencia {
  bombero_id: number; apellidos: string; nombres: string; grado: string; codigo: string;
  asistio: boolean; justificacion: string; agregado: boolean;
}

/* ── Modal Registro de Asistencia ── */
function ModalAsistencia({ actividadId, participantesIniciales, onConfirmar, onCancelar }: {
  actividadId: number;
  participantesIniciales: { bombero_id: number; apellidos: string; nombres: string; grado: string }[];
  onConfirmar: (lista: RegistroAsistencia[]) => void;
  onCancelar: () => void;
}) {
  const [lista, setLista] = useState<RegistroAsistencia[]>(
    participantesIniciales.map(p => ({
      bombero_id: p.bombero_id, apellidos: p.apellidos, nombres: p.nombres,
      grado: p.grado, codigo: "", asistio: true, justificacion: "", agregado: false,
    }))
  );
  const [bomberosTodos, setBomberosTodos] = useState<Bombero[]>([]);
  const [busqAgregar,   setBusqAgregar]  = useState("");
  const [mostrarAgregar,setMostrarAgregar] = useState(false);
  const [justAbierta,   setJustAbierta]  = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/bomberos").then(r => r.json()).then(setBomberosTodos);
  }, []);

  function setAsistio(idx: number, val: boolean) {
    setLista(prev => prev.map((p, i) => i === idx ? { ...p, asistio: val, justificacion: val ? "" : p.justificacion } : p));
    if (val) setJustAbierta(null);
  }

  function setJust(idx: number, val: string) {
    setLista(prev => prev.map((p, i) => i === idx ? { ...p, justificacion: val } : p));
  }

  function agregar(b: Bombero) {
    if (lista.find(p => p.bombero_id === b.id)) return;
    setLista(prev => [...prev, { bombero_id: b.id, apellidos: b.apellidos, nombres: b.nombres, grado: b.grado, codigo: b.codigo, asistio: true, justificacion: "", agregado: true }]);
    setBusqAgregar(""); setMostrarAgregar(false);
  }

  const yaIds = new Set(lista.map(p => p.bombero_id));
  const filtradosAgregar = bomberosTodos.filter(b => !yaIds.has(b.id) && `${b.apellidos} ${b.nombres}`.toLowerCase().includes(busqAgregar.toLowerCase()));

  const asistieron = lista.filter(p => p.asistio).length;
  const faltaron   = lista.filter(p => !p.asistio).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-green-600 to-green-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Registro de asistencia</h2>
            <p className="text-xs text-white/70 mt-0.5">Marca quién asistió antes de finalizar</p>
          </div>
          <button onClick={onCancelar} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
          <div className="bg-green-50 px-4 py-2 text-center">
            <p className="text-xl font-bold text-green-700">{asistieron}</p>
            <p className="text-[10px] text-green-600 uppercase tracking-wide">Asistieron</p>
          </div>
          <div className="bg-red-50 px-4 py-2 text-center">
            <p className="text-xl font-bold text-red-600">{faltaron}</p>
            <p className="text-[10px] text-red-500 uppercase tracking-wide">Faltaron</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {lista.map((p, idx) => (
            <div key={p.bombero_id} className={`rounded-xl border px-3 py-2.5 transition-colors ${p.asistio ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {p.apellidos.split(",")[0]}, {p.nombres.split(" ")[0]}
                    {p.agregado && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Agregado</span>}
                  </p>
                  <p className="text-[10px] text-gray-400">{p.grado}</p>
                </div>
                {/* Toggle asistió / faltó */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setAsistio(idx, true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${p.asistio ? "bg-green-600 text-white" : "bg-white text-gray-400 border border-gray-200 hover:bg-green-50"}`}>
                    ✓ Asistió
                  </button>
                  <button onClick={() => { setAsistio(idx, false); setJustAbierta(idx); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${!p.asistio ? "bg-red-600 text-white" : "bg-white text-gray-400 border border-gray-200 hover:bg-red-50"}`}>
                    ✗ Faltó
                  </button>
                </div>
              </div>
              {/* Justificación */}
              {!p.asistio && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={p.justificacion}
                    onChange={e => setJust(idx, e.target.value)}
                    placeholder="Justificación (opcional)"
                    className="w-full text-xs border border-red-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Agregar efectivo extra */}
          <div className="pt-2">
            {!mostrarAgregar ? (
              <button onClick={() => setMostrarAgregar(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Plus className="w-3.5 h-3.5" /> Agregar efectivo que no estaba convocado
              </button>
            ) : (
              <div className="border border-blue-200 rounded-xl p-3 bg-blue-50 space-y-2">
                <p className="text-xs font-semibold text-blue-700">Buscar efectivo</p>
                <input type="text" value={busqAgregar} onChange={e => setBusqAgregar(e.target.value)}
                  autoFocus placeholder="Apellidos o código..."
                  className="w-full text-sm border border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filtradosAgregar.slice(0, 6).map(b => (
                    <button key={b.id} onClick={() => agregar(b)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-blue-100 rounded-lg flex items-center justify-between">
                      <span className="font-medium">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</span>
                      <span className="text-[10px] text-gray-400">{b.grado}</span>
                    </button>
                  ))}
                  {filtradosAgregar.length === 0 && busqAgregar && <p className="text-xs text-gray-400 text-center py-2">Sin resultados</p>}
                </div>
                <button onClick={() => { setMostrarAgregar(false); setBusqAgregar(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => onConfirmar(lista)}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Confirmar y finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal Ver Actividad ── */
function ModalVer({ id, puedeCrear, onClose, onActualizado }: {
  id: number; puedeCrear: boolean; onClose: () => void; onActualizado: () => void;
}) {
  const [data, setData]                     = useState<Detalle | null>(null);
  const [finalizando, setFin]               = useState(false);
  const [confirmFin, setConfirmFin]         = useState(false);
  const [reprogramar, setReprogram]         = useState(false);
  const [editando,    setEditando]          = useState(false);
  const [registroAsistencia, setRegistroAsistencia] = useState(false);

  function cargar() {
    fetch(`/api/programacion/${id}`).then(r => r.json()).then(setData);
  }
  useEffect(() => { cargar(); }, [id]);

  if (!data) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Loader2 className="w-6 h-6 text-white animate-spin" />
    </div>
  );

  const badge    = getColorBadge(data.area, data.tipo);
  const partics  = Array.isArray(data.participantes) ? data.participantes : [];
  const vencida  = fechaHaPasado(data.fecha) && !data.finalizado;
  const pasada   = fechaHaPasado(data.fecha);

  async function finalizar(asistencias?: RegistroAsistencia[]) {
    setFin(true);
    try {
      // Guardar asistencias si se proporcionaron
      if (asistencias && asistencias.length > 0) {
        await fetch(`/api/programacion/${id}/asistencia`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(asistencias.map(a => ({
            bombero_id: a.bombero_id,
            asistio: a.asistio,
            justificacion: a.justificacion || null,
            agregado: a.agregado,
          }))),
        });
      }
      const res = await fetch(`/api/programacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "finalizar" }),
      });
      await res.json();
    } finally {
      setFin(false);
      setConfirmFin(false);
      setRegistroAsistencia(false);
      onActualizado();
      cargar();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className={`px-5 py-4 text-white flex items-start justify-between gap-3 ${data.finalizado ? "bg-gradient-to-br from-green-600 to-green-700" : vencida ? "bg-gradient-to-br from-red-800 to-red-900" : "bg-gradient-to-br from-red-700 to-red-800"}`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${badge}`}>{data.tipo}</span>
                {data.area && (
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${AREA_COLOR[data.area as Area]?.badge ?? ""}`}>
                    {data.area === "ADMINISTRACION" ? "Administración" : data.area === "IMAGEN" ? "Imagen" : "Instrucción"}
                  </span>
                )}
                {data.finalizado && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-green-200 text-green-800 border border-green-300">
                    <CheckCircle2 className="w-3 h-3" /> Finalizado
                  </span>
                )}
                {vencida && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-200 text-red-800 border border-red-300">
                    <AlertCircle className="w-3 h-3" /> Vencido — pendiente de cierre
                  </span>
                )}
                {data.reprogramada_de && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800 border border-amber-300">
                    <RotateCcw className="w-3 h-3" /> Reprogramada
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold leading-tight">{data.descripcion ?? data.tipo}</h2>
              <p className="text-xs text-white/70 mt-1">
                {new Date(data.fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white mt-0.5 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* Alerta vencida */}
            {vencida && puedeCrear && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-800">Esta actividad ya pasó</p>
                  <p className="text-xs text-red-600 mt-0.5">¿Se realizó la actividad? Márcala como finalizada, o reprograma si no se llevó a cabo.</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              {(data.hora_inicio || data.hora_fin) && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{hhmm(data.hora_inicio)}{data.hora_fin ? ` — ${hhmm(data.hora_fin)}` : ""}</span>
                </div>
              )}
              {data.lugar && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{data.lugar}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{data.es_capacitacion ? partics.length : data.efectivos_asistentes} efectivos</span>
              </div>
              {data.es_capacitacion && (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Capacitación</span>
                </div>
              )}
              {data.entidad_nombre && (
                <div className="flex items-center gap-2 text-sm text-gray-700 col-span-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{data.entidad_nombre}</span>
                </div>
              )}
            </div>

            {/* Participantes */}
            {data.es_capacitacion && partics.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Participantes ({partics.length})</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {partics.map(p => (
                    <div key={p.bombero_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-red-700">{p.apellidos[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.apellidos.split(",")[0]}, {p.nombres.split(" ")[0]}</p>
                        <p className="text-[10px] text-gray-400">{p.grado}</p>
                      </div>
                      {p.asistio === true  && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                      {p.asistio === false && <X    className="w-3.5 h-3.5 text-red-400 shrink-0"   />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmación de finalizar — solo para actividades sin participantes */}
            {confirmFin && partics.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-green-800">¿Confirmar que la actividad se realizó?</p>
                </div>
                <p className="text-xs text-green-700">Se marcará como finalizada.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmFin(false)}
                    className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button onClick={() => finalizar()} disabled={finalizando}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-1.5">
                    {finalizando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    {finalizando ? "Finalizando..." : "Sí, finalizar"}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer con acciones */}
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 flex-wrap">
            {puedeCrear && !data.finalizado && !confirmFin && (
              <button onClick={() => setEditando(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" /> Editar
              </button>
            )}
            {puedeCrear && pasada && !data.finalizado && !confirmFin && (
              <>
                <button onClick={() => setReprogram(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4" /> Reprogramar
                </button>
                <button onClick={() => partics.length > 0 ? setRegistroAsistencia(true) : setConfirmFin(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Marcar finalizado
                </button>
              </>
            )}
            {(!puedeCrear || data.finalizado || confirmFin) && (
              <button onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      {reprogramar && (
        <ModalReprogramar
          actividad={data}
          onClose={() => setReprogram(false)}
          onReprogramado={(nuevaId) => {
            setReprogram(false);
            onActualizado();
            onClose();
            setTimeout(() => { void nuevaId; }, 200);
          }}
        />
      )}
      {editando && (
        <ModalEditar
          actividad={data}
          onClose={() => setEditando(false)}
          onEditado={() => { onActualizado(); cargar(); }}
        />
      )}
      {registroAsistencia && (
        <ModalAsistencia
          actividadId={id}
          participantesIniciales={partics}
          onConfirmar={(lista) => finalizar(lista)}
          onCancelar={() => setRegistroAsistencia(false)}
        />
      )}
    </>
  );
}

/* ── Modal Crear Actividad ── */
function ModalCrear({ fecha: fechaInicial, onClose, onCreated }: { fecha: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fecha: fechaInicial, tipo: "Capacitación interna", descripcion: "",
    lugar: "", es_capacitacion: true, hora_inicio: "", hora_fin: "",
    efectivos_asistentes: "", area: "",
  });
  const [entidadId, setEntidadId]         = useState<number | null>(null);
  const [entidades, setEntidades]         = useState<Entidad[]>([]);
  const [busqEntidad, setBusqEntidad]     = useState("");
  const [mostrarEntidades, setMostrarEntidades] = useState(false);
  const [creandoEntidad, setCreandoEntidad] = useState(false);
  const [nuevaEntidad, setNuevaEntidad]   = useState({ nombre: "", tipo: "EMPRESA" });
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<Entidad | null>(null);

  const [bomberos, setBomberos]           = useState<Bombero[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [busqueda, setBusqueda]           = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  useEffect(() => {
    fetch("/api/bomberos").then(r => r.json()).then(setBomberos);
    fetch("/api/entidades").then(r => r.json()).then(setEntidades);
  }, []);

  const esCap = form.es_capacitacion;
  const filtrados = bomberos.filter(b =>
    `${b.apellidos} ${b.nombres} ${b.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const entidadesFiltradas = entidades.filter(e =>
    e.nombre.toLowerCase().includes(busqEntidad.toLowerCase())
  );

  function toggleBombero(id: number) {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleTodos() {
    if (seleccionados.length === filtrados.length) setSeleccionados([]);
    else setSeleccionados(filtrados.map(b => b.id));
  }

  function seleccionarEntidad(e: Entidad) {
    setEntidadId(e.id); setEntidadSeleccionada(e); setBusqEntidad(""); setMostrarEntidades(false);
  }

  function limpiarEntidad() {
    setEntidadId(null); setEntidadSeleccionada(null); setBusqEntidad("");
  }

  async function crearEntidadInline() {
    if (!nuevaEntidad.nombre.trim()) return;
    try {
      const res = await fetch("/api/entidades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevaEntidad) });
      const data = await res.json();
      if (!res.ok) return;
      const creada: Entidad = { id: data.id, nombre: nuevaEntidad.nombre, tipo: nuevaEntidad.tipo };
      setEntidades(prev => [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      seleccionarEntidad(creada);
      setCreandoEntidad(false);
      setNuevaEntidad({ nombre: "", tipo: "EMPRESA" });
    } catch { /* silent */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fecha || !form.tipo) { setError("Fecha y tipo son obligatorios."); return; }
    if (esCap && seleccionados.length === 0) { setError("Selecciona al menos un bombero."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/programacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entidad_id: entidadId,
          participantes: esCap ? seleccionados : [],
          efectivos_asistentes: esCap ? seleccionados.length : Number(form.efectivos_asistentes) || 0,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar."); return; }
      onCreated();
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  const TIPOS_ENTIDAD = ["EMPRESA", "INSTITUCIÓN PÚBLICA", "COLEGIO", "ASOCIACIÓN / AA.HH."];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h2 className="text-base font-bold">Nueva Actividad</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de actividad</label>
                <select value={form.tipo} onChange={e => {
                  const t = e.target.value;
                  setForm(f => ({ ...f, tipo: t, es_capacitacion: t.startsWith("Capacitación") }));
                }} className={inputCls}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Área</label>
                <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className={inputCls}>
                  <option value="">Sin área</option>
                  {AREAS.map(a => (
                    <option key={a} value={a}>{a === "ADMINISTRACION" ? "Administración" : a === "IMAGEN" ? "Imagen" : "Instrucción"}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción / Tema</label>
              <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: Primeros auxilios básicos" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lugar</label>
                <input type="text" value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Cuartel B-150" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
                <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Empresa / Institución (opcional)</label>
              {entidadSeleccionada ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm text-gray-900 truncate">{entidadSeleccionada.nombre}</span>
                  <span className="text-[10px] text-gray-400">{entidadSeleccionada.tipo}</span>
                  <button type="button" onClick={limpiarEntidad} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : creandoEntidad ? (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
                  <p className="text-xs font-semibold text-blue-700">Nueva entidad</p>
                  <input type="text" value={nuevaEntidad.nombre} onChange={e => setNuevaEntidad(n => ({ ...n, nombre: e.target.value }))}
                    placeholder="Nombre de la empresa o institución" className={inputCls} autoFocus />
                  <select value={nuevaEntidad.tipo} onChange={e => setNuevaEntidad(n => ({ ...n, tipo: e.target.value }))} className={inputCls}>
                    {TIPOS_ENTIDAD.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCreandoEntidad(false)}
                      className="flex-1 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                    <button type="button" onClick={crearEntidadInline}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Crear y seleccionar</button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" value={busqEntidad}
                      onChange={e => { setBusqEntidad(e.target.value); setMostrarEntidades(true); }}
                      onFocus={() => setMostrarEntidades(true)}
                      placeholder="Buscar empresa o institución..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
                  </div>
                  {mostrarEntidades && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                      {entidadesFiltradas.slice(0, 8).map(e => (
                        <div key={e.id} onMouseDown={() => seleccionarEntidad(e)}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="flex-1 text-sm text-gray-900 truncate">{e.nombre}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{e.tipo}</span>
                        </div>
                      ))}
                      <div onMouseDown={() => { setMostrarEntidades(false); setCreandoEntidad(true); }}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-t border-gray-100">
                        <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-sm text-blue-600 font-medium">Crear nueva entidad</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setForm(f => ({ ...f, es_capacitacion: !f.es_capacitacion }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${esCap ? "bg-red-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${esCap ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Es una capacitación (seleccionar bomberos)</span>
            </label>

            {!esCap && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Efectivos asistentes</label>
                <input type="number" min="0" value={form.efectivos_asistentes}
                  onChange={e => setForm(f => ({ ...f, efectivos_asistentes: e.target.value }))}
                  className={inputCls} placeholder="0" />
              </div>
            )}

            {esCap && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Bomberos participantes
                    <span className="ml-2 text-red-600 font-bold">{seleccionados.length} seleccionados</span>
                  </p>
                  <button type="button" onClick={toggleTodos} className="text-xs text-red-700 hover:underline font-medium">
                    {seleccionados.length === filtrados.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <input type="text" placeholder="Buscar bombero..." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} className={`${inputCls} mb-2`} />
                <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-52 divide-y divide-gray-50">
                  {filtrados.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">Sin resultados.</p>
                  ) : filtrados.map(b => {
                    const sel = seleccionados.includes(b.id);
                    return (
                      <div key={b.id} onClick={() => toggleBombero(b.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${sel ? "bg-red-50" : "hover:bg-gray-50"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? "bg-red-600 border-red-600" : "border-gray-300"}`}>
                          {sel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                          <p className="text-[10px] text-gray-400">{b.grado} · {b.codigo}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg transition-colors">
              {loading ? "Guardando..." : "Guardar actividad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Calendario principal ── */
export function ProgramacionCalendario({ puedeCrear }: { puedeCrear: boolean }) {
  const hoy = new Date();
  const [mes,  setMes]  = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [verId,    setVerId]    = useState<number | null>(null);
  const [crearDia, setCrearDia] = useState<string | null>(null);

  const cargar = useCallback(() => {
    fetch(`/api/programacion?mes=${mes}&anio=${anio}`)
      .then(r => r.json()).then(setActividades).catch(() => {});
  }, [mes, anio]);

  useEffect(() => { cargar(); }, [cargar]);

  function navMes(delta: number) {
    let m = mes + delta, a = anio;
    if (m > 12) { m = 1;  a++; }
    if (m < 1)  { m = 12; a--; }
    setMes(m); setAnio(a);
  }

  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const actPorDia = (dia: number) => {
    const key = `${anio}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
    return actividades.filter(a => a.fecha === key);
  };

  const esHoy = (dia: number) =>
    dia === hoy.getDate() && mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();

  // Cuántas actividades vencidas sin finalizar hay este mes
  const vencidasSinCerrar = actividades.filter(a => fechaHaPasado(a.fecha) && !a.finalizado).length;

  return (
    <div className="space-y-4">
      {/* Alerta de actividades vencidas */}
      {puedeCrear && vencidasSinCerrar > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 flex-1">
            <span className="font-semibold">{vencidasSinCerrar} actividad{vencidasSinCerrar > 1 ? "es" : ""} vencida{vencidasSinCerrar > 1 ? "s" : ""}</span>
            {" "}sin confirmar. Haz clic en cada una para marcarla finalizada o reprogramarla.
          </p>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navMes(-1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h2 className="text-base font-bold text-gray-900 min-w-[160px] text-center">
            {MESES[mes - 1]} {anio}
          </h2>
          <button onClick={() => navMes(1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setMes(hoy.getMonth() + 1); setAnio(hoy.getFullYear()); }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-600">
            Hoy
          </button>
          {puedeCrear && (
            <button onClick={() => setCrearDia(`${anio}-${String(mes).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Nueva actividad
            </button>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2">
        {/* Áreas */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-100 text-red-700 border-red-200">Administración</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-orange-100 text-orange-700 border-orange-200">Imagen</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-green-100 text-green-700 border-green-200">Instrucción</span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">Sin área</span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Finalizado
        </span>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50/50" />;
            const acts = actPorDia(dia);
            const hoyFlag = esHoy(dia);
            const tieneVencidas = acts.some(a => fechaHaPasado(a.fecha) && !a.finalizado);
            const tieneActs = acts.length > 0;
            // Color de fondo dominante: primer evento del día
            const colorFondo = tieneActs
              ? acts[0].finalizado
                ? "bg-green-500"
                : fechaHaPasado(acts[0].fecha) && !acts[0].finalizado
                  ? "bg-red-500"
                  : getColorDia(acts[0].area, acts[0].tipo)
              : "";

            return (
              <div key={dia}
                className={`min-h-[90px] flex flex-col transition-colors ${
                  tieneActs
                    ? `${colorFondo} text-white`
                    : hoyFlag
                      ? "bg-red-50"
                      : "hover:bg-gray-50/60"
                }`}>

                {/* Número del día */}
                <div className="flex items-center justify-between px-1.5 pt-1.5 pb-1">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    hoyFlag && !tieneActs ? "bg-red-600 text-white"
                    : tieneActs ? "bg-white/20 text-white"
                    : tieneVencidas ? "text-orange-600"
                    : "text-gray-700"
                  }`}>{dia}</span>
                  {puedeCrear && (
                    <button onClick={() => setCrearDia(`${anio}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`)}
                      className="opacity-0 hover:!opacity-100 p-0.5 rounded hover:bg-white/20 transition-all">
                      <Plus className={`w-3 h-3 ${tieneActs ? "text-white" : "text-gray-400"}`} />
                    </button>
                  )}
                </div>

                {/* Eventos */}
                <div className="flex-1 px-1.5 pb-1.5 space-y-0.5">
                  {acts.slice(0, 3).map(a => {
                    const esVencida = fechaHaPasado(a.fecha) && !a.finalizado;
                    const esFinalizada = a.finalizado;
                    return (
                      <button key={a.id} onClick={() => setVerId(a.id)}
                        className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 truncate transition-colors flex items-center gap-1 text-white">
                        {esFinalizada && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        {esVencida    && <AlertCircle  className="w-2.5 h-2.5 shrink-0" />}
                        <span className="truncate">{a.hora_inicio ? `${hhmm(a.hora_inicio)} ` : ""}{a.descripcion ?? a.tipo}</span>
                      </button>
                    );
                  })}
                  {acts.length > 3 && (
                    <span className="text-[10px] text-white/80 pl-1">+{acts.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modales */}
      {verId && (
        <ModalVer
          id={verId}
          puedeCrear={puedeCrear}
          onClose={() => setVerId(null)}
          onActualizado={() => cargar()}
        />
      )}
      {crearDia && (
        <ModalCrear
          fecha={crearDia}
          onClose={() => setCrearDia(null)}
          onCreated={() => { setCrearDia(null); cargar(); }}
        />
      )}
    </div>
  );
}

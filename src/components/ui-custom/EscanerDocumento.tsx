"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera, Upload, X, Loader2, CheckCircle2, AlertCircle,
  Building2, Phone, Mail, User, CalendarDays, Clock,
  MapPin, Users, FileText, RotateCcw, Sparkles, Send,
  Check, ScanLine, MessageSquare, ChevronDown, ChevronUp,
  InboxIcon, Pencil,
} from "lucide-react";

interface DatosIA {
  empresa: string | null; contacto: string | null; telefono: string | null;
  correo: string | null; tema: string | null; descripcion: string | null;
  fecha_solicitada: string | null; hora_inicio: string | null;
  hora_fin: string | null; lugar: string | null; num_participantes: number | null;
}
interface ResultadoIA {
  es_solicitud_capacitacion: boolean;
  confianza: "alta" | "media" | "baja";
  tipo_documento: string;
  descripcion_documento: string;
  datos: DatosIA;
}
interface Entidad  { id: number; nombre: string; tipo: string; }
interface Bombero  { id: number; apellidos: string; nombres: string; grado: string; codigo: string; }
interface Solicitud {
  id: number; estado: string; empresa: string | null; tema: string | null;
  fecha_solicitada: string | null; hora_inicio: string | null; hora_fin: string | null;
  lugar: string | null; num_participantes: number | null;
  contacto: string | null; telefono: string | null; correo: string | null;
  descripcion: string | null; notas: string | null;
  entidad_id: number | null; entidad_nombre: string | null;
  subido_por_rol: string | null; subido_por_nombre: string | null;
  imagen_key: string | null; imagen_url: string | null;
  creado_en: string;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

async function subirImagenCliente(imagen: string): Promise<string | null> {
  try {
    const res = await fetch("/api/upload-imagen", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen }),
    });
    const data = await res.json();
    return res.ok ? (data.key as string) : null;
  } catch { return null; }
}

function Campo({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />{label}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Paso 1 — Captura de imagen
───────────────────────────────────────────── */
function PasoCaptura({ onImagen }: { onImagen: (dataUrl: string) => void }) {
  const [modo, setModo]           = useState<"opciones" | "camara">("opciones");
  const [streamActivo, setStream] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setStream(false);
  }, []);
  useEffect(() => () => detenerCamara(), [detenerCamara]);

  async function abrirCamara() {
    setModo("camara");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStream(true);
    } catch { alert("No se pudo acceder a la cámara."); setModo("opciones"); }
  }

  function capturar() {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    detenerCamara(); setModo("opciones");
    onImagen(c.toDataURL("image/jpeg", 0.85));
  }

  if (modo === "camara") return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden border-2 border-red-300 bg-black aspect-[3/4]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] h-[80%] border-2 border-white/60 rounded-lg relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => { detenerCamara(); setModo("opciones"); }}
          className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
        <button onClick={capturar} disabled={!streamActivo}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-40 rounded-lg flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" /> Capturar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <ScanLine className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-bold text-gray-900">Fotografiar solicitud</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Fotografía o sube la imagen del documento de solicitud de capacitación.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button onClick={abrirCamara}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all">
          <Camera className="w-5 h-5" /> Tomar foto
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all">
          <Upload className="w-5 h-5" /> Subir imagen
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onImagen(ev.target?.result as string); r.readAsDataURL(f); }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Paso 2 — Analizando
───────────────────────────────────────────── */
function PasoAnalizando({ imagen }: { imagen: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200">
          <img src={imagen} alt="doc" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900">Analizando documento...</p>
        <p className="text-sm text-gray-400 mt-1">La IA está extrayendo la información</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Paso 3B — No es solicitud
───────────────────────────────────────────── */
function PasoNoEsSolicitud({ resultado, onReiniciar }: { resultado: ResultadoIA; onReiniciar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-amber-500" />
      </div>
      <div>
        <p className="font-bold text-gray-900">No parece una solicitud de capacitación</p>
        <p className="text-sm text-gray-500 mt-1">{resultado.descripcion_documento}</p>
      </div>
      <button onClick={onReiniciar}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
        <RotateCcw className="w-4 h-4" /> Intentar con otro documento
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Flujo BOMBERO — solo nota + enviar
───────────────────────────────────────────── */
function FlujoBombero({
  imagen, resultado, onReiniciar, onEnviado,
}: {
  imagen: string; resultado: ResultadoIA;
  onReiniciar: () => void; onEnviado: () => void;
}) {
  const [nota, setNota]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const confianzaColor = { alta: "text-green-600 bg-green-50", media: "text-amber-600 bg-amber-50", baja: "text-red-600 bg-red-50" }[resultado.confianza];
  const d = resultado.datos;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const imagen_key = await subirImagenCliente(imagen);
      const res = await fetch("/api/solicitudes-capacitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: d.empresa, tema: d.tema, descripcion: d.descripcion,
          fecha_solicitada: d.fecha_solicitada, hora_inicio: d.hora_inicio,
          hora_fin: d.hora_fin, lugar: d.lugar, num_participantes: d.num_participantes,
          contacto: d.contacto, telefono: d.telefono, correo: d.correo,
          notas: nota || null, imagen_key,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al enviar."); return; }
      onEnviado();
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {/* Banner IA */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-800">Solicitud detectada</p>
          <p className="text-xs text-blue-600 mt-0.5">{resultado.descripcion_documento}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${confianzaColor}`}>
          {resultado.confianza}
        </span>
      </div>

      {/* Resumen extraído (solo lectura) */}
      <div className="p-4 bg-gray-50 rounded-xl space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Datos detectados (solo lectura)</p>
        <div className="flex items-center gap-2 text-sm overflow-hidden">
          <img src={imagen} alt="doc" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
          <div className="min-w-0">
            {d.empresa    && <p className="text-xs font-semibold text-gray-800 truncate">{d.empresa}</p>}
            {d.tema       && <p className="text-xs text-gray-600 truncate">{d.tema}</p>}
            {d.fecha_solicitada && <p className="text-xs text-gray-400">{new Date(d.fecha_solicitada + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>}
          </div>
        </div>
        {(d.hora_inicio || d.lugar || d.num_participantes) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {d.hora_inicio && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{d.hora_inicio}{d.hora_fin ? ` — ${d.hora_fin}` : ""}</span>}
            {d.lugar       && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{d.lugar}</span>}
            {d.num_participantes && <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{d.num_participantes} participantes</span>}
          </div>
        )}
        <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">
          El jefe revisará y completará los detalles antes de aprobar.
        </p>
      </div>

      {/* Nota del bombero */}
      <Campo label="Nota adicional (opcional)" icon={MessageSquare}>
        <textarea rows={3} value={nota} onChange={e => setNota(e.target.value)}
          placeholder="Agrega cualquier comentario o detalle relevante para el jefe..."
          className={`${inputCls} resize-none`} />
      </Campo>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

      <div className="flex gap-3">
        <button type="button" onClick={onReiniciar}
          className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Enviando..." : "Enviar solicitud al jefe"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────
   Flujo ADMIN — formulario completo
───────────────────────────────────────────── */
function FlujoAdmin({
  imagen, resultado, onReiniciar, onEnviado,
}: {
  imagen: string; resultado: ResultadoIA;
  onReiniciar: () => void; onEnviado: (id: number) => void;
}) {
  const d = resultado.datos;
  const [form, setForm] = useState({
    empresa: d.empresa ?? "", contacto: d.contacto ?? "", telefono: d.telefono ?? "",
    correo: d.correo ?? "", tema: d.tema ?? "", descripcion: d.descripcion ?? "",
    fecha_solicitada: d.fecha_solicitada ?? "", hora_inicio: d.hora_inicio ?? "",
    hora_fin: d.hora_fin ?? "", lugar: d.lugar ?? "",
    num_participantes: d.num_participantes?.toString() ?? "", notas: "",
  });
  const [entidades, setEntidades]       = useState<Entidad[]>([]);
  const [entidadId, setEntidadId]       = useState<number | null>(null);
  const [entidadSel, setEntidadSel]     = useState<Entidad | null>(null);
  const [busqEnt, setBusqEnt]           = useState("");
  const [mostrarDrop, setMostrarDrop]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => { fetch("/api/entidades").then(r => r.json()).then(setEntidades); }, []);
  useEffect(() => {
    if (!d.empresa || entidades.length === 0) return;
    const m = entidades.find(e => e.nombre.toLowerCase().includes(d.empresa!.toLowerCase()) || d.empresa!.toLowerCase().includes(e.nombre.toLowerCase()));
    if (m) { setEntidadId(m.id); setEntidadSel(m); }
  }, [entidades, d.empresa]);

  const entFilt = entidades.filter(e => e.nombre.toLowerCase().includes(busqEnt.toLowerCase()));
  function selEnt(e: Entidad) { setEntidadId(e.id); setEntidadSel(e); setBusqEnt(""); setMostrarDrop(false); setForm(f => ({ ...f, empresa: e.nombre })); }

  const confianzaColor = { alta: "text-green-600 bg-green-50", media: "text-amber-600 bg-amber-50", baja: "text-red-600 bg-red-50" }[resultado.confianza];

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tema.trim()) { setError("El tema de la capacitación es obligatorio."); return; }
    setError(""); setLoading(true);
    try {
      const imagen_key = await subirImagenCliente(imagen);
      const res = await fetch("/api/solicitudes-capacitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, num_participantes: form.num_participantes ? Number(form.num_participantes) : null, entidad_id: entidadId, imagen_key }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
      onEnviado(data.id);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleEnviar} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-800">Datos extraídos por IA — revisa y corrige</p>
          <p className="text-xs text-blue-600 mt-0.5 truncate">{resultado.descripcion_documento}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${confianzaColor}`}>{resultado.confianza}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
          <img src={imagen} alt="doc" className="w-full h-full object-cover" />
        </div>
        <p className="text-xs text-gray-500 flex-1">Puedes editar cualquier campo antes de guardar. Luego podrás agendar en el calendario y asignar efectivos.</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empresa / Institución</p>
        {entidadSel ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-sm text-gray-900 truncate">{entidadSel.nombre}</span>
            <span className="text-[10px] text-gray-400">{entidadSel.tipo}</span>
            <button type="button" onClick={() => { setEntidadId(null); setEntidadSel(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="relative">
            <input type="text" value={busqEnt} onChange={e => { setBusqEnt(e.target.value); setMostrarDrop(true); }}
              onFocus={() => setMostrarDrop(true)} placeholder="Buscar entidad registrada..." className={inputCls} />
            {mostrarDrop && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                {entFilt.slice(0, 6).map(e => (
                  <div key={e.id} onMouseDown={() => selEnt(e)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="flex-1 truncate">{e.nombre}</span>
                  </div>
                ))}
                {entFilt.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">Sin coincidencias — se guardará como texto</p>}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre empresa" icon={Building2}>
            <input type="text" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Nombre" className={inputCls} />
          </Campo>
          <Campo label="Contacto" icon={User}>
            <input type="text" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} placeholder="Nombre" className={inputCls} />
          </Campo>
          <Campo label="Teléfono" icon={Phone}>
            <input type="text" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="01-xxx" className={inputCls} />
          </Campo>
          <Campo label="Correo" icon={Mail}>
            <input type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="@" className={inputCls} />
          </Campo>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Solicitud</p>
        <Campo label="Tema *" icon={FileText}>
          <input type="text" required value={form.tema} onChange={e => setForm(f => ({ ...f, tema: e.target.value }))} placeholder="Ej: Primeros auxilios" className={inputCls} />
        </Campo>
        <Campo label="Descripción" icon={FileText}>
          <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalle..." className={`${inputCls} resize-none`} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha solicitada" icon={CalendarDays}>
            <input type="date" value={form.fecha_solicitada} onChange={e => setForm(f => ({ ...f, fecha_solicitada: e.target.value }))} className={inputCls} />
          </Campo>
          <Campo label="N.° participantes" icon={Users}>
            <input type="number" min="1" value={form.num_participantes} onChange={e => setForm(f => ({ ...f, num_participantes: e.target.value }))} placeholder="0" className={inputCls} />
          </Campo>
          <Campo label="Hora inicio" icon={Clock}>
            <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
          </Campo>
          <Campo label="Hora fin" icon={Clock}>
            <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
          </Campo>
        </div>
        <Campo label="Lugar" icon={MapPin}>
          <input type="text" value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Lugar propuesto" className={inputCls} />
        </Campo>
        <Campo label="Notas" icon={MessageSquare}>
          <textarea rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones..." className={`${inputCls} resize-none`} />
        </Campo>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onReiniciar} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Guardando..." : "Guardar solicitud"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────
   Éxito genérico
───────────────────────────────────────────── */
function PasoExito({ esAdmin, onReiniciar, onAgendar }: { esAdmin: boolean; onReiniciar: () => void; onAgendar?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900">{esAdmin ? "¡Solicitud guardada!" : "¡Solicitud enviada al jefe!"}</p>
        <p className="text-sm text-gray-500 mt-1">
          {esAdmin ? "Ahora puedes agendar la capacitación en el calendario y asignar efectivos." : "El jefe de compañía revisará la solicitud y la aprobará."}
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {esAdmin && onAgendar && (
          <button onClick={onAgendar}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg">
            <CalendarDays className="w-4 h-4" /> Agendar en el calendario
          </button>
        )}
        <button onClick={onReiniciar}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
          <ScanLine className="w-4 h-4" /> Escanear otro documento
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modal Agendar
───────────────────────────────────────────── */
function ModalAgendar({ solicitudId, datos, onClose, onAgendado }: {
  solicitudId: number;
  datos: { tema: string; empresa: string | null; fecha_solicitada: string | null; hora_inicio: string | null; hora_fin: string | null; lugar: string | null; entidad_id: number | null; };
  onClose: () => void; onAgendado: () => void;
}) {
  const [bomberos, setBomberos]       = useState<Bombero[]>([]);
  const [seleccionados, setSel]       = useState<number[]>([]);
  const [busqueda, setBusqueda]       = useState("");
  const [fecha, setFecha]             = useState(datos.fecha_solicitada ?? "");
  const [hIni, setHIni]               = useState(datos.hora_inicio ?? "");
  const [hFin, setHFin]               = useState(datos.hora_fin ?? "");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => { fetch("/api/bomberos").then(r => r.json()).then(setBomberos); }, []);

  const filtrados = bomberos.filter(b => `${b.apellidos} ${b.nombres} ${b.codigo}`.toLowerCase().includes(busqueda.toLowerCase()));

  async function handleAgendar(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha) { setError("La fecha es obligatoria."); return; }
    if (seleccionados.length === 0) { setError("Selecciona al menos un bombero."); return; }
    setError(""); setLoading(true);
    try {
      const resAct = await fetch("/api/programacion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha, tipo: "Capacitación externa", descripcion: datos.tema,
          lugar: datos.lugar ?? "", es_capacitacion: true,
          hora_inicio: hIni || null, hora_fin: hFin || null,
          efectivos_asistentes: seleccionados.length,
          entidad_id: datos.entidad_id ?? null, participantes: seleccionados,
        }),
      });
      const actData = await resAct.json();
      if (!resAct.ok) { setError(actData.error ?? "Error al crear actividad."); return; }
      await fetch(`/api/solicitudes-capacitacion/${solicitudId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "APROBADA", actividad_id: actData.id }),
      });
      onAgendado();
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /><h2 className="text-base font-bold">Agendar capacitación</h2></div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleAgendar} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-semibold text-blue-800">{datos.tema}</p>
              {datos.empresa && <p className="text-xs text-blue-600 mt-0.5">{datos.empresa}</p>}
            </div>
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha *</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
                <input type="time" value={hIni} onChange={e => setHIni(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
                <input type="time" value={hFin} onChange={e => setHFin(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Efectivos <span className="ml-1 text-red-600 font-bold">{seleccionados.length} seleccionados</span></p>
                <button type="button" onClick={() => seleccionados.length === filtrados.length ? setSel([]) : setSel(filtrados.map(b => b.id))}
                  className="text-xs text-red-700 hover:underline font-medium">
                  {seleccionados.length === filtrados.length ? "Deseleccionar todos" : "Todos"}
                </button>
              </div>
              <input type="text" placeholder="Buscar bombero..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={`${inputCls} mb-2`} />
              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-52 divide-y divide-gray-50">
                {filtrados.map(b => {
                  const sel = seleccionados.includes(b.id);
                  return (
                    <div key={b.id} onClick={() => setSel(prev => sel ? prev.filter(x => x !== b.id) : [...prev, b.id])}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${sel ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-red-600 border-red-600" : "border-gray-300"}`}>
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
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              {loading ? "Agendando..." : "Confirmar y agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Panel de solicitudes pendientes (solo admin)
───────────────────────────────────────────── */
const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  APROBADA:  "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-600",
};

function PanelSolicitudes({ onAgendar }: { onAgendar: (s: Solicitud) => void }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [expandida, setExpandida]     = useState<number | null>(null);
  const [editando, setEditando]       = useState<number | null>(null);

  function cargar() {
    setCargando(true);
    fetch("/api/solicitudes-capacitacion").then(r => r.json())
      .then(data => { setSolicitudes(Array.isArray(data) ? data : []); setCargando(false); })
      .catch(() => setCargando(false));
  }
  useEffect(() => { cargar(); }, []);

  const pendientes = solicitudes.filter(s => s.estado === "PENDIENTE");
  const resto      = solicitudes.filter(s => s.estado !== "PENDIENTE");

  if (cargando) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  if (solicitudes.length === 0) return (
    <div className="text-center py-10 text-gray-400">
      <InboxIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">Sin solicitudes aún.</p>
    </div>
  );

  function TarjetaSolicitud({ s }: { s: Solicitud }) {
    const abierta = expandida === s.id;
    const [formEdit, setFormEdit] = useState({ tema: s.tema ?? "", empresa: s.empresa ?? "", fecha_solicitada: s.fecha_solicitada ?? "", hora_inicio: s.hora_inicio ?? "", hora_fin: s.hora_fin ?? "", lugar: s.lugar ?? "", num_participantes: s.num_participantes?.toString() ?? "", notas: s.notas ?? "", contacto: s.contacto ?? "", telefono: s.telefono ?? "", correo: s.correo ?? "" });
    const [guardando, setGuardando] = useState(false);

    async function guardarEdicion() {
      setGuardando(true);
      await fetch(`/api/solicitudes-capacitacion/${s.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formEdit, num_participantes: formEdit.num_participantes ? Number(formEdit.num_participantes) : null }),
      });
      setGuardando(false); setEditando(null); cargar();
    }

    async function rechazar() {
      if (!confirm("¿Rechazar esta solicitud?")) return;
      await fetch(`/api/solicitudes-capacitacion/${s.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "RECHAZADA" }),
      });
      cargar();
    }

    const esEditar = editando === s.id;

    return (
      <div className={`border rounded-xl overflow-hidden transition-all ${s.estado === "PENDIENTE" ? "border-amber-200 bg-amber-50/30" : "border-gray-200 bg-white"}`}>
        {/* Cabecera */}
        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandida(abierta ? null : s.id)}>
          {/* Miniatura de imagen */}
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
            {s.imagen_url
              ? <img src={s.imagen_url} alt="doc" className="w-full h-full object-cover" />
              : <FileText className="w-5 h-5 text-gray-300" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 text-gray-500"}`}>{s.estado}</span>
              {s.subido_por_rol === "BOMBERO"
                ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Bombero</span>
                : <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Admin</span>
              }
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{s.tema ?? "Sin tema"}</p>
            {s.empresa && <p className="text-xs text-gray-500 truncate">{s.empresa}</p>}
            {/* Quién subió + fecha */}
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3 shrink-0" />
              <span className="font-medium text-gray-500">{s.subido_por_nombre ?? "Desconocido"}</span>
              <span>·</span>
              <span>{new Date(s.creado_en).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
              {s.fecha_solicitada && <><span>·</span><CalendarDays className="w-3 h-3 shrink-0" /><span>{new Date(s.fecha_solicitada + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span></>}
            </p>
          </div>
          {abierta ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
        </div>

        {/* Detalle expandido */}
        {abierta && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3">
            {esEditar ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editando</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Tema</label>
                    <input type="text" value={formEdit.tema} onChange={e => setFormEdit(f => ({ ...f, tema: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Empresa</label>
                    <input type="text" value={formEdit.empresa} onChange={e => setFormEdit(f => ({ ...f, empresa: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Fecha</label>
                    <input type="date" value={formEdit.fecha_solicitada} onChange={e => setFormEdit(f => ({ ...f, fecha_solicitada: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Participantes</label>
                    <input type="number" value={formEdit.num_participantes} onChange={e => setFormEdit(f => ({ ...f, num_participantes: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Hora inicio</label>
                    <input type="time" value={formEdit.hora_inicio} onChange={e => setFormEdit(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Hora fin</label>
                    <input type="time" value={formEdit.hora_fin} onChange={e => setFormEdit(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Lugar</label>
                    <input type="text" value={formEdit.lugar} onChange={e => setFormEdit(f => ({ ...f, lugar: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Notas</label>
                    <textarea rows={2} value={formEdit.notas} onChange={e => setFormEdit(f => ({ ...f, notas: e.target.value }))} className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditando(null)} className="flex-1 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={guardarEdicion} disabled={guardando}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                    {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Imagen del documento */}
                {s.imagen_url && (
                  <a href={s.imagen_url} target="_blank" rel="noopener noreferrer"
                    className="block w-full rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                    <img src={s.imagen_url} alt="Documento original" className="w-full max-h-64 object-contain bg-gray-50" />
                    <p className="text-center text-[10px] text-gray-400 py-1 bg-gray-50 border-t border-gray-100">Ver imagen completa</p>
                  </a>
                )}
                {/* Quién subió */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${s.subido_por_rol === "BOMBERO" ? "bg-blue-600" : "bg-purple-600"}`}>
                    {(s.subido_por_nombre ?? "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{s.subido_por_nombre ?? "Desconocido"}</p>
                    <p className="text-[10px] text-gray-400">{s.subido_por_rol === "BOMBERO" ? "Bombero" : "Administración"} · Enviado {new Date(s.creado_en).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {s.contacto   && <p className="text-gray-500"><span className="font-semibold text-gray-700">Contacto:</span> {s.contacto}</p>}
                  {s.telefono   && <p className="text-gray-500"><span className="font-semibold text-gray-700">Tel:</span> {s.telefono}</p>}
                  {s.correo     && <p className="text-gray-500 col-span-2"><span className="font-semibold text-gray-700">Correo:</span> {s.correo}</p>}
                  {s.hora_inicio && <p className="text-gray-500"><span className="font-semibold text-gray-700">Horario:</span> {s.hora_inicio}{s.hora_fin ? ` — ${s.hora_fin}` : ""}</p>}
                  {s.lugar      && <p className="text-gray-500"><span className="font-semibold text-gray-700">Lugar:</span> {s.lugar}</p>}
                  {s.num_participantes && <p className="text-gray-500"><span className="font-semibold text-gray-700">Participantes:</span> {s.num_participantes}</p>}
                  {s.descripcion && <p className="text-gray-500 col-span-2"><span className="font-semibold text-gray-700">Descripción:</span> {s.descripcion}</p>}
                  {s.notas      && <p className="text-gray-500 col-span-2 italic"><span className="font-semibold not-italic text-gray-700">Nota:</span> {s.notas}</p>}
                </div>

                {s.estado === "PENDIENTE" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditando(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button onClick={() => onAgendar(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg">
                      <CalendarDays className="w-3 h-3" /> Aprobar y agendar
                    </button>
                    <button onClick={rechazar}
                      className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                      Rechazar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 text-[10px] font-bold flex items-center justify-center">{pendientes.length}</span>
            Pendientes de aprobación
          </p>
          {pendientes.map(s => <TarjetaSolicitud key={s.id} s={s} />)}
        </div>
      )}
      {resto.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historial</p>
          {resto.map(s => <TarjetaSolicitud key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente raíz
───────────────────────────────────────────── */
export function EscanerDocumento({ esAdmin }: { esAdmin: boolean }) {
  type Paso = "captura" | "analizando" | "noEsSolicitud" | "confirmar" | "exito" | "agendado";

  const [paso, setPaso]         = useState<Paso>("captura");
  const [imagen, setImagen]     = useState<string | null>(null);
  const [resultado, setRes]     = useState<ResultadoIA | null>(null);
  const [solicitudId, setSolId] = useState<number | null>(null);
  const [solicitudAgendar, setSolicitudAgendar] = useState<Solicitud | null>(null);
  const [errorGlobal, setErrorGlobal]           = useState("");
  const [tab, setTab]           = useState<"escanear" | "solicitudes">("escanear");

  async function handleImagen(dataUrl: string) {
    setImagen(dataUrl); setPaso("analizando"); setErrorGlobal("");
    try {
      const res = await fetch("/api/analizar-documento", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: dataUrl }),
      });
      const data: ResultadoIA = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Error");
      setRes(data);
      setPaso(data.es_solicitud_capacitacion ? "confirmar" : "noEsSolicitud");
    } catch (e: unknown) {
      setErrorGlobal(e instanceof Error ? e.message : "Error al analizar el documento.");
      setPaso("captura");
    }
  }

  function reiniciar() { setPaso("captura"); setImagen(null); setRes(null); setSolId(null); setErrorGlobal(""); }

  const escaneando = paso !== "captura" && paso !== "agendado";

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Tabs (solo admin) */}
      {esAdmin && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["escanear", "solicitudes"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "escanear" ? "Escanear documento" : "Solicitudes recibidas"}
            </button>
          ))}
        </div>
      )}

      {/* Tab Escanear */}
      {(tab === "escanear" || !esAdmin) && (
        <>
          {/* Indicador de pasos */}
          {escaneando && (
            <div className="flex items-center gap-1">
              {[{ key: "captura", label: "Captura" }, { key: "confirmar", label: "Revisar" }, { key: "exito", label: esAdmin ? "Guardar" : "Enviar" }].map((s, i) => {
                const orden = ["captura", "analizando", "noEsSolicitud", "confirmar", "exito"];
                const activo = orden.indexOf(paso) >= orden.indexOf(s.key);
                return (
                  <div key={s.key} className="flex items-center gap-1 flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${activo ? "bg-red-600 text-white" : "bg-gray-200 text-gray-400"}`}>{i + 1}</div>
                    <span className={`text-xs font-medium ${activo ? "text-red-700" : "text-gray-400"}`}>{s.label}</span>
                    {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
                  </div>
                );
              })}
            </div>
          )}

          {errorGlobal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{errorGlobal}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${paso === "confirmar" ? "overflow-y-auto max-h-[calc(100vh-11rem)]" : ""} p-5`}>
              {paso === "captura"       && <PasoCaptura onImagen={handleImagen} />}
              {paso === "analizando"    && imagen && <PasoAnalizando imagen={imagen} />}
              {paso === "noEsSolicitud" && resultado && <PasoNoEsSolicitud resultado={resultado} onReiniciar={reiniciar} />}
              {paso === "confirmar"     && resultado && imagen && (
                esAdmin
                  ? <FlujoAdmin resultado={resultado} imagen={imagen} onReiniciar={reiniciar} onEnviado={id => { setSolId(id); setPaso("exito"); }} />
                  : <FlujoBombero resultado={resultado} imagen={imagen} onReiniciar={reiniciar} onEnviado={() => setPaso("exito")} />
              )}
              {paso === "exito" && (
                <PasoExito
                  esAdmin={esAdmin}
                  onReiniciar={reiniciar}
                  onAgendar={esAdmin && solicitudId ? () => {
                    const s = resultado?.datos;
                    if (!s) return;
                    setSolicitudAgendar({ id: solicitudId!, estado: "PENDIENTE", empresa: s.empresa, tema: s.tema, fecha_solicitada: s.fecha_solicitada, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin, lugar: s.lugar, num_participantes: s.num_participantes, contacto: s.contacto, telefono: s.telefono, correo: s.correo, descripcion: s.descripcion, notas: null, entidad_id: null, entidad_nombre: null, subido_por_rol: null, subido_por_nombre: null, imagen_key: null, imagen_url: null, creado_en: new Date().toISOString() });
                  } : undefined}
                />
              )}
              {paso === "agendado" && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">¡Agendado en el calendario!</p>
                    <p className="text-sm text-gray-500 mt-1">La capacitación aparece en Programación con los efectivos asignados.</p>
                  </div>
                  <button onClick={reiniciar} className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800">
                    <ScanLine className="w-4 h-4" /> Escanear otro
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab Solicitudes (solo admin) */}
      {esAdmin && tab === "solicitudes" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 overflow-y-auto max-h-[calc(100vh-11rem)]">
          <PanelSolicitudes onAgendar={s => setSolicitudAgendar(s)} />
        </div>
      )}

      {/* Modal agendar */}
      {solicitudAgendar && (
        <ModalAgendar
          solicitudId={solicitudAgendar.id}
          datos={{ tema: solicitudAgendar.tema ?? "Capacitación", empresa: solicitudAgendar.empresa, fecha_solicitada: solicitudAgendar.fecha_solicitada, hora_inicio: solicitudAgendar.hora_inicio, hora_fin: solicitudAgendar.hora_fin, lugar: solicitudAgendar.lugar, entidad_id: solicitudAgendar.entidad_id }}
          onClose={() => setSolicitudAgendar(null)}
          onAgendado={() => { setSolicitudAgendar(null); if (tab === "escanear") setPaso("agendado"); else { /* recargar panel */ setTab("escanear"); setTimeout(() => setTab("solicitudes"), 50); } }}
        />
      )}
    </div>
  );
}

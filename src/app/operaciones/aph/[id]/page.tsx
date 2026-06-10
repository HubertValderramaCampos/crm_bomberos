"use client";
import { ROLES_JEFE } from "@/lib/roles";

import { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, CheckCircle2, ChevronLeft,
  UserPlus, X, Search, Users,
} from "lucide-react";

/* ─── Secciones ─────────────────────────────────────────── */
const SECCIONES = {
  sec_salida: {
    titulo: "I. Salida y Protección Personal",
    items: [
      "Tiempo de salida adecuado",
      "Distribución previa de funciones",
      "Uso correcto de EPP",
      "Conducta y disciplina durante el trayecto",
      "Tipo de conducción segura y preventiva",
      "Verificación de equipos antes de salida",
      "Preparación operativa del personal",
    ],
  },
  sec_escena: {
    titulo: "II. Escena y Comunicación",
    items: [
      "Evaluación inicial de la escena",
      "Identificación de riesgos",
      "Seguridad de la escena antes de ingresar",
      "Uso adecuado de equipos",
      "Comunicación efectiva entre el personal",
      "Organización y distribución de funciones",
      "Manejo adecuado del estrés",
      "Solicitud de apoyo oportuno",
      "Comunicación con central / hospital",
      "Mantenimiento del liderazgo operativo",
    ],
  },
  sec_atencion_eval: {
    titulo: "III-A. Evaluación Clínica",
    items: [
      "Realiza evaluación primaria correcta",
      "Realiza evaluación secundaria adecuada",
      "Reconoce signos de gravedad",
      "Prioriza adecuadamente la atención",
      "Reevaluación continua del paciente",
      "Aplicación correcta de protocolos APH",
      "Toma adecuada de decisiones clínicas",
    ],
  },
  sec_atencion_proc: {
    titulo: "III-B. Intervenciones y Procedimientos",
    items: [
      "Manejo adecuado de vía aérea",
      "Oxigenoterapia correcta",
      "Control de hemorragias",
      "Inmovilización adecuada",
      "Monitorización del paciente",
      "Administración correcta de medicamentos",
      "Bioseguridad durante procedimientos",
    ],
  },
  sec_atencion_com: {
    titulo: "III-C. Comunicación y Trato Humanizado",
    items: [
      "Trato respetuoso y empático",
      "Explica procedimientos al paciente",
      "Manejo emocional del paciente",
      "Comunicación con familiares",
      "Respeto de privacidad y dignidad",
      "Trabajo en equipo durante la atención",
    ],
  },
  sec_transporte: {
    titulo: "IV. Transporte y Entrega Hospitalaria",
    items: [
      "Traslado seguro del paciente",
      "Monitoreo continuo durante transporte",
      "Comunicación previa con hospital receptor",
      "Entrega verbal clara y completa",
      "Registro de datos relevantes",
      "Coordinación adecuada con personal receptor",
    ],
  },
  sec_reacondiciona: {
    titulo: "V. Reacondicionamiento",
    items: [
      "Eliminación adecuada de residuos biocontaminados",
      "Limpieza y desinfección de equipos",
      "Reposición de materiales utilizados",
      "Reacondicionamiento operativo de la unidad",
      "Verificación final de equipos",
    ],
  },
  sec_documentacion: {
    titulo: "VI. Documentación y Registro",
    items: [
      "Registro completo del paciente",
      "SOAP correctamente elaborado",
      "Registro de signos vitales",
      "Registro de medicamentos administrados",
      "Registro de horarios y procedimientos",
      "Firmas y datos completos",
    ],
  },
} as const;

type SecKey = keyof typeof SECCIONES;
const SEC_KEYS = Object.keys(SECCIONES) as SecKey[];

const CLASIFICACIONES = [
  "Operador competente",
  "Operador en entrenamiento",
  "Requiere reforzamiento",
  "No apto temporalmente",
];

interface ItemSec { puntaje: number; obs: string; }
type SeccionData = ItemSec[];

interface EvaluadoData {
  bombero_id: number;
  apellidos: string; nombres: string; grado: string; codigo: string;
  secs: Record<SecKey, SeccionData>;
  obs_generales: string;
  conclusiones: string;
  clasificacion_final: string;
}

interface EvalDetalle {
  id: number; completada: boolean; emergencia_id: number;
  numero_parte: string; emerg_tipo: string; emerg_fecha: string;
  emerg_distrito: string | null; emerg_hora_despacho: string | null;
  emerg_hora_salida: string | null; emerg_hora_llegada: string | null;
  emerg_tipo_desc: string | null; emerg_direccion: string | null;
  evaluador_nombre: string; evaluador_grado: string;
  evaluador_bombero_id: number;
  hora_activacion: string | null; hora_salida: string | null;
  hora_llegada_escena: string | null; hora_traslado: string | null;
  hora_entrega_hosp: string | null;
  tipo_emergencia_desc: string | null; lugar_atencion: string | null;
  evaluados: {
    id: number; bombero_id: number; apellidos: string; nombres: string;
    grado: string; codigo: string; clasificacion_final: string | null;
    [key: string]: unknown;
  }[];
  // IDs de efectivos que salieron al parte (solo cuando se puede editar)
  efectivos_parte: { bombero_id: number }[];
}

interface Bombero { id: number; apellidos: string; nombres: string; grado: string; codigo: string; }

/* ─── Helpers ───────────────────────────────────────────── */
function initSec(items: readonly string[]): SeccionData {
  return items.map(() => ({ puntaje: 0, obs: "" }));
}
function initSecs(): Record<SecKey, SeccionData> {
  return Object.fromEntries(SEC_KEYS.map(k => [k, initSec(SECCIONES[k].items)])) as Record<SecKey, SeccionData>;
}
function puntajeSec(sec: SeccionData) { return sec.reduce((s, i) => s + i.puntaje, 0); }
function maxSec(items: readonly string[]) { return items.length * 5; }

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

/* ─── Sección individual ────────────────────────────────── */
function SeccionForm({ titulo, items, data, onChange, soloLectura }: {
  titulo: string; items: readonly string[];
  data: SeccionData; onChange: (d: SeccionData) => void; soloLectura: boolean;
}) {
  const parcial = puntajeSec(data);
  const maximo  = maxSec(items);
  const pct     = maximo > 0 ? Math.round((parcial / maximo) * 100) : 0;

  function set(idx: number, field: "puntaje" | "obs", val: string | number) {
    onChange(data.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-700 text-white flex items-center justify-between">
        <h3 className="text-xs font-bold">{titulo}</h3>
        <span className="text-xs text-white/80">{parcial}/{maximo} · {pct}%</span>
      </div>
      <div className="h-1 bg-gray-100">
        <div className={`h-1 ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((criterio, idx) => (
          <div key={idx} className="px-4 py-2.5 grid grid-cols-[1fr_auto] gap-3 items-start">
            <div>
              <p className="text-xs font-medium text-gray-700">{idx + 1}. {criterio}</p>
              {!soloLectura ? (
                <input type="text" value={data[idx]?.obs ?? ""} onChange={e => set(idx, "obs", e.target.value)}
                  placeholder="Observación (opcional)"
                  className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-red-400 text-gray-600" />
              ) : (
                data[idx]?.obs && <p className="mt-0.5 text-xs text-gray-500 italic">{data[idx].obs}</p>
              )}
            </div>
            {soloLectura ? (
              <span className={`text-lg font-bold ${(data[idx]?.puntaje ?? 0) >= 4 ? "text-green-600" : (data[idx]?.puntaje ?? 0) >= 3 ? "text-blue-600" : (data[idx]?.puntaje ?? 0) >= 2 ? "text-amber-600" : "text-red-600"}`}>
                {data[idx]?.puntaje || "—"}
              </span>
            ) : (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => set(idx, "puntaje", n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${(data[idx]?.puntaje ?? 0) === n ? "bg-red-700 text-white" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Panel de un evaluado ──────────────────────────────── */
function EvaluadoPanel({ ev, onChange, soloLectura }: {
  ev: EvaluadoData; onChange: (e: EvaluadoData) => void; soloLectura: boolean;
}) {
  const totalObt = SEC_KEYS.reduce((s, k) => s + puntajeSec(ev.secs[k]), 0);
  const totalMax = SEC_KEYS.reduce((s, k) => s + maxSec(SECCIONES[k].items), 0);
  const pct      = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;

  function interp() {
    if (pct >= 90) return { t: "Excelente desempeño",           cls: "text-green-700 bg-green-50 border-green-200" };
    if (pct >= 75) return { t: "Buen desempeño",                cls: "text-blue-700 bg-blue-50 border-blue-200"   };
    if (pct >= 60) return { t: "Desempeño regular",             cls: "text-amber-700 bg-amber-50 border-amber-200"};
    return             { t: "Requiere reforzamiento inmediato", cls: "text-red-700 bg-red-50 border-red-200"       };
  }
  const { t, cls } = interp();

  return (
    <div className="space-y-4">
      {/* Secciones */}
      {SEC_KEYS.map(k => (
        <SeccionForm key={k} titulo={SECCIONES[k].titulo} items={SECCIONES[k].items}
          data={ev.secs[k]} soloLectura={soloLectura}
          onChange={d => onChange({ ...ev, secs: { ...ev.secs, [k]: d } })} />
      ))}

      {/* Resultado */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Resultado</h3>
          <span className="text-xl font-bold text-gray-900">{pct}% <span className="text-sm text-gray-400">({totalObt}/{totalMax})</span></span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-2.5 rounded-full ${pct>=90?"bg-green-500":pct>=75?"bg-blue-500":pct>=60?"bg-amber-400":"bg-red-500"}`} style={{width:`${pct}%`}} />
        </div>
        <div className={`px-3 py-2 rounded-lg border text-xs font-semibold ${cls}`}>{t}</div>

        {/* Observaciones */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones generales</label>
          {soloLectura ? <p className="text-sm text-gray-700">{ev.obs_generales || "—"}</p>
            : <textarea value={ev.obs_generales} onChange={e => onChange({ ...ev, obs_generales: e.target.value })}
                rows={2} className={inputCls + " w-full resize-none"} />}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Conclusiones y recomendaciones</label>
          {soloLectura ? <p className="text-sm text-gray-700">{ev.conclusiones || "—"}</p>
            : <textarea value={ev.conclusiones} onChange={e => onChange({ ...ev, conclusiones: e.target.value })}
                rows={2} className={inputCls + " w-full resize-none"} />}
        </div>

        {/* Clasificación */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Clasificación final</label>
          {soloLectura ? <p className="text-sm font-bold text-gray-900">{ev.clasificacion_final || "—"}</p>
            : (
              <div className="grid grid-cols-2 gap-2">
                {CLASIFICACIONES.map(c => (
                  <label key={c} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-xs transition-colors ${ev.clasificacion_final === c ? "bg-red-700 text-white border-red-700 font-semibold" : "border-gray-200 text-gray-700 hover:border-red-300"}`}>
                    <input type="radio" checked={ev.clasificacion_final === c} onChange={() => onChange({ ...ev, clasificacion_final: c })} className="sr-only" />
                    {c}
                  </label>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/* ─── Página ────────────────────────────────────────────── */
export default function AphFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [eval_,    setEval]    = useState<EvalDetalle | null>(null);
  const [loading,  setLoading] = useState(true);
  const [guardando,setGuard]   = useState(false);
  const [guardado, setGuardado]= useState(false);
  const [error,    setError]   = useState("");

  // Datos generales
  const [horaAct,  setHoraAct]  = useState("");
  const [horaSal,  setHoraSal]  = useState("");
  const [horaLleg, setHoraLleg] = useState("");
  const [horaTras, setHoraTras] = useState("");
  const [horaEntH, setHoraEntH] = useState("");
  const [tipoDesc, setTipoDesc] = useState("");
  const [lugar,    setLugar]    = useState("");

  // Evaluados
  const [evaluados, setEvaluados] = useState<EvaluadoData[]>([]);
  const [tabIdx,    setTabIdx]    = useState(0);

  // Modal agregar bombero
  const [modalAgregar,  setModalAgregar]  = useState(false);
  const [bomberosTodos, setBomberosTodos] = useState<Bombero[]>([]);
  const [busqAgregar,   setBusqAgregar]   = useState("");

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/aph/${id}`);
      const data = await res.json() as EvalDetalle & { error?: string };
      if (data.error) { setError(data.error); setLoading(false); return; }
      setEval(data);
      // Pre-llenar desde el parte si el evaluador aún no ha guardado el campo
      setHoraAct(data.hora_activacion?.slice(0,5) ?? data.emerg_hora_despacho?.slice(11,16) ?? "");
      setHoraSal(data.hora_salida?.slice(0,5)     ?? data.emerg_hora_salida?.slice(11,16)   ?? "");
      setHoraLleg(data.hora_llegada_escena?.slice(0,5) ?? data.emerg_hora_llegada?.slice(11,16) ?? "");
      setHoraTras(data.hora_traslado?.slice(0,5) ?? "");
      setHoraEntH(data.hora_entrega_hosp?.slice(0,5) ?? "");
      setTipoDesc(data.tipo_emergencia_desc ?? data.emerg_tipo_desc ?? data.emerg_tipo ?? "");
      setLugar(data.lugar_atencion ?? data.emerg_direccion ?? "");
      setEvaluados((data.evaluados ?? []).map(ev => ({
        bombero_id: ev.bombero_id,
        apellidos: ev.apellidos, nombres: ev.nombres,
        grado: ev.grado, codigo: ev.codigo,
        secs: Object.fromEntries(
          SEC_KEYS.map(k => [k, (ev[k] as SeccionData | null) ?? initSec(SECCIONES[k].items)])
        ) as Record<SecKey, SeccionData>,
        obs_generales: (ev.obs_generales as string) ?? "",
        conclusiones: (ev.conclusiones as string) ?? "",
        clasificacion_final: (ev.clasificacion_final as string) ?? "",
      })));
    } catch {
      setError("Error al cargar la evaluación");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const esJefe     = ROLES_JEFE.includes(session?.user?.rol ?? "");
  const esEvaluador= Number(session?.user?.bomberoId) === Number(eval_?.evaluador_bombero_id);
  const puedeEditar= (esEvaluador || esJefe) && !eval_?.completada;
  const soloLectura= !puedeEditar;

  async function abrirAgregar() {
    setModalAgregar(true); setBusqAgregar("");
    // Solo mostrar efectivos que salieron al parte (ya vienen en eval_.efectivos_parte)
    if (eval_?.efectivos_parte?.length) {
      const ids = eval_.efectivos_parte.map(e => e.bombero_id);
      const data = await fetch("/api/bomberos").then(r => r.json());
      const todos: Bombero[] = Array.isArray(data) ? data : [];
      setBomberosTodos(todos.filter(b => ids.includes(b.id)));
    } else {
      setBomberosTodos([]);
    }
  }

  function agregarEvaluado(b: Bombero) {
    if (evaluados.find(e => e.bombero_id === b.id)) return;
    const nuevo: EvaluadoData = {
      bombero_id: b.id, apellidos: b.apellidos, nombres: b.nombres,
      grado: b.grado, codigo: b.codigo,
      secs: initSecs(), obs_generales: "", conclusiones: "", clasificacion_final: "",
    };
    setEvaluados(prev => [...prev, nuevo]);
    setTabIdx(evaluados.length);
    setModalAgregar(false);
  }

  function quitarEvaluado(idx: number) {
    if (!confirm("¿Quitar este evaluado?")) return;
    setEvaluados(prev => prev.filter((_, i) => i !== idx));
    setTabIdx(t => Math.max(0, t - 1));
  }

  async function guardar(completar = false) {
    setGuard(true); setError("");
    const res = await fetch(`/api/aph/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hora_activacion: horaAct||null, hora_salida: horaSal||null,
        hora_llegada_escena: horaLleg||null, hora_traslado: horaTras||null,
        hora_entrega_hosp: horaEntH||null,
        tipo_emergencia_desc: tipoDesc||null, lugar_atencion: lugar||null,
        evaluados: evaluados.map(ev => ({
          bombero_id: ev.bombero_id, ...ev.secs,
          obs_generales: ev.obs_generales||null,
          conclusiones: ev.conclusiones||null,
          clasificacion_final: ev.clasificacion_final||null,
        })),
        completada: completar,
      }),
    });
    setGuard(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar"); return; }
    setGuardado(true); setTimeout(() => setGuardado(false), 3000);
    if (completar) cargar();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-red-700" /></div>;
  if (error && !eval_) return (
    <div className="flex flex-col items-center justify-center h-60 gap-3">
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">← Volver</button>
    </div>
  );

  const yaIds = new Set(evaluados.map(e => e.bombero_id));
  const filtradosAgregar = bomberosTodos.filter(b =>
    !yaIds.has(b.id) && `${b.apellidos} ${b.nombres} ${b.codigo}`.toLowerCase().includes(busqAgregar.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Evaluación de Emergencia</h1>
          <p className="text-sm text-gray-400">Parte {eval_?.numero_parte} · {eval_?.emerg_fecha}</p>
        </div>
        {eval_?.completada && (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completada
          </span>
        )}
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-800 text-white flex items-center justify-between">
          <h2 className="text-sm font-bold">Datos Generales</h2>
          <div className="text-xs text-white/70">
            Evaluador: <span className="text-white font-medium">{eval_?.evaluador_nombre}</span>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Activación",      val: horaAct,  set: setHoraAct  },
              { label: "Salida",          val: horaSal,  set: setHoraSal  },
              { label: "Llegada escena",  val: horaLleg, set: setHoraLleg },
              { label: "Traslado",        val: horaTras, set: setHoraTras },
              { label: "Entrega hosp.",   val: horaEntH, set: setHoraEntH },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                {puedeEditar
                  ? <input type="time" value={val} onChange={e => set(e.target.value)} className={inputCls + " w-full"} />
                  : <p className="text-sm font-medium">{val || "—"}</p>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de emergencia</label>
              {puedeEditar
                ? <input type="text" value={tipoDesc} onChange={e => setTipoDesc(e.target.value)} placeholder={eval_?.emerg_tipo ?? ""} className={inputCls + " w-full"} />
                : <p className="text-sm font-medium">{tipoDesc || eval_?.emerg_tipo || "—"}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lugar de atención</label>
              {puedeEditar
                ? <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder={eval_?.emerg_distrito ?? ""} className={inputCls + " w-full"} />
                : <p className="text-sm font-medium">{lugar || eval_?.emerg_distrito || "—"}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Evaluados — tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Personal evaluado</h2>
            <span className="text-xs text-gray-400">({evaluados.length})</span>
          </div>
          {puedeEditar && (
            <button onClick={abrirAgregar}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Agregar efectivo
            </button>
          )}
        </div>

        {evaluados.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Sin evaluados.</p>
            {puedeEditar && <p className="text-xs text-gray-400 mt-1">Agrega los efectivos que participaron en la emergencia.</p>}
          </div>
        ) : (
          <>
            {/* Tabs de evaluados */}
            <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50">
              {evaluados.map((ev, idx) => (
                <button key={ev.bombero_id} onClick={() => setTabIdx(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${tabIdx === idx ? "border-red-600 text-red-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${ev.clasificacion_final ? "bg-green-500" : "bg-gray-300"}`} />
                  {ev.apellidos.split(",")[0].trim()}
                  {puedeEditar && (
                    <span onClick={e => { e.stopPropagation(); quitarEvaluado(idx); }}
                      className="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel del evaluado activo */}
            {evaluados[tabIdx] && (
              <div className="p-4">
                <div className="mb-4 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700 shrink-0">
                    {evaluados[tabIdx].apellidos[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {evaluados[tabIdx].apellidos.split(",")[0]}, {evaluados[tabIdx].nombres.split(" ")[0]}
                    </p>
                    <p className="text-xs text-gray-400">{evaluados[tabIdx].grado} · {evaluados[tabIdx].codigo}</p>
                  </div>
                </div>
                <EvaluadoPanel
                  ev={evaluados[tabIdx]}
                  soloLectura={soloLectura}
                  onChange={updated => setEvaluados(prev => prev.map((e, i) => i === tabIdx ? updated : e))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Botones */}
      {puedeEditar && (
        <div className="flex gap-3 sticky bottom-4">
          <button onClick={() => guardar(false)} disabled={guardando}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {guardado ? "✓ Guardado" : "Guardar borrador"}
          </button>
          <button onClick={() => guardar(true)} disabled={guardando || evaluados.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Completar evaluación
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {/* Modal agregar evaluado */}
      {modalAgregar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Agregar efectivo</h2>
                <p className="text-xs text-white/70 mt-0.5">Solo personal que salió al parte</p>
              </div>
              <button onClick={() => setModalAgregar(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {bomberosTodos.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-center">
                  Todos los efectivos del parte ya están en la evaluación.
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input autoFocus value={busqAgregar} onChange={e => setBusqAgregar(e.target.value)}
                      placeholder="Buscar por apellido o código..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-200 rounded-xl">
                    {filtradosAgregar.length === 0
                      ? <p className="px-4 py-6 text-xs text-gray-400 text-center">Sin resultados</p>
                      : filtradosAgregar.slice(0, 20).map(b => (
                        <button key={b.id} onClick={() => agregarEvaluado(b)}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.apellidos.split(",")[0]}, {b.nombres.split(" ")[0]}</p>
                            <p className="text-xs text-gray-400">{b.grado} · {b.codigo}</p>
                          </div>
                          <UserPlus className="w-4 h-4 text-red-600 shrink-0" />
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, ChevronLeft } from "lucide-react";

/* ─── Tipos ─────────────────────────────────────────────── */
interface ItemSec { puntaje: number; obs: string; }
type SeccionData = ItemSec[];

interface EvalDetalle {
  id: number; completada: boolean;
  numero_parte: string; emerg_tipo: string; emerg_fecha: string;
  emerg_direccion: string | null; emerg_distrito: string | null;
  emerg_hora_despacho: string | null;
  evaluado_nombre: string; evaluado_grado: string; evaluado_codigo: string;
  evaluador_nombre: string; evaluador_grado: string; evaluador_codigo: string;
  evaluador_bombero_id: number;
  hora_activacion: string | null; hora_salida: string | null;
  hora_llegada_escena: string | null; hora_traslado: string | null;
  hora_entrega_hosp: string | null;
  tipo_emergencia_desc: string | null; lugar_atencion: string | null;
  sec_salida: SeccionData | null; sec_escena: SeccionData | null;
  sec_atencion_eval: SeccionData | null; sec_atencion_proc: SeccionData | null;
  sec_atencion_com: SeccionData | null; sec_transporte: SeccionData | null;
  sec_reacondiciona: SeccionData | null; sec_documentacion: SeccionData | null;
  obs_generales: string | null; conclusiones: string | null;
  clasificacion_final: string | null;
}

/* ─── Definición de secciones ───────────────────────────── */
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
    titulo: "III-A. Evaluación y Criterio Clínico",
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

/* ─── Helpers ───────────────────────────────────────────── */
function initSec(items: readonly string[]): SeccionData {
  return items.map(() => ({ puntaje: 0, obs: "" }));
}

function puntajeSec(sec: SeccionData): number {
  return sec.reduce((s, i) => s + i.puntaje, 0);
}

function maxSec(items: readonly string[]): number {
  return items.length * 5;
}

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

/* ─── Componente de sección ─────────────────────────────── */
function SeccionForm({ titulo, items, data, onChange, soloLectura }: {
  titulo: string;
  items: readonly string[];
  data: SeccionData;
  onChange: (d: SeccionData) => void;
  soloLectura: boolean;
}) {
  const parcial = puntajeSec(data);
  const maximo  = maxSec(items);
  const pct     = maximo > 0 ? Math.round((parcial / maximo) * 100) : 0;

  function set(idx: number, field: "puntaje" | "obs", val: string | number) {
    const next = data.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    onChange(next);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-red-700 text-white flex items-center justify-between">
        <h2 className="text-sm font-bold">{titulo}</h2>
        <div className="text-right">
          <span className="text-base font-bold">{parcial}</span>
          <span className="text-white/60 text-xs"> / {maximo}</span>
          <span className="ml-2 text-xs text-white/80">({pct}%)</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-gray-100">
        <div className={`h-1 transition-all ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500"}`}
          style={{ width: `${pct}%` }} />
      </div>

      <div className="divide-y divide-gray-50">
        {items.map((criterio, idx) => (
          <div key={idx} className="px-5 py-3 grid grid-cols-[1fr_120px] gap-4 items-start">
            <div>
              <p className="text-xs font-medium text-gray-700">{idx + 1}. {criterio}</p>
              {!soloLectura ? (
                <input type="text" value={data[idx]?.obs ?? ""} onChange={e => set(idx, "obs", e.target.value)}
                  placeholder="Observaciones (opcional)"
                  className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 text-gray-600" />
              ) : (
                data[idx]?.obs && <p className="mt-1 text-xs text-gray-500 italic">{data[idx].obs}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {soloLectura ? (
                <span className={`text-lg font-bold ${(data[idx]?.puntaje ?? 0) >= 4 ? "text-green-600" : (data[idx]?.puntaje ?? 0) >= 3 ? "text-blue-600" : (data[idx]?.puntaje ?? 0) >= 2 ? "text-amber-600" : "text-red-600"}`}>
                  {data[idx]?.puntaje ?? "—"}
                </span>
              ) : (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => set(idx, "puntaje", n)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${(data[idx]?.puntaje ?? 0) === n ? "bg-red-700 text-white" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                {[, "Deficiente", "Regular", "Bueno", "Muy Bueno", "Excelente"][(data[idx]?.puntaje ?? 0)] ?? "Sin calificar"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500">Puntaje parcial</p>
        <p className="text-sm font-bold text-gray-900">{parcial} / {maximo}</p>
      </div>
    </div>
  );
}

/* ─── Página principal ──────────────────────────────────── */
export default function AphFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [eval_, setEval]       = useState<EvalDetalle | null>(null);
  const [loading, setLoading]  = useState(true);
  const [guardando, setGuard]  = useState(false);
  const [guardado,  setGuardado] = useState(false);
  const [error,     setError]  = useState("");

  // Datos generales
  const [horaAct,   setHoraAct]   = useState("");
  const [horaSal,   setHoraSal]   = useState("");
  const [horaLleg,  setHoraLleg]  = useState("");
  const [horaTras,  setHoraTras]  = useState("");
  const [horaEntH,  setHoraEntH]  = useState("");
  const [tipoDesc,  setTipoDesc]  = useState("");
  const [lugar,     setLugar]     = useState("");

  // Secciones
  const [secs, setSecs] = useState<Record<SecKey, SeccionData>>(() =>
    Object.fromEntries(SEC_KEYS.map(k => [k, initSec(SECCIONES[k].items)])) as Record<SecKey, SeccionData>
  );

  const [obsGen,    setObsGen]    = useState("");
  const [conclu,    setConclu]    = useState("");
  const [clasifFin, setClasifFin] = useState("");

  const cargar = useCallback(async () => {
    const data = await fetch(`/api/aph/${id}`).then(r => r.json());
    if (data.error) { setError(data.error); setLoading(false); return; }
    setEval(data);
    setHoraAct(data.hora_activacion?.slice(0,5) ?? "");
    setHoraSal(data.hora_salida?.slice(0,5) ?? "");
    setHoraLleg(data.hora_llegada_escena?.slice(0,5) ?? "");
    setHoraTras(data.hora_traslado?.slice(0,5) ?? "");
    setHoraEntH(data.hora_entrega_hosp?.slice(0,5) ?? "");
    setTipoDesc(data.tipo_emergencia_desc ?? "");
    setLugar(data.lugar_atencion ?? "");
    setSecs(prev => Object.fromEntries(
      SEC_KEYS.map(k => [k, data[k] ?? initSec(SECCIONES[k].items)])
    ) as Record<SecKey, SeccionData>);
    setObsGen(data.obs_generales ?? "");
    setConclu(data.conclusiones ?? "");
    setClasifFin(data.clasificacion_final ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const soloLectura = eval_?.completada ?? false;
  const esEvaluador = session?.user?.bomberoId === eval_?.evaluador_bombero_id;
  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session?.user?.rol ?? "");
  const puedeEditar = (esEvaluador || esJefe) && !soloLectura;

  // Calcular puntaje total
  const totalObtenido = SEC_KEYS.reduce((s, k) => s + puntajeSec(secs[k]), 0);
  const totalMaximo   = SEC_KEYS.reduce((s, k) => s + maxSec(SECCIONES[k].items), 0);
  const pctTotal      = totalMaximo > 0 ? Math.round((totalObtenido / totalMaximo) * 100) : 0;

  function interpretacion(): string {
    if (pctTotal >= 90) return "Excelente desempeño";
    if (pctTotal >= 75) return "Buen desempeño";
    if (pctTotal >= 60) return "Desempeño regular";
    return "Requiere reforzamiento inmediato";
  }

  function interpretColor(): string {
    if (pctTotal >= 90) return "text-green-700 bg-green-50 border-green-200";
    if (pctTotal >= 75) return "text-blue-700 bg-blue-50 border-blue-200";
    if (pctTotal >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  }

  async function guardar(completar = false) {
    setGuard(true); setError("");
    const res = await fetch(`/api/aph/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hora_activacion: horaAct || null, hora_salida: horaSal || null,
        hora_llegada_escena: horaLleg || null, hora_traslado: horaTras || null,
        hora_entrega_hosp: horaEntH || null,
        tipo_emergencia_desc: tipoDesc || null, lugar_atencion: lugar || null,
        ...secs,
        obs_generales: obsGen || null, conclusiones: conclu || null,
        clasificacion_final: clasifFin || null,
        completada: completar,
      }),
    });
    setGuard(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar"); return; }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
    if (completar) { cargar(); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-60"><Loader2 className="w-6 h-6 animate-spin text-red-700" /></div>
  );

  if (error && !eval_) return (
    <div className="flex flex-col items-center justify-center h-60 gap-3">
      <p className="text-sm text-red-600">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">← Volver</button>
    </div>
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
        <div className="px-5 py-3 bg-gray-800 text-white">
          <h2 className="text-sm font-bold">Datos Generales</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Hora de activación",       val: horaAct,  set: setHoraAct  },
              { label: "Hora de salida",            val: horaSal,  set: setHoraSal  },
              { label: "Hora de llegada a escena",  val: horaLleg, set: setHoraLleg },
              { label: "Hora de traslado",          val: horaTras, set: setHoraTras },
              { label: "Hora de entrega hospitalaria", val: horaEntH, set: setHoraEntH },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                {puedeEditar
                  ? <input type="time" value={val} onChange={e => set(e.target.value)} className={inputCls + " w-full"} />
                  : <p className="text-sm font-medium text-gray-900">{val || "—"}</p>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de emergencia</label>
              {puedeEditar
                ? <input type="text" value={tipoDesc} onChange={e => setTipoDesc(e.target.value)} placeholder={eval_?.emerg_tipo ?? ""} className={inputCls + " w-full"} />
                : <p className="text-sm font-medium text-gray-900">{tipoDesc || eval_?.emerg_tipo || "—"}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lugar de atención</label>
              {puedeEditar
                ? <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder={eval_?.emerg_distrito ?? ""} className={inputCls + " w-full"} />
                : <p className="text-sm font-medium text-gray-900">{lugar || eval_?.emerg_distrito || "—"}</p>}
            </div>
          </div>
          {/* Personal */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Personal evaluado</p>
              <p className="text-sm font-bold text-gray-900">{eval_?.evaluado_nombre}</p>
              <p className="text-xs text-gray-400">{eval_?.evaluado_grado}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Evaluador</p>
              <p className="text-sm font-bold text-gray-900">{eval_?.evaluador_nombre}</p>
              <p className="text-xs text-gray-400">{eval_?.evaluador_grado}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escala de referencia */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">Escala: 1 Deficiente · 2 Regular · 3 Bueno · 4 Muy Bueno · 5 Excelente</p>
        <p className="text-xs text-gray-500">Faltas: <span className="text-red-600 font-medium">Crítica</span> (compromete vida) · <span className="text-amber-600 font-medium">Mayor</span> (afecta atención) · <span className="text-gray-600 font-medium">Menor</span> (requiere mejora)</p>
      </div>

      {/* Secciones */}
      {SEC_KEYS.map(k => (
        <SeccionForm
          key={k}
          titulo={SECCIONES[k].titulo}
          items={SECCIONES[k].items}
          data={secs[k]}
          onChange={d => setSecs(prev => ({ ...prev, [k]: d }))}
          soloLectura={!puedeEditar}
        />
      ))}

      {/* Resultado final */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-800 text-white flex items-center justify-between">
          <h2 className="text-sm font-bold">Resultado Final</h2>
          <div>
            <span className="text-2xl font-bold">{pctTotal}%</span>
            <span className="text-white/60 text-sm ml-1">({totalObtenido}/{totalMaximo} pts)</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Barra total */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all ${pctTotal >= 90 ? "bg-green-500" : pctTotal >= 75 ? "bg-blue-500" : pctTotal >= 60 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${pctTotal}%` }} />
          </div>

          {/* Tabla por sección */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 text-xs text-gray-400 font-medium">Área</th>
                <th className="text-right py-1.5 text-xs text-gray-400 font-medium">Puntaje</th>
                <th className="text-right py-1.5 text-xs text-gray-400 font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SEC_KEYS.map(k => {
                const obt = puntajeSec(secs[k]);
                const max = maxSec(SECCIONES[k].items);
                return (
                  <tr key={k}>
                    <td className="py-1.5 text-gray-700 text-xs">{SECCIONES[k].titulo}</td>
                    <td className="py-1.5 text-right font-medium text-gray-900 text-xs">{obt}/{max}</td>
                    <td className="py-1.5 text-right text-xs font-bold">
                      <span className={max > 0 && Math.round((obt/max)*100) >= 75 ? "text-green-600" : "text-amber-600"}>
                        {max > 0 ? Math.round((obt/max)*100) : 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Interpretación */}
          <div className={`px-4 py-3 rounded-xl border text-sm font-semibold ${interpretColor()}`}>
            {pctTotal}% — {interpretacion()}
          </div>
        </div>
      </div>

      {/* Observaciones y conclusiones */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Observaciones y Conclusiones</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones generales</label>
          {puedeEditar
            ? <textarea value={obsGen} onChange={e => setObsGen(e.target.value)} rows={3} className={inputCls + " w-full resize-none"} />
            : <p className="text-sm text-gray-700 whitespace-pre-wrap">{obsGen || "—"}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Conclusiones y recomendaciones</label>
          {puedeEditar
            ? <textarea value={conclu} onChange={e => setConclu(e.target.value)} rows={3} className={inputCls + " w-full resize-none"} />
            : <p className="text-sm text-gray-700 whitespace-pre-wrap">{conclu || "—"}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Clasificación final del personal</label>
          {puedeEditar ? (
            <div className="grid grid-cols-2 gap-2">
              {CLASIFICACIONES.map(c => (
                <label key={c} className={`flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl border text-sm transition-colors ${clasifFin === c ? "bg-red-700 text-white border-red-700 font-semibold" : "border-gray-200 text-gray-700 hover:border-red-300"}`}>
                  <input type="radio" name="clasif" value={c} checked={clasifFin === c} onChange={() => setClasifFin(c)} className="sr-only" />
                  {c}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-900">{clasifFin || "—"}</p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      {puedeEditar && (
        <div className="flex gap-3 sticky bottom-4">
          <button onClick={() => guardar(false)} disabled={guardando}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {guardado ? "✓ Guardado" : "Guardar borrador"}
          </button>
          <button onClick={() => guardar(true)} disabled={guardando || !clasifFin}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Completar evaluación
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}

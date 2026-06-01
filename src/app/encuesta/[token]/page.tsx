"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";

const ASPECTOS = [
  "Mayor dinámica de grupo.",
  "Mejorar la interacción del Instructor.",
  "Acortar los tiempos de Capacitación.",
  "Aumentar los tiempos de Capacitación.",
  "Mejor material audiovisual.",
  "Mejor material de prácticas.",
];

const CALIF = ["Malo", "Regular", "Bueno", "Excelente"];

const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

function RadioGroup({ name, options, value, onChange, required }: {
  name: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(op => (
        <label key={op} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm transition-colors ${
          value === op
            ? "bg-red-700 text-white border-red-700 font-medium"
            : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
        }`}>
          <input
            type="radio"
            name={name}
            value={op}
            checked={value === op}
            onChange={() => onChange(op)}
            required={required}
            className="sr-only"
          />
          {op}
        </label>
      ))}
    </div>
  );
}

function CheckGroup({ options, values, onChange }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(op: string) {
    onChange(values.includes(op) ? values.filter(v => v !== op) : [...values, op]);
  }
  return (
    <div className="flex flex-col gap-2">
      {options.map(op => (
        <label key={op} className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg border text-sm transition-colors ${
          values.includes(op)
            ? "bg-red-50 text-red-800 border-red-300 font-medium"
            : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
        }`}>
          <input
            type="checkbox"
            checked={values.includes(op)}
            onChange={() => toggle(op)}
            className="w-4 h-4 accent-red-700"
          />
          {op}
        </label>
      ))}
    </div>
  );
}

export default function EncuestaPublicaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [estado,         setEstado]         = useState<"cargando"|"activo"|"inactivo"|"enviado"|"error">("cargando");
  const [entidadNombre,  setEntidadNombre]  = useState("");
  const [seccion,        setSeccion]        = useState(1);
  const [enviando,       setEnviando]       = useState(false);

  // Sección 1
  const [horaIni,  setHoraIni]  = useState("");
  const [horaFin,  setHoraFin]  = useState("");
  const [fechaCap, setFechaCap] = useState("");
  const [camposAutocompletados, setCamposAutocompletados] = useState(false);

  // Sección 2
  const [objetivos,      setObjetivos]      = useState("");
  const [duracion,       setDuracion]       = useState("");
  const [dinamicas,      setDinamicas]      = useState("");
  const [aspectos,       setAspectos]       = useState<string[]>([]);
  const [contenido,      setContenido]      = useState("");
  const [materiales,     setMateriales]     = useState("");
  const [dinamicaExp,    setDinamicaExp]    = useState("");
  const [conocimiento,   setConocimiento]   = useState("");
  const [recomienda,     setRecomienda]     = useState("");
  const [comentarios,    setComentarios]    = useState("");

  useEffect(() => {
    fetch(`/api/encuesta-publica/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setEstado(d.error.includes("activo") ? "inactivo" : "error"); return; }
        setEntidadNombre(d.entidad_nombre);
        // Autocompletar fecha y hora desde el evento vinculado
        if (d.actividad_fecha) {
          setFechaCap(d.actividad_fecha);
          setCamposAutocompletados(true);
        }
        if (d.actividad_hora_inicio) setHoraIni(d.actividad_hora_inicio.slice(0, 5));
        if (d.actividad_hora_fin)    setHoraFin(d.actividad_hora_fin.slice(0, 5));
        setEstado("activo");
      })
      .catch(() => setEstado("error"));
  }, [token]);

  function sec1Valida() { return horaIni !== "" && fechaCap !== ""; }
  function sec2Valida() {
    return objetivos && duracion && dinamicas && aspectos.length > 0 &&
           contenido && materiales && dinamicaExp && conocimiento && recomienda;
  }

  async function enviar() {
    if (!sec2Valida()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/encuesta-publica/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_nombre: entidadNombre,
          horario: horaFin ? `${horaIni} – ${horaFin}` : horaIni,
          fecha_capacitacion: fechaCap,
          objetivos_alcanzados: objetivos === "Sí",
          duracion_adecuada:    duracion  === "Sí",
          dinamicas_correctas:  dinamicas === "Sí",
          aspectos_mejora: aspectos,
          contenido_calif:      contenido,
          materiales_calif:     materiales,
          dinamica_expositores: dinamicaExp,
          conocimiento_expositores: conocimiento,
          recomendaria: recomienda === "Sí",
          comentarios: comentarios || null,
        }),
      });
      if (res.ok) setEstado("enviado");
      else setEstado("error");
    } catch { setEstado("error"); }
    finally { setEnviando(false); }
  }

  if (estado === "cargando") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-red-700" />
    </div>
  );

  if (estado === "inactivo") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">Enlace desactivado</h2>
        <p className="text-sm text-gray-500">Este enlace ya no está disponible. Contacte a la compañía de bomberos.</p>
      </div>
    </div>
  );

  if (estado === "error") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">Enlace inválido</h2>
        <p className="text-sm text-gray-500">No se encontró esta encuesta. Verifique el enlace recibido.</p>
      </div>
    </div>
  );

  if (estado === "enviado") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800 mb-1">¡Gracias por su respuesta!</h2>
        <p className="text-sm text-gray-500">Sus respuestas han sido registradas correctamente.</p>
        <p className="text-sm text-gray-400 mt-1">Cía. de Bomberos Voluntarios N.° 150 — Puente Piedra</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#7f1d1d] text-white">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <Image src="/LOGO_150.png" alt="CIA 150" width={52} height={52} className="rounded-full shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Cía. N.° 150 — CGBVP</p>
            <h1 className="text-xl font-bold leading-tight">Encuesta de Satisfacción</h1>
            <p className="text-sm opacity-80 mt-0.5">{entidadNombre}</p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="max-w-2xl mx-auto px-4 pb-4 flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= seccion ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {seccion === 1 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-widest mb-1">Sección 1 de 2</p>
              <h2 className="text-base font-bold text-gray-900 mb-1">Información general</h2>
              <p className="text-sm text-gray-500">Por favor, agradecemos su apoyo con el llenado de la encuesta de satisfacción. Su opinión es muy importante para mejorar nuestros servicios.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {/* Empresa — solo informativo, viene del token */}
              <div>
                <label className={labelCls}>Empresa</label>
                <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium">
                  {entidadNombre}
                </div>
              </div>
              {/* Horario con relojes */}
              <div>
                <label className={labelCls}>Horario en el que se realizó la capacitación <span className="text-red-600">*</span></label>
                {camposAutocompletados ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-800 font-medium">
                      {horaIni}{horaFin ? ` – ${horaFin}` : ""}
                    </span>
                    <span className="text-[10px] text-green-600 ml-auto">Completado automáticamente</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="time" value={horaIni} onChange={e => setHoraIni(e.target.value)} className={inputCls} />
                    <span className="text-gray-400 text-sm shrink-0">–</span>
                    <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={inputCls} />
                  </div>
                )}
                {!camposAutocompletados && <p className="text-[11px] text-gray-400 mt-1">Hora inicio — Hora fin (opcional)</p>}
              </div>
              <div>
                <label className={labelCls}>Fecha en la que se realizó la capacitación <span className="text-red-600">*</span></label>
                {camposAutocompletados ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-800 font-medium">
                      {new Date(fechaCap + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span className="text-[10px] text-green-600 ml-auto">Completado automáticamente</span>
                  </div>
                ) : (
                  <input type="date" value={fechaCap} onChange={e => setFechaCap(e.target.value)} className={inputCls} />
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={!sec1Valida()}
                onClick={() => setSeccion(2)}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {seccion === 2 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-widest mb-1">Sección 2 de 2</p>
              <h2 className="text-base font-bold text-gray-900 mb-1">Preguntas</h2>
              <p className="text-sm text-gray-500">Por favor responda las siguientes preguntas, ya que nos servirán para mejorar el servicio que brindamos. ¡Gracias!</p>
            </div>

            <div className="space-y-5">

              {/* Sí/No */}
              {[
                { label: "¿Cree que los objetivos del curso fueron alcanzados?", value: objetivos, set: setObjetivos },
                { label: "¿La duración del curso le pareció adecuada?",          value: duracion,  set: setDuracion  },
                { label: "¿Las dinámicas aplicadas fueron las correctas?",       value: dinamicas, set: setDinamicas },
              ].map(({ label, value, set }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <label className={labelCls}>{label} <span className="text-red-600">*</span></label>
                  <RadioGroup name={label} options={["Sí","No"]} value={value} onChange={set} required />
                </div>
              ))}

              {/* Aspectos de mejora */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className={labelCls}>
                  ¿En qué aspectos cree que puede mejorar nuestro proceso? <span className="text-red-600">*</span>
                </label>
                <CheckGroup options={ASPECTOS} values={aspectos} onChange={setAspectos} />
              </div>

              {/* Calificaciones */}
              {[
                { label: "¿Cómo le pareció el contenido de la Capacitación?",       value: contenido,    set: setContenido    },
                { label: "¿Cómo le pareció el uso de los materiales de práctica?",  value: materiales,   set: setMateriales   },
                { label: "¿Cómo calificaría la dinámica de los expositores?",        value: dinamicaExp,  set: setDinamicaExp  },
                { label: "¿Cómo calificaría el conocimiento sobre el tema?",         value: conocimiento, set: setConocimiento },
              ].map(({ label, value, set }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <label className={labelCls}>{label} <span className="text-red-600">*</span></label>
                  <RadioGroup name={label} options={CALIF} value={value} onChange={set} required />
                </div>
              ))}

              {/* Recomendaría */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className={labelCls}>
                  ¿Recomendaría el Servicio de Capacitación de la Cía. de Bomberos de Puente Piedra? <span className="text-red-600">*</span>
                </label>
                <RadioGroup name="recomienda" options={["Sí","No"]} value={recomienda} onChange={setRecomienda} required />
              </div>

              {/* Comentarios */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className={labelCls}>Comentarios sobre el servicio brindado</label>
                <textarea
                  value={comentarios}
                  onChange={e => setComentarios(e.target.value)}
                  rows={4}
                  placeholder="Sus comentarios son bienvenidos…"
                  className={inputCls + " resize-none"}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setSeccion(1)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                disabled={!sec2Valida() || enviando}
                onClick={enviar}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar encuesta
              </button>
            </div>
          </>
        )}

        <p className="text-center text-[11px] text-gray-400 pb-4">
          Compañía de Bomberos Voluntarios Brig. CBP Julio Upiachihua Cárdenas N.° 150 — Puente Piedra
        </p>
      </div>
    </div>
  );
}

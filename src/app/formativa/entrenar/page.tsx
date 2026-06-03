"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

type FaceApi     = typeof import("@vladmandic/face-api");
type LandmarkResult = Awaited<ReturnType<ReturnType<ReturnType<FaceApi["detectSingleFace"]>["withFaceLandmarks"]>["withFaceDescriptor"]>>;

const MODEL_URL = "/models";

async function cargarModelos(faceapi: FaceApi) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}

/* ─── Validación de pose con landmarks 68pts ─────────────────────
   Puntos clave:
   - 0–16  : contorno mandíbula
   - 27–30 : dorso de nariz
   - 33    : punta de nariz
   - 36–41 : ojo izquierdo
   - 42–47 : ojo derecho
   - 8     : barbilla
   - 27    : puente de nariz (entre cejas)
──────────────────────────────────────────────────────────────── */
type Pose = "frente" | "izquierda" | "derecha" | "arriba";

function calcularPose(det: NonNullable<LandmarkResult>): { pose: Pose; confianza: number } {
  const pts = det.landmarks.positions;

  // Centro de cada ojo
  const ojoIzq  = { x: (pts[36].x + pts[39].x) / 2, y: (pts[36].y + pts[39].y) / 2 };
  const ojoDer  = { x: (pts[42].x + pts[45].x) / 2, y: (pts[42].y + pts[45].y) / 2 };
  const nariz   = pts[33];
  const barbilla = pts[8];
  const puenteN  = pts[27];

  // Centro horizontal entre ojos
  const centroOjos = (ojoIzq.x + ojoDer.x) / 2;
  const anchoOjos  = Math.abs(ojoDer.x - ojoIzq.x);

  // Desplazamiento lateral de la nariz respecto al centro de ojos
  // Normalizado por el ancho entre ojos
  const desvLateral = (nariz.x - centroOjos) / anchoOjos;

  // Relación vertical: distancia nariz-barbilla / nariz-puente
  // Cuando mira arriba, la barbilla sube y la distancia disminuye
  const distNarizBarbilla = barbilla.y - nariz.y;
  const distNarizPuente   = nariz.y - puenteN.y;
  const ratioVertical     = distNarizPuente > 0 ? distNarizBarbilla / distNarizPuente : 1;

  // Umbrales calibrados
  const UMBRAL_LATERAL = 0.12; // >12% del ancho → girado
  const UMBRAL_ARRIBA  = 0.9;  // ratio < 0.9 → mirando arriba

  if (ratioVertical < UMBRAL_ARRIBA) {
    const confianza = Math.min(1, (UMBRAL_ARRIBA - ratioVertical) / 0.3);
    return { pose: "arriba", confianza };
  }
  if (desvLateral < -UMBRAL_LATERAL) {
    // Nariz a la izquierda del centro = cara girada a la derecha (espejo)
    const confianza = Math.min(1, (-desvLateral - UMBRAL_LATERAL) / 0.15);
    return { pose: "derecha", confianza };
  }
  if (desvLateral > UMBRAL_LATERAL) {
    const confianza = Math.min(1, (desvLateral - UMBRAL_LATERAL) / 0.15);
    return { pose: "izquierda", confianza };
  }
  // Frente: cuanto más centrada, mayor confianza
  const confianza = Math.max(0, 1 - Math.abs(desvLateral) / UMBRAL_LATERAL);
  return { pose: "frente", confianza };
}

/* ─── Pasos con pose requerida ───────────────────────────────── */
const PASOS: { label: string; hint: string; rot: number; poseReq: Pose; umbral: number }[] = [
  { label: "Mira de frente",        hint: "Mantén la cabeza recta y centrada",      rot:   0, poseReq: "frente",    umbral: 0.6 },
  { label: "Gira a tu izquierda",   hint: "Gira el rostro levemente a la izquierda",rot: -20, poseReq: "izquierda", umbral: 0.4 },
  { label: "Gira a tu derecha",     hint: "Gira el rostro levemente a la derecha",  rot:  20, poseReq: "derecha",   umbral: 0.4 },
  { label: "Inclina hacia arriba",  hint: "Levanta levemente el mentón",            rot: -10, poseReq: "arriba",    umbral: 0.3 },
];

const HOLD_FRAMES   = 6;   // frames consecutivos con pose válida para capturar
const BEST_SAMPLES  = 3;   // muestras a promediar por paso para el mejor momento

export default function EntrenarPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const faceApiRef = useRef<FaceApi | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const loopRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCount  = useRef(0);
  // Buffer de los mejores descriptores del paso actual (mayor confianza)
  const bestBuffer = useRef<{ desc: number[]; conf: number }[]>([]);

  const [estado,    setEstado]    = useState<"cargando"|"activo"|"procesando"|"ok"|"error">("cargando");
  const [msg,       setMsg]       = useState("Iniciando...");
  const [pasoIdx,   setPasoIdx]   = useState(0);
  const [capturas,  setCapturas]  = useState<number[][]>([]);
  const [faceOk,    setFaceOk]    = useState(false);
  const [poseOk,    setPoseOk]    = useState(false);
  const [cuenta,    setCuenta]    = useState(0);
  const [yaTiene,   setYaTiene]   = useState(false);
  const [poseInfo,  setPoseInfo]  = useState<{ pose: string; confianza: number } | null>(null);

  const capturasRef = useRef<number[][]>([]);
  const pasoIdxRef  = useRef(0);

  useEffect(() => { capturasRef.current = capturas; }, [capturas]);
  useEffect(() => { pasoIdxRef.current  = pasoIdx;  }, [pasoIdx]);

  const guardarDescriptor = useCallback(async (todas: number[][]) => {
    setEstado("procesando");
    setMsg("Guardando tu rostro...");
    if (loopRef.current) clearTimeout(loopRef.current);

    // Promedio ponderado de todos los descriptores
    const promedio = todas[0].map((_, i) =>
      todas.reduce((s, d) => s + d[i], 0) / todas.length
    );

    const res = await fetch("/api/formativa/entrenar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descriptor: promedio }),
    });

    streamRef.current?.getTracks().forEach(t => t.stop());

    if (res.ok) {
      setEstado("ok");
      setYaTiene(true);
      setMsg("¡Rostro registrado correctamente!");
    } else {
      const d = await res.json();
      setEstado("error");
      setMsg(d.error ?? "Error al guardar.");
    }
  }, []);

  const iniciarLoop = useCallback((faceapi: FaceApi) => {
    async function loop() {
      if (!videoRef.current || !canvasRef.current) return;
      try {
        const det = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (det) {
          setFaceOk(true);

          // Calcular pose real
          const { pose, confianza } = calcularPose(det);
          setPoseInfo({ pose, confianza });

          const paso = PASOS[pasoIdxRef.current];
          const poseCumple = pose === paso.poseReq && confianza >= paso.umbral;
          setPoseOk(poseCumple);

          if (poseCumple) {
            holdCount.current++;
            setCuenta(Math.min(holdCount.current, HOLD_FRAMES));

            // Acumular el mejor descriptor de este frame en el buffer
            const descriptor = Array.from(det.descriptor);
            bestBuffer.current.push({ desc: descriptor, conf: confianza });
            // Mantener solo los BEST_SAMPLES de mayor confianza
            bestBuffer.current.sort((a, b) => b.conf - a.conf);
            if (bestBuffer.current.length > BEST_SAMPLES) bestBuffer.current.length = BEST_SAMPLES;

            // Captura automática cuando se mantiene la pose suficientes frames
            if (holdCount.current >= HOLD_FRAMES) {
              holdCount.current = 0;
              setCuenta(0);

              // Promediar los mejores descriptores del buffer
              const mejores = bestBuffer.current.map(b => b.desc);
              bestBuffer.current = [];
              const promBufer = mejores[0].map((_, i) =>
                mejores.reduce((s, d) => s + d[i], 0) / mejores.length
              );

              const nuevas = [...capturasRef.current, promBufer];
              capturasRef.current = nuevas;
              setCapturas(nuevas);

              if (pasoIdxRef.current < PASOS.length - 1) {
                pasoIdxRef.current++;
                setPasoIdx(pasoIdxRef.current);
                setPoseOk(false);
              } else {
                await guardarDescriptor(nuevas);
                return;
              }
            }
          } else {
            // Pose no cumple: reiniciar contador pero NO limpiar buffer
            holdCount.current = Math.max(0, holdCount.current - 1);
            setCuenta(Math.max(0, holdCount.current));
          }
        } else {
          setFaceOk(false);
          setPoseOk(false);
          setPoseInfo(null);
          holdCount.current = 0;
          setCuenta(0);
        }
      } catch { /* ignorar errores de frame */ }

      loopRef.current = setTimeout(loop, 150); // ~6fps para mejor detección
    }
    loop();
  }, [guardarDescriptor]);

  useEffect(() => {
    (async () => {
      try {
        setMsg("Cargando modelos...");
        const faceapi = await import("@vladmandic/face-api");
        faceApiRef.current = faceapi;
        await cargarModelos(faceapi);

        const res = await fetch("/api/formativa/entrenar");
        const data = await res.json();
        if (data.descriptor) setYaTiene(true);

        setMsg("Iniciando cámara...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        iniciarLoop(faceapi);
        setEstado("activo");
        setMsg("");
      } catch (err) {
        setEstado("error");
        setMsg(err instanceof Error ? err.message : "Error al iniciar");
      }
    })();

    async function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (!faceApiRef.current) return;
      try {
        if (!streamRef.current || streamRef.current.getTracks().every(t => t.readyState === "ended")) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          });
          streamRef.current = stream;
          if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        } else if (videoRef.current?.paused) {
          await videoRef.current.play();
        }
        if (loopRef.current) clearTimeout(loopRef.current);
        iniciarLoop(faceApiRef.current);
      } catch { /* ignorar */ }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (loopRef.current) clearTimeout(loopRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [iniciarLoop]);

  function reiniciar() {
    capturas.length = 0;
    capturasRef.current = [];
    bestBuffer.current  = [];
    holdCount.current   = 0;
    pasoIdxRef.current  = 0;
    setCapturas([]); setPasoIdx(0); setCuenta(0);
    setFaceOk(false); setPoseOk(false); setPoseInfo(null);
    setEstado("cargando"); setMsg("Reiniciando...");
    window.location.reload();
  }

  const paso     = PASOS[pasoIdx];
  const progreso = (cuenta / HOLD_FRAMES) * 100;

  // Color del óvalo: verde=pose ok, amarillo=cara detectada pero pose incorrecta, gris=sin cara
  const ovalColor = poseOk ? "#4ade80" : faceOk ? "#fbbf24" : "rgba(255,255,255,0.5)";

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-700" />
          Registrar mi rostro
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {yaTiene ? "Actualiza tu registro facial" : "Necesario para marcar asistencia"}
        </p>
      </div>

      {/* Cámara */}
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }} muted playsInline />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Óvalo SVG con rotación según el paso */}
        {estado === "activo" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 200 260" className="w-[65%] h-[78%]"
              style={{ marginTop: "-5%", transition: "transform 0.4s ease", transform: `rotate(${paso.rot}deg)` }}>
              {/* Óvalo base (siempre visible) */}
              <ellipse cx="100" cy="130" rx="90" ry="120" fill="none" strokeWidth="3"
                stroke={ovalColor} strokeDasharray={poseOk ? "none" : faceOk ? "none" : "12 6"}
                style={{ transition: "stroke 0.2s" }} />
              {/* Barra de progreso sobre el óvalo */}
              {poseOk && progreso > 0 && (
                <ellipse cx="100" cy="130" rx="90" ry="120" fill="none" strokeWidth="5"
                  stroke="#22c55e"
                  strokeDasharray={`${(progreso / 100) * 660} 660`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.15s" }} />
              )}
            </svg>
          </div>
        )}

        {/* Indicador pose */}
        {estado === "activo" && (
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${
            poseOk ? "bg-green-500 text-white" :
            faceOk ? "bg-amber-400 text-white" :
                     "bg-black/50 text-white/60"
          }`}>
            {poseOk ? "✓ Pose correcta" : faceOk ? "Ajusta la pose" : "Buscando rostro..."}
          </div>
        )}

        {/* Pose actual detectada (debug suave) */}
        {estado === "activo" && faceOk && poseInfo && !poseOk && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <span className="bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-full">
              {poseInfo.pose === "frente"    ? "↑ Centra la cabeza"         : ""}
              {poseInfo.pose === "izquierda" && paso.poseReq !== "izquierda" ? "← Gira más a la izquierda" : ""}
              {poseInfo.pose === "derecha"   && paso.poseReq !== "derecha"   ? "→ Gira más a la derecha"   : ""}
              {poseInfo.pose === "arriba"    && paso.poseReq !== "arriba"    ? "↑ Levanta el mentón"        : ""}
            </span>
          </div>
        )}

        {/* Puntos de progreso */}
        {estado === "activo" && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {PASOS.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < capturas.length ? "bg-green-400 scale-110" :
                i === pasoIdx       ? "bg-white" : "bg-white/30"
              }`} />
            ))}
          </div>
        )}

        {/* Overlays */}
        {(estado === "cargando" || estado === "procesando") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">{msg}</p>
          </div>
        )}
        {estado === "ok" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90 gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-400" />
            <p className="text-white font-bold text-lg">¡Listo!</p>
          </div>
        )}
      </div>

      {/* Instrucción del paso */}
      {estado === "activo" && (
        <div className="bg-gray-900 rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Paso {pasoIdx + 1} de {PASOS.length}
            </p>
            {poseOk && (
              <p className="text-xs text-green-400 font-semibold">
                Capturando en {Math.ceil(((HOLD_FRAMES - cuenta) / HOLD_FRAMES) * 1.0)}s...
              </p>
            )}
          </div>
          <p className="text-white font-bold text-base">{paso.label}</p>
          <p className="text-gray-400 text-xs">{paso.hint}</p>
          {!poseOk && faceOk && (
            <p className="text-amber-400 text-xs">
              {paso.poseReq === "frente"    && "→ Centra la cabeza mirando directamente a la cámara"}
              {paso.poseReq === "izquierda" && "→ Gira tu cabeza hacia la izquierda"}
              {paso.poseReq === "derecha"   && "→ Gira tu cabeza hacia la derecha"}
              {paso.poseReq === "arriba"    && "→ Levanta el mentón hacia arriba"}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {estado === "error" && (
        <>
          <div className="px-4 py-3 rounded-xl text-sm text-center font-medium bg-red-50 text-red-700 border border-red-200">
            {msg}
          </div>
          <button onClick={reiniciar}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-800">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </>
      )}

      {/* Éxito */}
      {estado === "ok" && (
        <div className="space-y-3">
          <div className="px-4 py-3 rounded-xl text-sm text-center font-medium bg-green-50 text-green-700 border border-green-200">
            {msg}
          </div>
          <button onClick={reiniciar}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Registrar de nuevo
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Tu imagen <strong>no se almacena</strong> — solo datos matemáticos del rostro.
      </p>
    </div>
  );
}

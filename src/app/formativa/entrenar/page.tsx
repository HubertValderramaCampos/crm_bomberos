"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

type FaceApi = typeof import("@vladmandic/face-api");
const MODEL_URL = "/models";

async function cargarModelos(faceapi: FaceApi) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}

// Cada paso tiene: instrucción, y qué parte del óvalo resaltar
const PASOS = [
  { label: "Mira de frente",              hint: "Mantén la cabeza recta",          rot: 0   },
  { label: "Gira a tu izquierda",         hint: "Gira levemente hacia tu izquierda", rot: -15 },
  { label: "Gira a tu derecha",           hint: "Gira levemente hacia tu derecha",  rot: 15  },
  { label: "Inclina hacia arriba",         hint: "Levanta levemente el mentón",      rot: -10, tilt: -10 },
];

// Cuenta regresiva antes de capturar automáticamente
const HOLD_FRAMES = 8; // ~1.6 seg a 5fps

export default function EntrenarPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const faceApiRef = useRef<FaceApi | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const loopRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCount  = useRef(0);

  const [estado,   setEstado]   = useState<"cargando"|"activo"|"procesando"|"ok"|"error">("cargando");
  const [msg,      setMsg]      = useState("Iniciando...");
  const [pasoIdx,  setPasoIdx]  = useState(0);
  const [capturas, setCapturas] = useState<number[][]>([]);
  const [faceOk,   setFaceOk]   = useState(false);
  const [cuenta,   setCuenta]   = useState(0); // 0-HOLD_FRAMES
  const [yaTiene,  setYaTiene]  = useState(false);

  const capturasRef = useRef<number[][]>([]);
  const pasoIdxRef  = useRef(0);

  // Sincronizar refs con estado
  useEffect(() => { capturasRef.current = capturas; }, [capturas]);
  useEffect(() => { pasoIdxRef.current  = pasoIdx;  }, [pasoIdx]);

  const guardarDescriptor = useCallback(async (todas: number[][]) => {
    setEstado("procesando");
    setMsg("Guardando tu rostro...");
    if (loopRef.current) clearTimeout(loopRef.current);

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
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (det) {
          setFaceOk(true);
          holdCount.current++;
          setCuenta(Math.min(holdCount.current, HOLD_FRAMES));

          // Captura automática cuando se mantiene el tiempo
          if (holdCount.current >= HOLD_FRAMES) {
            holdCount.current = 0;
            setCuenta(0);
            const descriptor = Array.from(det.descriptor);
            const nuevas = [...capturasRef.current, descriptor];
            capturasRef.current = nuevas;
            setCapturas(nuevas);

            if (pasoIdxRef.current < PASOS.length - 1) {
              pasoIdxRef.current++;
              setPasoIdx(pasoIdxRef.current);
            } else {
              await guardarDescriptor(nuevas);
              return;
            }
          }
        } else {
          setFaceOk(false);
          holdCount.current = 0;
          setCuenta(0);
        }
      } catch { /* ignorar errores de frame */ }

      loopRef.current = setTimeout(loop, 200);
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

    return () => {
      if (loopRef.current) clearTimeout(loopRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [iniciarLoop]);

  function reiniciar() {
    capturas.length = 0;
    capturasRef.current = [];
    holdCount.current = 0;
    pasoIdxRef.current = 0;
    setCapturas([]);
    setPasoIdx(0);
    setCuenta(0);
    setFaceOk(false);
    setEstado("cargando");
    setMsg("Reiniciando...");
    window.location.reload();
  }

  const paso = PASOS[pasoIdx];
  const progreso = (cuenta / HOLD_FRAMES) * 100;

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
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          muted playsInline
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Óvalo SVG que rota según el paso */}
        {(estado === "activo") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 200 260"
              className="w-[65%] h-[78%]"
              style={{ marginTop: "-5%", transition: "transform 0.4s ease", transform: `rotate(${paso.rot}deg)` }}
            >
              <ellipse
                cx="100" cy="130" rx="90" ry="120"
                fill="none"
                strokeWidth="4"
                stroke={faceOk ? "#4ade80" : "rgba(255,255,255,0.6)"}
                strokeDasharray={faceOk ? "none" : "12 6"}
                style={{ transition: "stroke 0.3s" }}
              />
              {/* Barra de progreso en el óvalo */}
              {faceOk && (
                <ellipse
                  cx="100" cy="130" rx="90" ry="120"
                  fill="none"
                  strokeWidth="4"
                  stroke="#22c55e"
                  strokeDasharray={`${(progreso / 100) * 660} 660`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.2s" }}
                />
              )}
            </svg>
          </div>
        )}

        {/* Indicador rostro */}
        {estado === "activo" && (
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${
            faceOk ? "bg-green-500 text-white" : "bg-black/50 text-white/60"
          }`}>
            {faceOk ? "✓ Mantén la pose" : "Busca tu rostro..."}
          </div>
        )}

        {/* Puntos de progreso */}
        {estado === "activo" && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {PASOS.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < capturas.length ? "bg-green-400 scale-110" :
                i === pasoIdx      ? "bg-white" : "bg-white/30"
              }`} />
            ))}
          </div>
        )}

        {/* Overlay cargando */}
        {(estado === "cargando" || estado === "procesando") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">{msg}</p>
          </div>
        )}

        {/* Overlay éxito */}
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
            {faceOk && (
              <p className="text-xs text-green-400 font-semibold">
                Capturando en {Math.ceil(((HOLD_FRAMES - cuenta) / HOLD_FRAMES) * 1.6)}s...
              </p>
            )}
          </div>
          <p className="text-white font-bold text-base">{paso.label}</p>
          <p className="text-gray-400 text-xs">{paso.hint}</p>
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

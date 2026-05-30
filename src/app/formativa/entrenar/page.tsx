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

const PASOS = [
  { id: "centro",    label: "Mira de frente",       emoji: "😐" },
  { id: "izquierda", label: "Gira levemente a la izquierda", emoji: "👈" },
  { id: "derecha",   label: "Gira levemente a la derecha",  emoji: "👉" },
  { id: "arriba",    label: "Inclina levemente hacia arriba", emoji: "☝️" },
];

export default function EntrenarPage() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const faceApiRef  = useRef<FaceApi | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [estado,    setEstado]    = useState<"cargando"|"guia"|"capturando"|"procesando"|"ok"|"error">("cargando");
  const [msg,       setMsg]       = useState("Iniciando...");
  const [yaTiene,   setYaTiene]   = useState(false);
  const [pasoIdx,   setPasoIdx]   = useState(0);
  const [capturas,  setCapturas]  = useState<number[][]>([]); // descriptores por paso
  const [faceOk,    setFaceOk]    = useState(false); // rostro detectado en frame actual

  // Loop de detección en tiempo real para feedback visual
  const detectLoop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iniciarDetectLoop = useCallback((faceapi: FaceApi) => {
    async function loop() {
      if (!videoRef.current || !canvasRef.current) return;
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
          .withFaceLandmarks();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setFaceOk(true);
          // Dibujar landmarks suavemente
          const dims = faceapi.matchDimensions(canvas, videoRef.current, true);
          const resized = faceapi.resizeResults(detection, dims);
          faceapi.draw.drawFaceLandmarks(canvas, resized);
        } else {
          setFaceOk(false);
        }
      } catch { /* ignorar errores de frame */ }
      detectLoop.current = setTimeout(loop, 200);
    }
    loop();
  }, []);

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

        iniciarDetectLoop(faceapi);
        setEstado("guia");
        setMsg("");
      } catch (err) {
        setEstado("error");
        setMsg(err instanceof Error ? err.message : "Error al iniciar");
      }
    })();

    return () => {
      if (detectLoop.current) clearTimeout(detectLoop.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [iniciarDetectLoop]);

  const capturarPaso = useCallback(async () => {
    const faceapi = faceApiRef.current;
    if (!faceapi || !videoRef.current) return;

    setEstado("procesando");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setEstado("guia");
        setMsg("No se detectó tu rostro. Asegúrate de tener buena iluminación.");
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const nuevasCapturas = [...capturas, descriptor];
      setCapturas(nuevasCapturas);
      setMsg("");

      if (pasoIdx < PASOS.length - 1) {
        // Siguiente paso
        setPasoIdx(p => p + 1);
        setEstado("guia");
      } else {
        // Todos los pasos completados — promediar descriptores y guardar
        setEstado("procesando");
        setMsg("Guardando tu rostro...");

        const promedio = nuevasCapturas[0].map((_, i) =>
          nuevasCapturas.reduce((sum, d) => sum + d[i], 0) / nuevasCapturas.length
        );

        const saveRes = await fetch("/api/formativa/entrenar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ descriptor: promedio }),
        });

        if (!saveRes.ok) {
          const d = await saveRes.json();
          setEstado("error");
          setMsg(d.error ?? "Error al guardar.");
          return;
        }

        if (detectLoop.current) clearTimeout(detectLoop.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        setEstado("ok");
        setYaTiene(true);
        setMsg("¡Rostro registrado correctamente!");
      }
    } catch {
      setEstado("guia");
      setMsg("Error al procesar. Intenta de nuevo.");
    }
  }, [capturas, pasoIdx]);

  function reiniciar() {
    setCapturas([]);
    setPasoIdx(0);
    setMsg("");
    setEstado("guia");
  }

  const paso = PASOS[pasoIdx];

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-700" />
          Registrar mi rostro
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {yaTiene ? "Actualiza tu registro facial" : "Necesario para marcar asistencia"}
        </p>
      </div>

      {/* Cámara con guías */}
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>

        {/* Video — espejado para que sea natural */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          muted
          playsInline
        />

        {/* Canvas landmarks — también espejado */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Óvalo guía de rostro */}
        {(estado === "guia" || estado === "procesando") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`border-4 rounded-full transition-colors duration-300 ${
                faceOk ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]" : "border-white/60"
              }`}
              style={{ width: "65%", height: "78%", marginTop: "-5%" }}
            />
          </div>
        )}

        {/* Overlay cargando */}
        {estado === "cargando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">{msg}</p>
          </div>
        )}

        {/* Overlay procesando */}
        {estado === "procesando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm font-medium">{msg || "Capturando..."}</p>
          </div>
        )}

        {/* Overlay éxito */}
        {estado === "ok" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90 gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-400" />
            <p className="text-white font-bold text-lg">¡Listo!</p>
          </div>
        )}

        {/* Indicador de rostro detectado */}
        {estado === "guia" && (
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${
            faceOk ? "bg-green-500 text-white" : "bg-black/50 text-white/70"
          }`}>
            {faceOk ? "✓ Rostro detectado" : "Buscando rostro..."}
          </div>
        )}

        {/* Progreso de pasos */}
        {(estado === "guia" || estado === "procesando") && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {PASOS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < capturas.length ? "bg-green-400" :
                i === pasoIdx ? "bg-white" : "bg-white/30"
              }`} />
            ))}
          </div>
        )}
      </div>

      {/* Instrucción del paso actual */}
      {estado === "guia" && (
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">{paso.emoji}</span>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Paso {pasoIdx + 1} de {PASOS.length}
            </p>
            <p className="text-white font-semibold text-sm mt-0.5">{paso.label}</p>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {msg && estado !== "cargando" && estado !== "procesando" && estado !== "ok" && (
        <div className={`px-4 py-3 rounded-xl text-sm text-center font-medium border ${
          estado === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {msg}
        </div>
      )}

      {/* Botones */}
      {estado === "guia" && (
        <button
          onClick={capturarPaso}
          disabled={!faceOk}
          className="w-full py-4 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base active:scale-95"
        >
          {pasoIdx === 0 ? "Comenzar registro" : `Capturar paso ${pasoIdx + 1}`}
        </button>
      )}

      {estado === "ok" && (
        <button
          onClick={reiniciar}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Registrar de nuevo
        </button>
      )}

      {estado === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-800 transition-colors"
        >
          Reintentar
        </button>
      )}

      <p className="text-xs text-gray-400 text-center">
        Tu imagen <strong>no se almacena</strong> — solo los datos matemáticos del rostro.
      </p>
    </div>
  );
}

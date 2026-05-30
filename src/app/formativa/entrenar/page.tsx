"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

type FaceApi = typeof import("@vladmandic/face-api");

const MODEL_URL = "/models";

async function cargarModelos(faceapi: FaceApi) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}

export default function EntrenarPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const faceApiRef = useRef<FaceApi | null>(null);

  const [estado, setEstado]   = useState<"cargando"|"listo"|"capturando"|"ok"|"error">("cargando");
  const [msg,    setMsg]      = useState("Cargando modelos de reconocimiento...");
  const [yaTiene, setYaTiene] = useState(false);

  // Cargar face-api y cámara
  useEffect(() => {
    let stream: MediaStream;

    (async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceApiRef.current = faceapi;
        await cargarModelos(faceapi);

        // Verificar si ya tiene rostro
        const res = await fetch("/api/formativa/entrenar");
        const data = await res.json();
        if (data.descriptor) setYaTiene(true);

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setEstado("listo");
        setMsg(data.descriptor ? "Rostro ya registrado. Puedes actualizarlo." : "Coloca tu rostro frente a la cámara y presiona Capturar.");
      } catch {
        setEstado("error");
        setMsg("Error al cargar la cámara o los modelos.");
      }
    })();

    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capturar = useCallback(async () => {
    const faceapi = faceApiRef.current;
    if (!faceapi || !videoRef.current) return;

    setEstado("capturando");
    setMsg("Detectando rostro...");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setEstado("listo");
        setMsg("No se detectó ningún rostro. Intenta de nuevo.");
        return;
      }

      // Dibujar en canvas
      if (canvasRef.current && videoRef.current) {
        const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
        const resized = faceapi.resizeResults(detection, dims);
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      }

      const descriptor = Array.from(detection.descriptor);

      const res = await fetch("/api/formativa/entrenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor }),
      });

      if (!res.ok) {
        const d = await res.json();
        setEstado("error");
        setMsg(d.error ?? "Error al guardar.");
        return;
      }

      setEstado("ok");
      setYaTiene(true);
      setMsg("¡Rostro registrado exitosamente!");
    } catch {
      setEstado("error");
      setMsg("Error al procesar el rostro.");
    }
  }, []);

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-700" />
          Registrar mi rostro
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Necesario para marcar asistencia con reconocimiento facial</p>
      </div>

      {/* Cámara */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {estado === "cargando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">Cargando modelos...</p>
          </div>
        )}
        {estado === "ok" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/80 gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-white font-semibold">¡Rostro registrado!</p>
          </div>
        )}
      </div>

      {/* Mensaje */}
      <div className={`px-4 py-3 rounded-xl text-sm text-center font-medium ${
        estado === "ok"    ? "bg-green-50 text-green-700 border border-green-200" :
        estado === "error" ? "bg-red-50 text-red-700 border border-red-200" :
                             "bg-gray-50 text-gray-600 border border-gray-200"
      }`}>
        {msg}
      </div>

      {/* Botones */}
      <div className="space-y-3">
        {(estado === "listo" || estado === "error") && (
          <button onClick={capturar}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-800 transition-colors">
            <Camera className="w-5 h-5" />
            {yaTiene ? "Actualizar rostro" : "Capturar rostro"}
          </button>
        )}
        {estado === "capturando" && (
          <button disabled className="w-full flex items-center justify-center gap-2 py-3 bg-red-700/50 text-white font-semibold rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
          </button>
        )}
        {estado === "ok" && (
          <button onClick={() => { setEstado("listo"); setMsg("Puedes capturar nuevamente si lo deseas."); }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Capturar de nuevo
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tu imagen <strong>no se almacena</strong> — solo los datos matemáticos del rostro (128 números).
      </p>
    </div>
  );
}

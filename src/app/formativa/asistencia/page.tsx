"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Camera, CheckCircle2, Loader2, AlertCircle, CalendarDays, Clock } from "lucide-react";

type FaceApi = typeof import("@vladmandic/face-api");

const MODEL_URL = "/models";
const UMBRAL_SIMILITUD = 0.5; // distancia euclidiana máxima

async function cargarModelos(faceapi: FaceApi) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}

interface Asistencia {
  id: number; fecha: string; hora_entrada: string; lat: number; lng: number;
}

export default function AsistenciaPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const faceApiRef = useRef<FaceApi | null>(null);
  const descriptorRef = useRef<Float32Array | null>(null);

  const [fase,      setFase]      = useState<"init"|"ubicacion"|"camara"|"verificando"|"ok"|"error">("init");
  const [msg,       setMsg]       = useState("");
  const [historial, setHistorial] = useState<Asistencia[]>([]);
  const [posicion,  setPosicion]  = useState<{ lat: number; lng: number } | null>(null);

  const cargarHistorial = useCallback(async () => {
    const res = await fetch("/api/formativa/asistencia");
    const data = await res.json();
    if (Array.isArray(data)) setHistorial(data);
  }, []);

  // Inicialización: cargar modelos + descriptor + historial
  useEffect(() => {
    (async () => {
      setFase("init");
      setMsg("Cargando modelos...");
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceApiRef.current = faceapi;
        await cargarModelos(faceapi);

        // Obtener descriptor guardado
        const res = await fetch("/api/formativa/entrenar");
        const data = await res.json();
        if (!data.descriptor) {
          setFase("error");
          setMsg("No tienes rostro registrado. Ve a la sección Entrenamiento primero.");
          return;
        }
        descriptorRef.current = new Float32Array(data.descriptor);

        await cargarHistorial();
        setFase("ubicacion");
        setMsg("Verificando tu ubicación...");
        verificarUbicacion();
      } catch {
        setFase("error");
        setMsg("Error al cargar. Verifica tu conexión.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function verificarUbicacion() {
    if (!navigator.geolocation) {
      setFase("error");
      setMsg("Tu dispositivo no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFase("camara");
        setMsg("Ubicación verificada. Prepara tu rostro frente a la cámara.");
        iniciarCamara();
      },
      () => {
        setFase("error");
        setMsg("No se pudo obtener tu ubicación. Activa el GPS y recarga.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setFase("error");
      setMsg("No se pudo acceder a la cámara.");
    }
  }

  function detenerCamara() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
  }

  const verificarRostro = useCallback(async () => {
    const faceapi = faceApiRef.current;
    if (!faceapi || !videoRef.current || !descriptorRef.current || !posicion) return;

    setFase("verificando");
    setMsg("Verificando identidad...");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFase("camara");
        setMsg("No se detectó tu rostro. Asegúrate de tener buena iluminación.");
        return;
      }

      const distancia = faceapi.euclideanDistance(
        Array.from(detection.descriptor),
        Array.from(descriptorRef.current)
      );

      if (distancia > UMBRAL_SIMILITUD) {
        setFase("camara");
        setMsg(`Rostro no coincide (dist: ${distancia.toFixed(2)}). Intenta de nuevo.`);
        return;
      }

      // Marcar asistencia
      const res = await fetch("/api/formativa/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: posicion.lat, lng: posicion.lng }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFase(res.status === 409 ? "ok" : "camara");
        setMsg(data.error ?? "Error al registrar.");
        if (res.status === 409) detenerCamara();
        return;
      }

      detenerCamara();
      setFase("ok");
      setMsg("¡Asistencia registrada exitosamente!");
      await cargarHistorial();
    } catch {
      setFase("camara");
      setMsg("Error al procesar. Intenta de nuevo.");
    }
  }, [posicion, cargarHistorial]);

  function reintentar() {
    setFase("ubicacion");
    setMsg("Verificando ubicación...");
    verificarUbicacion();
  }

  function formatFecha(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
  }

  function formatHora(t: string) {
    return t.slice(0, 5);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-red-700" />
          Marcar asistencia
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Reconocimiento facial + verificación de ubicación</p>
      </div>

      {/* Estado */}
      <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
        fase === "ok"         ? "bg-green-50 text-green-700 border-green-200" :
        fase === "error"      ? "bg-red-50 text-red-700 border-red-200" :
        fase === "ubicacion"  ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-gray-50 text-gray-600 border-gray-200"
      }`}>
        {fase === "init" || fase === "verificando" ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> :
         fase === "ok"      ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
         fase === "error"   ? <AlertCircle  className="w-4 h-4 shrink-0" /> :
         fase === "ubicacion" ? <MapPin className="w-4 h-4 shrink-0" /> :
         <Camera className="w-4 h-4 shrink-0" />}
        <span>{msg}</span>
      </div>

      {/* Cámara */}
      {(fase === "camara" || fase === "verificando") && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {fase === "verificando" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={verificarRostro}
            disabled={fase === "verificando"}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-800 disabled:opacity-50 transition-colors"
          >
            <Camera className="w-5 h-5" />
            {fase === "verificando" ? "Verificando..." : "Verificar y marcar asistencia"}
          </button>
        </div>
      )}

      {/* Error con botón reintentar */}
      {fase === "error" && msg.includes("GPS") || fase === "error" && msg.includes("ubicación") ? (
        <button onClick={reintentar}
          className="w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
          Reintentar
        </button>
      ) : null}

      {/* Historial */}
      {historial.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Mis asistencias recientes</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {historial.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{formatFecha(a.fecha)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatHora(a.hora_entrada)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

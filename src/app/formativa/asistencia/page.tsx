"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Camera, CheckCircle2, Loader2, AlertCircle, CalendarDays, Clock, LogIn, LogOut } from "lucide-react";

type FaceApi = typeof import("@vladmandic/face-api");
const MODEL_URL = "/models";
const UMBRAL = 0.5;

async function cargarModelos(faceapi: FaceApi) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}

interface Asistencia {
  id: number; fecha: string; hora_entrada: string; hora_salida: string | null;
}

export default function AsistenciaPage() {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const faceApiRef    = useRef<FaceApi | null>(null);
  const descriptorRef = useRef<Float32Array | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);

  const [fase,      setFase]      = useState<"init"|"ubicacion"|"camara"|"verificando"|"ok"|"error">("init");
  const [msg,       setMsg]       = useState("");
  const [historial, setHistorial] = useState<Asistencia[]>([]);
  const [posicion,  setPosicion]  = useState<{ lat: number; lng: number } | null>(null);
  const [tipo,      setTipo]      = useState<"entrada"|"salida"|null>(null);
  const [pendiente, setPendiente] = useState<"entrada"|"salida"|null>(null); // qué marcar después de verificar GPS

  const cargarHistorial = useCallback(async () => {
    const res = await fetch("/api/formativa/asistencia");
    const data = await res.json();
    if (Array.isArray(data)) setHistorial(data);
  }, []);

  useEffect(() => {
    (async () => {
      setFase("init");
      setMsg("Cargando modelos...");
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceApiRef.current = faceapi;
        await cargarModelos(faceapi);

        const res = await fetch("/api/formativa/entrenar");
        const data = await res.json();
        if (!data.descriptor) {
          setFase("error");
          setMsg("No tienes rostro registrado. Ve a Entrenamiento primero.");
          return;
        }
        descriptorRef.current = new Float32Array(data.descriptor);
        await cargarHistorial();
        setFase("ubicacion");
        setMsg("");
      } catch {
        setFase("error");
        setMsg("Error al cargar. Verifica tu conexión.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pedirUbicacion(tipoMarca: "entrada" | "salida") {
    setPendiente(tipoMarca);
    if (!navigator.geolocation) {
      setFase("error");
      setMsg("Tu dispositivo no soporta geolocalización.");
      return;
    }
    setFase("init");
    setMsg("Obteniendo ubicación...");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosicion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setTipo(tipoMarca);
        setFase("camara");
        setMsg("");
        iniciarCamara();
      },
      (err) => {
        setFase("error");
        if (err.code === 1) setMsg("Permiso de ubicación denegado. Actívalo en Ajustes → Safari → Localización.");
        else if (err.code === 2) setMsg("No se pudo obtener la ubicación. Asegúrate de tener GPS activo.");
        else setMsg("Tiempo agotado. Verifica que el GPS esté activo e intenta de nuevo.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
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
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  // Reanudar cámara si la página vuelve al primer plano mientras está activa
  useEffect(() => {
    async function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (!videoRef.current || !streamRef.current) return;
      try {
        if (streamRef.current.getTracks().every(t => t.readyState === "ended")) {
          await iniciarCamara();
        } else if (videoRef.current.paused) {
          await videoRef.current.play();
        }
      } catch { /* ignorar */ }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarRostro = useCallback(async () => {
    const faceapi = faceApiRef.current;
    if (!faceapi || !videoRef.current || !descriptorRef.current || !posicion || !tipo) return;

    setFase("verificando");
    setMsg("Verificando identidad...");

    try {
      const det = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!det) {
        setFase("camara");
        setMsg("No se detectó tu rostro. Mejora la iluminación e intenta de nuevo.");
        return;
      }

      const dist = faceapi.euclideanDistance(Array.from(det.descriptor), Array.from(descriptorRef.current));
      if (dist > UMBRAL) {
        setFase("camara");
        setMsg(`Rostro no coincide. Intenta de nuevo.`);
        return;
      }

      const res = await fetch("/api/formativa/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: posicion.lat, lng: posicion.lng, tipo }),
      });
      const data = await res.json();

      detenerCamara();

      if (!res.ok) {
        setFase("error");
        setMsg(data.error ?? "Error al registrar.");
        return;
      }

      setFase("ok");
      setMsg(tipo === "entrada" ? "¡Entrada registrada!" : "¡Salida registrada!");
      await cargarHistorial();
    } catch {
      setFase("camara");
      setMsg("Error al procesar. Intenta de nuevo.");
    }
  }, [posicion, tipo, cargarHistorial]);

  function reintentar() {
    detenerCamara();
    setFase("ubicacion");
    setMsg("");
    setTipo(null);
    setPendiente(null);
  }

  // Determinar estado del día actual
  const hoy = new Date().toISOString().slice(0, 10);
  const registroHoy = historial.find(a => a.fecha === hoy);
  const tieneEntrada = !!registroHoy;
  const tieneSalida  = !!registroHoy?.hora_salida;

  function formatFecha(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
  }
  function formatHora(t: string | null) {
    return t ? t.slice(0, 5) : "—";
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-red-700" />
          Marcar asistencia
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Reconocimiento facial + verificación de ubicación</p>
      </div>

      {/* Estado del día */}
      {fase !== "init" && fase !== "camara" && fase !== "verificando" && historial.length >= 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Hoy</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 flex flex-col items-center gap-1 border ${tieneEntrada ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <LogIn className={`w-5 h-5 ${tieneEntrada ? "text-green-600" : "text-gray-300"}`} />
              <p className="text-xs font-semibold text-gray-600">Entrada</p>
              <p className={`text-sm font-bold ${tieneEntrada ? "text-green-700" : "text-gray-300"}`}>
                {tieneEntrada ? formatHora(registroHoy!.hora_entrada) : "—"}
              </p>
            </div>
            <div className={`rounded-lg p-3 flex flex-col items-center gap-1 border ${tieneSalida ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
              <LogOut className={`w-5 h-5 ${tieneSalida ? "text-blue-600" : "text-gray-300"}`} />
              <p className="text-xs font-semibold text-gray-600">Salida</p>
              <p className={`text-sm font-bold ${tieneSalida ? "text-blue-700" : "text-gray-300"}`}>
                {tieneSalida ? formatHora(registroHoy!.hora_salida!) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje estado */}
      {(fase === "init" || fase === "error" || fase === "ok") && msg && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          fase === "ok"    ? "bg-green-50 text-green-700 border-green-200" :
          fase === "error" ? "bg-red-50 text-red-700 border-red-200" :
                             "bg-gray-50 text-gray-600 border-gray-200"
        }`}>
          {fase === "init"  ? <Loader2    className="w-4 h-4 animate-spin shrink-0" /> :
           fase === "ok"    ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
                              <AlertCircle  className="w-4 h-4 shrink-0" />}
          <span>{msg}</span>
        </div>
      )}

      {/* Botones entrada / salida */}
      {fase === "ubicacion" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => pedirUbicacion("entrada")}
            disabled={tieneEntrada}
            className="flex flex-col items-center gap-2 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <LogIn className="w-6 h-6" />
            <span className="text-sm">Registrar entrada</span>
          </button>
          <button
            onClick={() => pedirUbicacion("salida")}
            disabled={!tieneEntrada || tieneSalida}
            className="flex flex-col items-center gap-2 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-sm">Registrar salida</span>
          </button>
        </div>
      )}

      {/* Cámara */}
      {(fase === "camara" || fase === "verificando") && (
        <div className="space-y-3">
          <div className={`text-center text-sm font-semibold py-2 rounded-lg ${tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {tipo === "entrada" ? "Registrando ENTRADA" : "Registrando SALIDA"}
          </div>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} muted playsInline />
            {fase === "verificando" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <p className="text-white text-sm">{msg}</p>
              </div>
            )}
            {/* Óvalo guía */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 200 260" className="w-[65%] h-[78%]" style={{ marginTop: "-5%" }}>
                <ellipse cx="100" cy="130" rx="90" ry="120" fill="none" strokeWidth="4" stroke="rgba(255,255,255,0.5)" strokeDasharray="12 6" />
              </svg>
            </div>
          </div>
          {fase === "camara" && (
            <>
              {msg && <p className="text-xs text-amber-600 text-center font-medium">{msg}</p>}
              <button
                onClick={verificarRostro}
                className={`w-full flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl active:scale-95 transition-all ${tipo === "entrada" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                <Camera className="w-5 h-5" />
                Verificar y {tipo === "entrada" ? "marcar entrada" : "marcar salida"}
              </button>
              <button onClick={reintentar} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {/* Reintentar en error */}
      {fase === "error" && (
        <button onClick={reintentar}
          className="w-full py-3 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors">
          Reintentar
        </button>
      )}

      {/* Volver después de ok */}
      {fase === "ok" && (
        <button onClick={reintentar}
          className="w-full py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
          Volver
        </button>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Historial reciente</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {historial.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-sm font-semibold text-gray-900 flex-1">{formatFecha(a.fecha)}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <LogIn className="w-3 h-3 text-green-500" />
                    {formatHora(a.hora_entrada)}
                  </span>
                  <span className="flex items-center gap-1">
                    <LogOut className="w-3 h-3 text-blue-500" />
                    {formatHora(a.hora_salida)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

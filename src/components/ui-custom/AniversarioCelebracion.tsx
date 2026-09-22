"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Flame } from "lucide-react";

const FUNDACION_ANIO = 1999;
const FUNDACION_MES = 8; // septiembre (0-index)
const FUNDACION_DIA = 25;

type Fase = "antes" | "hoy" | "despues";

interface Ember {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
}

function generarEmbers(cantidad: number): Ember[] {
  return Array.from({ length: cantidad }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 4,
    drift: (Math.random() - 0.5) * 60,
    size: 3 + Math.random() * 4,
  }));
}

export function AniversarioCelebracion() {
  const [visible, setVisible] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [anios, setAnios] = useState(0);
  const [fase, setFase] = useState<Fase>("hoy");
  const [diasFaltantes, setDiasFaltantes] = useState(0);
  const [embers] = useState(() => generarEmbers(18));

  useEffect(() => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const aniversarioEsteAnio = new Date(hoy.getFullYear(), FUNDACION_MES, FUNDACION_DIA);
    const diffDias = Math.round((inicioHoy.getTime() - aniversarioEsteAnio.getTime()) / 86400000);

    // Se muestra una sola vez por persona (por navegador), sin importar la fecha.
    const claveVisto = `bomberos150_aniversario_${hoy.getFullYear()}_visto`;
    if (localStorage.getItem(claveVisto)) return;

    setAnios(hoy.getFullYear() - FUNDACION_ANIO);
    setFase(diffDias < 0 ? "antes" : diffDias === 0 ? "hoy" : "despues");
    setDiasFaltantes(Math.abs(diffDias));
    setVisible(true);
  }, []);

  function cerrar() {
    setCerrando(true);
    setTimeout(() => setVisible(false), 350);
    localStorage.setItem(`bomberos150_aniversario_${new Date().getFullYear()}_visto`, "1");
  }

  if (!visible) return null;

  const mensaje =
    fase === "antes"
      ? `Faltan ${diasFaltantes} día${diasFaltantes === 1 ? "" : "s"} para nuestro aniversario`
      : fase === "hoy"
      ? "¡Hoy celebramos nuestro aniversario!"
      : "Seguimos de fiesta por nuestro aniversario";

  return (
    <>
      <style>{`
        @keyframes aniv-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes aniv-card-in {
          0%   { opacity: 0; transform: scale(0.82) translateY(24px); }
          60%  { opacity: 1; transform: scale(1.03) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aniv-card-out {
          to { opacity: 0; transform: scale(0.9) translateY(12px); }
        }
        @keyframes aniv-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.0), 0 0 60px 10px rgba(220,38,38,0.15); }
          50%      { box-shadow: 0 0 0 0 rgba(217,119,6,0.0), 0 0 90px 22px rgba(220,38,38,0.32); }
        }
        @keyframes aniv-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes aniv-flame-flicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%      { transform: scale(1.08) rotate(2deg); }
        }
        @keyframes aniv-ember-rise {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translate(var(--drift), -120vh); opacity: 0; }
        }
        .aniv-backdrop { animation: aniv-backdrop-in 0.4s ease both; }
        .aniv-card { animation: aniv-card-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both, aniv-glow-pulse 3.5s ease-in-out 0.7s infinite; }
        .aniv-card.aniv-cerrando { animation: aniv-card-out 0.3s ease both; }
        .aniv-shimmer-text {
          background: linear-gradient(90deg, #fcd34d 0%, #fef3c7 25%, #f59e0b 50%, #fef3c7 75%, #fcd34d 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: aniv-shimmer 3.5s linear infinite;
        }
        .aniv-flame { animation: aniv-flame-flicker 1.8s ease-in-out infinite; transform-origin: bottom center; }
        .aniv-ember { position: absolute; bottom: 0; border-radius: 9999px; background: radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 100%); animation: aniv-ember-rise linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .aniv-card, .aniv-shimmer-text, .aniv-flame, .aniv-ember { animation: none !important; }
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0f1a] via-[#111827]/95 to-[#450a0a]/90 backdrop-blur-sm aniv-backdrop overflow-hidden`}
      >
        {embers.map((e, i) => (
          <span
            key={i}
            className="aniv-ember"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              // @ts-expect-error CSS custom property
              "--drift": `${e.drift}px`,
            }}
          />
        ))}

        <div
          className={`aniv-card ${cerrando ? "aniv-cerrando" : ""} relative w-full max-w-md rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#1a1f2e] to-[#2a0f0f] px-6 py-8 sm:px-10 sm:py-10 text-center shadow-2xl`}
        >
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto mb-4 relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
            <Image src="/LOGO_150.png" alt="Logo Cía. 150" width={80} height={80} className="relative rounded-full" priority />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-amber-400 aniv-flame" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300/90 font-semibold">Aniversario</p>
            <Flame className="w-4 h-4 text-amber-400 aniv-flame" style={{ animationDelay: "0.4s" }} />
          </div>

          <p className="aniv-shimmer-text text-7xl sm:text-8xl font-extrabold leading-none tracking-tight">
            {anios}
          </p>
          <p className="aniv-shimmer-text text-xl sm:text-2xl font-bold tracking-[0.3em] -mt-1 mb-4">
            AÑOS
          </p>

          <h2 className="text-white font-bold text-base sm:text-lg leading-snug">
            Compañía de Bomberos Voluntarios
            <br />
            Puente Piedra N.° 150
          </h2>
          <p className="text-white/50 text-xs mt-1.5">
            Fundada el 25 de septiembre de {FUNDACION_ANIO}
          </p>

          <div className="mt-5 mb-1 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-amber-300 font-semibold text-sm">{mensaje}</p>
          </div>

          <p className="text-white/60 text-xs mt-4 leading-relaxed">
            Gracias por tanta vocación, sacrificio y entrega al servicio de Puente Piedra.
          </p>

          <button
            onClick={cerrar}
            className="mt-6 text-xs font-semibold text-white/50 hover:text-white transition-colors underline underline-offset-4"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}

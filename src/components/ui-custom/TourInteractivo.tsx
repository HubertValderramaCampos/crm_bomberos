"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, X, Flame, Shield, Zap,
  BarChart3, Users, Siren, Truck, Star,
} from "lucide-react";

interface Paso {
  target: string;        // data-tour="..."
  titulo: string;
  desc: string;
  icon: React.ElementType;
  pos?: "top" | "bottom" | "left" | "right";
}

const PASOS: Paso[] = [
  {
    target:  "estado-cia",
    titulo:  "Estado en tiempo real",
    desc:    "Aquí ves el pulso de la compañía: cuántos están en turno, la flota y si hay emergencias activas ahora mismo.",
    icon:    Shield,
    pos:     "bottom",
  },
  {
    target:  "mis-kpis",
    titulo:  "Tus estadísticas",
    desc:    "Tus horas, días asistidos y emergencias del mes. Todo se actualiza automáticamente cada vez que estás en turno.",
    icon:    BarChart3,
    pos:     "bottom",
  },
  {
    target:  "progreso-card",
    titulo:  "Tu racha y beneficios",
    desc:    "Cuanto más seguido asistas, más se desbloquea. Con 1 semana ves quién está en turno. Con 2, el estado de las unidades.",
    icon:    Flame,
    pos:     "left",
  },
  {
    target:  "ranking-card",
    titulo:  "Ranking del mes",
    desc:    "Compite con tus compañeros. Los 10 bomberos con más horas aparecen aquí. Cumple tu meta para ver el ranking completo.",
    icon:    Star,
    pos:     "top",
  },
  {
    target:  "nav-operatividad",
    titulo:  "Operatividad",
    desc:    "Personal en turno, estado de unidades y emergencias activas en una sola vista.",
    icon:    Siren,
    pos:     "right",
  },
  {
    target:  "nav-perfil",
    titulo:  "Tu perfil",
    desc:    "Historial de asistencia, emergencias y tus beneficios desbloqueados. Todo tuyo.",
    icon:    Users,
    pos:     "right",
  },
];

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8;

export function TourInteractivo({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]       = useState(0);
  const [rect, setRect]       = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);

  const current = PASOS[step];

  const medirElemento = useCallback(() => {
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current.target]);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { medirElemento(); setVisible(true); }, 150);
    return () => clearTimeout(t);
  }, [step, medirElemento]);

  useEffect(() => {
    const onResize = () => medirElemento();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [medirElemento]);

  function siguiente() {
    if (step < PASOS.length - 1) setStep(s => s + 1);
    else onComplete();
  }
  function anterior() { if (step > 0) setStep(s => s - 1); }

  // Posición del tooltip relativa al rect
  function tooltipStyle(): React.CSSProperties {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

    const GAP = 16;
    const TW  = 300;

    const pos = current.pos ?? "bottom";

    if (pos === "bottom") return {
      top:  rect.top + rect.height + GAP,
      left: Math.min(Math.max(rect.left + rect.width / 2 - TW / 2, 12), window.innerWidth - TW - 12),
    };
    if (pos === "top") return {
      top:  rect.top - GAP - 10,   // altura aproximada del tooltip, se ajusta con transform
      left: Math.min(Math.max(rect.left + rect.width / 2 - TW / 2, 12), window.innerWidth - TW - 12),
      transform: "translateY(-100%)",
    };
    if (pos === "right") return {
      top:  rect.top + rect.height / 2,
      left: rect.left + rect.width + GAP,
      transform: "translateY(-50%)",
    };
    if (pos === "left") return {
      top:  rect.top + rect.height / 2,
      left: rect.left - GAP - TW,
      transform: "translateY(-50%)",
    };
    return {};
  }

  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">

      {/* Overlay con hueco */}
      {rect && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ cursor: "default" }}
        >
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#tour-mask)"
          />
          {/* Borde brillante alrededor del elemento */}
          <rect
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx="12"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            opacity={visible ? 1 : 0}
            style={{ transition: "opacity 0.3s" }}
          />
        </svg>
      )}

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto"
        style={{
          ...tooltipStyle(),
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s",
          width: 300,
          zIndex: 60,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm font-bold text-gray-900 flex-1">{current.titulo}</p>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <p className="text-sm text-gray-600 leading-relaxed">{current.desc}</p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 flex items-center gap-2">
            {/* Dots */}
            <div className="flex gap-1 flex-1">
              {PASOS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-4 bg-red-600" : i < step ? "w-1.5 bg-red-300" : "w-1.5 bg-gray-200"
                }`} />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={anterior}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={siguiente}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
              >
                {step === PASOS.length - 1 ? "¡Listo!" : "Siguiente"}
                {step < PASOS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then(m => m.Player),
  { ssr: false }
);

interface Props {
  horas: number;
  meta: number;
  pct: number;
  grado: string;
  nombre: string;
}

function getEstado(pct: number) {
  if (pct >= 100) return {
    src: "/mascota/celebracion.json",
    label: "¡Meta cumplida!",
    mensaje: "Eres un referente de la compañía este mes.",
    color: "text-green-700", bg: "from-green-50 to-emerald-100 border-green-200",
    barColor: "from-green-400 to-emerald-500",
  };
  if (pct >= 60) return {
    src: "/mascota/activo.json",
    label: "¡Buen ritmo!",
    mensaje: "Vas bien encaminado, sigue así.",
    color: "text-orange-700", bg: "from-orange-50 to-amber-100 border-amber-200",
    barColor: "from-orange-400 to-amber-400",
  };
  if (pct > 0) return {
    src: "/mascota/idle.jso.json",
    label: "En progreso",
    mensaje: "Necesitas más horas para cumplir la meta.",
    color: "text-amber-700", bg: "from-amber-50 to-yellow-100 border-yellow-200",
    barColor: "from-amber-400 to-yellow-400",
  };
  return {
    src: "/mascota/dormido.json",
    label: "Sin registros",
    mensaje: "No hay horas registradas este mes.",
    color: "text-gray-500", bg: "from-gray-50 to-gray-100 border-gray-200",
    barColor: "from-gray-300 to-gray-400",
  };
}

export function MascotaHero({ horas, meta, pct, grado, nombre }: Props) {
  const e = getEstado(pct);

  return (
    <div className={`bg-gradient-to-br ${e.bg} border rounded-2xl p-5 flex flex-col items-center text-center h-full justify-between min-h-[220px]`}>

      <div className="w-32 h-32 mt-1">
        <Player
          autoplay
          loop
          src={e.src}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="mt-1 mb-4">
        <p className={`text-base font-bold ${e.color}`}>{e.label}</p>
        <p className="text-xs text-gray-500 mt-1 leading-snug px-2">{e.mensaje}</p>
        <p className="text-xs text-gray-400 mt-1">{nombre}</p>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-gray-500 font-medium">{horas}h acumuladas</span>
          <span className={`font-bold ${e.color}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden border border-white/80">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${e.barColor} transition-all duration-700`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Meta: <span className="font-semibold text-gray-600">{meta}h / mes</span>
          {grado && <span className="ml-1">· {grado}</span>}
        </p>
      </div>
    </div>
  );
}

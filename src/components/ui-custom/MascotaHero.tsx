"use client";
import { Player } from "@lottiefiles/react-lottie-player";

interface Props {
  horas: number;
  meta: number;
  pct: number;
  grado: string;
  nombre: string;
}

function getMascotaEstado(pct: number) {
  if (pct >= 100) return {
    // Animación de celebración — pon aquí el JSON de "perro saltando/festejando"
    src: "/mascota/celebracion.json",
    mensaje: "¡Meta cumplida! Eres un héroe de la compañía 🏆",
    color: "text-green-700",
    bg: "from-green-50 to-emerald-100 border-green-200",
  };
  if (pct >= 60) return {
    // Animación activa — pon el JSON de "perro corriendo/activo"
    src: "/mascota/activo.json",
    mensaje: "¡Buen ritmo! Sigue así, casi llegas 🔥",
    color: "text-blue-700",
    bg: "from-blue-50 to-sky-100 border-blue-200",
  };
  if (pct > 0) return {
    // Animación idle — pon el JSON de "perro sentado/esperando"
    src: "/mascota/idle.json",
    mensaje: "Tu mascota espera más horas... ¡a entrenar!",
    color: "text-amber-700",
    bg: "from-amber-50 to-yellow-100 border-amber-200",
  };
  return {
    // Animación dormido — pon el JSON de "perro durmiendo"
    src: "/mascota/dormido.json",
    mensaje: "Sin registros este mes. ¡Despierta a tu pastor!",
    color: "text-gray-500",
    bg: "from-gray-50 to-gray-100 border-gray-200",
  };
}

export function MascotaHero({ horas, meta, pct, grado }: Props) {
  const estado = getMascotaEstado(pct);

  return (
    <div className={`bg-gradient-to-br ${estado.bg} border rounded-2xl p-5 flex flex-col items-center text-center h-full justify-between min-h-[300px]`}>

      {/* Mascota Lottie */}
      <div className="flex-1 flex items-center justify-center w-full">
        <Player
          autoplay
          loop
          src={estado.src}
          style={{ height: 180, width: 180 }}
        />
      </div>

      {/* Mensaje */}
      <p className={`text-sm font-semibold ${estado.color} leading-snug px-2 mb-3`}>
        {estado.mensaje}
      </p>

      {/* Barra de progreso */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 font-medium">{horas}h acumuladas</span>
          <span className={`text-xs font-bold ${estado.color}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden border border-white">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: pct >= 100
                ? "linear-gradient(to right, #16a34a, #22c55e)"
                : pct >= 60
                ? "linear-gradient(to right, #f97316, #facc15)"
                : "linear-gradient(to right, #dc2626, #f97316)",
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Meta: <span className="font-semibold text-gray-600">{meta}h / mes</span>
          {grado && <span className="ml-1">· {grado}</span>}
        </p>
      </div>
    </div>
  );
}

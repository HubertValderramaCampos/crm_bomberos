"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPinned } from "lucide-react";

interface Zona {
  numero: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  seccion: string;
}

const ZONAS: Zona[] = [
  {
    numero: "—",
    titulo: "CABINA",
    subtitulo: "EPRAS / APH / SCI",
    descripcion: "Equipo de respiración autocontenido, maletín de abordaje y pizarra SCI.",
    seccion: "CABINA, EPRAS Y MALETIN DE ABORDAJE",
  },
  {
    numero: "1",
    titulo: "RACK 01",
    subtitulo: "Accesorios de maniobra hidráulica",
    descripcion: "Almacenamiento y organización de accesorios hidráulicos para operaciones de abastecimiento y ataque contra incendios.",
    seccion: "RACK N° 01",
  },
  {
    numero: "2",
    titulo: "RACK 02",
    subtitulo: "Reserva de aire / equipos utilitarios",
    descripcion: "Cilindros de reserva y equipos utilitarios complementarios.",
    seccion: "RACK N° 02",
  },
  {
    numero: "3",
    titulo: "RACK 03",
    subtitulo: "Ventilación / kit fuga de gas",
    descripcion: "Atención de fugas de gases combustibles o tóxicos: equipo de ventilación mecánica, kit para control de fugas y mantas y herramientas antichispa.",
    seccion: "RACK N° 03",
  },
  {
    numero: "4",
    titulo: "RACK 04",
    subtitulo: "Abastecimiento / líneas de succión",
    descripcion: "Captación/abastecimiento mediante succión de reservorios, piscinas o hidrantes. Mangueras rígidas.",
    seccion: "RACK N° 04",
  },
  {
    numero: "5",
    titulo: "RACK 05",
    subtitulo: "Estabilización y sujeción vehicular",
    descripcion: "Tacos y cuñas de jebe, cadenas, eslingas y aparejos para estabilización y sujeción de vehículos.",
    seccion: "RACK N° 05",
  },
  {
    numero: "6",
    titulo: "RACK 06",
    subtitulo: "Acceso y alcance / trabajo en altura",
    descripcion: "Escaleras plegables, escalera de extensión, escalera tipo gancho, bicheros y pértiga.",
    seccion: "RACK N° 06",
  },
  {
    numero: "7",
    titulo: "RACK 07",
    subtitulo: "Suministro eléctrico auxiliar",
    descripcion: "Suministro eléctrico temporal para luminarias, herramientas y equipos auxiliares: generador eléctrico y extensiones.",
    seccion: "RACK N° 07",
  },
  {
    numero: "8",
    titulo: "RACK 08",
    subtitulo: "Herramientas manuales",
    descripcion: "Entrada forzada y acceso durante emergencias: halligans, hachas, mandarrias y cizallas.",
    seccion: "RACK N° 08",
  },
  {
    numero: "9",
    titulo: "RACK 09",
    subtitulo: "Equipos de poder / extricación",
    descripcion: "Apertura forzada, extracción y rescate: equipos de extricación Holmatro, cortadora a combustión de 12\" y accesorios de fuerza.",
    seccion: "RACK N° 09",
  },
  {
    numero: "—",
    titulo: "ROOF (TECHO)",
    subtitulo: "Cama de paños",
    descripcion: "Almacenamiento de paños de 2 1/2\" y 1 1/2\" para maniobras de ataque, protección y abastecimiento.",
    seccion: "ROOF, MANGUERAS Y VARIOS",
  },
];

const IMAGENES = [
  { src: "/vehiculos/m150-1/lateral.jpeg", alt: "Vista lateral — Cabina, Rack 01, Rack 02, Rack 03", caption: "Lateral · Cabina / Rack 01-03" },
  { src: "/vehiculos/m150-1/posterior.jpeg", alt: "Vista posterior — Rack 04, Rack 05, Rack 06", caption: "Posterior · Rack 04-06" },
  { src: "/vehiculos/m150-1/roof.jpeg", alt: "Vista superior — Roof, Rack 07, Rack 08, Rack 09", caption: "Roof · Rack 07-09" },
];

export function slugSeccion(seccion: string) {
  return "seccion-" + seccion
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function EstructuraDistribucionM1501() {
  const [abierto, setAbierto] = useState(false);

  function irASeccion(seccion: string) {
    const el = document.getElementById(slugSeccion(seccion));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3 hover:bg-gray-50/60 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <MapPinned className="w-3.5 h-3.5 text-red-700" />
          Estructura de distribución funcional
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {IMAGENES.map(img => (
              <div key={img.src} className="space-y-1.5">
                <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain" />
                </div>
                <p className="text-[11px] text-gray-400 text-center">{img.caption}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ZONAS.map(z => (
              <button
                key={z.seccion}
                onClick={() => irASeccion(z.seccion)}
                className="text-left flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/40 transition-colors"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center">
                  {z.numero}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-gray-900">{z.titulo} <span className="font-medium text-gray-400">· {z.subtitulo}</span></span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">{z.descripcion}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

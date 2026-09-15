"use client";

import Image from "next/image";

interface ZonaInfo {
  numero: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  imagen: { src: string; alt: string };
}

const LATERAL = { src: "/vehiculos/m150-1/lateral.jpeg", alt: "Vista lateral del camión con Cabina, Rack 01, Rack 02 y Rack 03 marcados" };
const POSTERIOR = { src: "/vehiculos/m150-1/posterior.jpeg", alt: "Vista posterior del camión con Rack 04, Rack 05 y Rack 06 marcados" };
const ROOF = { src: "/vehiculos/m150-1/roof.jpeg", alt: "Vista superior del camión con Roof, Rack 07, Rack 08 y Rack 09 marcados" };

/** Referencia visual por sección del checklist de la M150-1 (claves = seccion tal como está en checklist_item). */
export const REFERENCIA_M150_1: Record<string, ZonaInfo> = {
  "CABINA, EPRAS Y MALETIN DE ABORDAJE": {
    numero: "—", titulo: "CABINA", subtitulo: "EPRAS / APH / SCI",
    descripcion: "Equipo de respiración autocontenido, maletín de abordaje y pizarra SCI.",
    imagen: LATERAL,
  },
  "RACK N° 01": {
    numero: "1", titulo: "RACK 01", subtitulo: "Accesorios de maniobra hidráulica",
    descripcion: "Almacenamiento y organización de accesorios hidráulicos para operaciones de abastecimiento y ataque contra incendios.",
    imagen: LATERAL,
  },
  "RACK N° 02": {
    numero: "2", titulo: "RACK 02", subtitulo: "Reserva de aire / equipos utilitarios",
    descripcion: "Cilindros de reserva y equipos utilitarios complementarios.",
    imagen: LATERAL,
  },
  "RACK N° 03": {
    numero: "3", titulo: "RACK 03", subtitulo: "Ventilación / kit fuga de gas",
    descripcion: "Atención de fugas de gases combustibles o tóxicos: equipo de ventilación mecánica, kit para control de fugas y mantas y herramientas antichispa.",
    imagen: LATERAL,
  },
  "RACK N° 04": {
    numero: "4", titulo: "RACK 04", subtitulo: "Abastecimiento / líneas de succión",
    descripcion: "Captación/abastecimiento mediante succión de reservorios, piscinas o hidrantes. Mangueras rígidas.",
    imagen: POSTERIOR,
  },
  "RACK N° 05": {
    numero: "5", titulo: "RACK 05", subtitulo: "Estabilización y sujeción vehicular",
    descripcion: "Tacos y cuñas de jebe, cadenas, eslingas y aparejos para estabilización y sujeción de vehículos.",
    imagen: POSTERIOR,
  },
  "RACK N° 06": {
    numero: "6", titulo: "RACK 06", subtitulo: "Acceso y alcance / trabajo en altura",
    descripcion: "Escaleras plegables, escalera de extensión, escalera tipo gancho, bicheros y pértiga.",
    imagen: POSTERIOR,
  },
  "RACK N° 07": {
    numero: "7", titulo: "RACK 07", subtitulo: "Suministro eléctrico auxiliar",
    descripcion: "Suministro eléctrico temporal para luminarias, herramientas y equipos auxiliares: generador eléctrico y extensiones.",
    imagen: ROOF,
  },
  "RACK N° 08": {
    numero: "8", titulo: "RACK 08", subtitulo: "Herramientas manuales",
    descripcion: "Entrada forzada y acceso durante emergencias: halligans, hachas, mandarrias y cizallas.",
    imagen: ROOF,
  },
  "RACK N° 09": {
    numero: "9", titulo: "RACK 09", subtitulo: "Equipos de poder / extricación",
    descripcion: "Apertura forzada, extracción y rescate: equipos de extricación Holmatro, cortadora a combustión de 12\" y accesorios de fuerza.",
    imagen: ROOF,
  },
  "ROOF, MANGUERAS Y VARIOS": {
    numero: "—", titulo: "ROOF (TECHO)", subtitulo: "Cama de paños",
    descripcion: "Almacenamiento de paños de 2 1/2\" y 1 1/2\" para maniobras de ataque, protección y abastecimiento.",
    imagen: ROOF,
  },
};

/** Foto + descripción de referencia para una sección puntual del checklist. No renderiza nada si no hay referencia (otro vehículo, u otra sección sin foto). */
export function ReferenciaSeccion({ seccion }: { seccion: string }) {
  const z = REFERENCIA_M150_1[seccion];
  if (!z) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="relative w-full aspect-[16/10] bg-gray-50">
        <Image src={z.imagen.src} alt={z.imagen.alt} fill sizes="(max-width: 640px) 100vw, 700px" className="object-contain" />
        <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center shadow">
          {z.numero}
        </span>
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-900">{z.titulo} <span className="font-medium text-gray-400">· {z.subtitulo}</span></p>
        <p className="text-[11px] text-gray-500 mt-0.5">{z.descripcion}</p>
      </div>
    </div>
  );
}

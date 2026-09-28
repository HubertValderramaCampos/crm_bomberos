"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type ReactNode } from "react";

const MascotasScene = dynamic(() => import("./MascotasScene"), {
  ssr: false,
  loading: () => <MascotasSkeleton />,
});

const MASCOTAS_FALLBACK = [
  { nombre: "Fénix", img: "/mascotas/fenix.jpeg", color: "#b3271f" },
  { nombre: "Kayan", img: "/mascotas/kayan.jpeg", color: "#c9891f" },
  { nombre: "Valky", img: "/mascotas/valky.jpeg", color: "#3d5266" },
];

function MascotasSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-14 sm:w-20 lg:w-24 aspect-[4/5] rounded-xl bg-white/5 border border-white/10 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

/** Vitrina estática (sin WebGL) — se activa si la escena 3D falla en tiempo de ejecución. */
function MascotasFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-4" style={{ perspective: "700px" }}>
      {MASCOTAS_FALLBACK.map((m) => (
        <div
          key={m.nombre}
          className="group relative w-14 sm:w-20 lg:w-24 aspect-[4/5] rounded-xl overflow-hidden border-2 shadow-lg transition-transform duration-300 ease-out hover:[transform:rotateY(10deg)_scale(1.08)]"
          style={{ borderColor: m.color }}
        >
          <Image src={m.img} alt={m.nombre} fill sizes="96px" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
            <span className="text-white text-[9px] sm:text-[10px] font-bold">{m.nombre}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

class Scene3DErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("MascotasScene 3D falló, usando vitrina estática de respaldo:", error);
  }
  render() {
    if (this.state.hasError) return <MascotasFallback />;
    return this.props.children;
  }
}

export function MascotasShowcase3D() {
  return (
    <div className="relative w-full h-28 sm:h-32 lg:h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-[#1a1210] via-[#120c0b] to-[#0a0706]">
      <Scene3DErrorBoundary>
        <MascotasScene />
      </Scene3DErrorBoundary>
    </div>
  );
}

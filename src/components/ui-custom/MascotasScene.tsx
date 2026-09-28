"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { X } from "lucide-react";

interface MascotData {
  id: string;
  nombre: string;
  rol: string;
  frase: string;
  img: string;
  color: string;
}

const MASCOTAS: MascotData[] = [
  { id: "fenix", nombre: "Fénix", rol: "El Águila Vigilante", frase: "Siempre en alto, siempre contigo", img: "/mascotas/fenix.jpeg", color: "#b3271f" },
  { id: "kayan", nombre: "Kayan", rol: "El Otorongo", frase: "Siempre listo para servir", img: "/mascotas/kayan.jpeg", color: "#c9891f" },
  { id: "valky", nombre: "Valky", rol: "La Loba que Protege", frase: "Siempre lista para servir", img: "/mascotas/valky.jpeg", color: "#3d5266" },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function ParallaxRig({ enabled }: { enabled: boolean }) {
  useFrame((state) => {
    if (!enabled) {
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.08);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0.3, 0.08);
      state.camera.lookAt(0, 0, 0);
      return;
    }
    const { pointer, camera } = state;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.25, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.3 + pointer.y * 0.12, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function MascotCard({
  data,
  index,
  total,
  selected,
  onSelect,
  reducedMotion,
}: {
  data: MascotData;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const texture = useTexture(data.img);
  const { viewport } = useThree();
  const [hovered, setHovered] = useState(false);

  const frameMat = useRef<THREE.MeshStandardMaterial>(null!);
  const panelMat = useRef<THREE.MeshStandardMaterial>(null!);
  const photoMat = useRef<THREE.MeshStandardMaterial>(null!);

  const dragging = useRef(false);
  const totalDrag = useRef(0);
  const manualRotY = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  const isSelected = selected === index;
  const anySelected = selected !== null;
  const dimmed = anySelected && !isSelected;

  const baseX = useMemo(() => {
    const spacing = Math.min(viewport.width / total, 3.3);
    return (index - (total - 1) / 2) * spacing;
  }, [viewport.width, total, index]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      dragging.current = true;
      totalDrag.current = 0;
      let lastX = e.clientX;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX;
        lastX = ev.clientX;
        totalDrag.current += Math.abs(dx);
        const delta = dx * 0.008;
        manualRotY.current += delta;
        velocity.current = delta;
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (totalDrag.current < 4) {
          onSelect(isSelected ? null : index);
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [index, isSelected, onSelect]
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const lerpAmt = 1 - Math.pow(0.001, delta);
    const bob = reducedMotion ? 0 : Math.sin(t * 0.8 + index * 2) * 0.05;

    let targetX = baseX;
    let targetZ = 0;
    let targetScale = 1;
    if (anySelected) {
      if (isSelected) {
        targetX = 0;
        targetZ = 0.9;
        targetScale = 1.12;
      } else {
        targetX = baseX * 1.7;
        targetZ = -1.4;
        targetScale = 0.72;
      }
    }

    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, lerpAmt);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, bob, 0.08);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, lerpAmt);
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, lerpAmt));

    if (!dragging.current) {
      velocity.current *= 0.94;
      manualRotY.current += velocity.current;
      const idleSpin = reducedMotion || isSelected ? 0 : Math.sin(t * 0.3 + index * 2) * 0.08;
      const hoverTiltY = hovered && !anySelected ? state.pointer.x * 0.25 : 0;
      const hoverTiltX = hovered && !anySelected ? -state.pointer.y * 0.15 : 0;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, manualRotY.current + idleSpin + hoverTiltY, 0.08);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, hoverTiltX, 0.08);
    }

    const targetOpacity = dimmed ? 0.28 : 1;
    [frameMat, panelMat, photoMat].forEach((r) => {
      if (r.current) r.current.opacity = THREE.MathUtils.lerp(r.current.opacity, targetOpacity, 0.1);
    });
  });

  return (
    <group
      ref={group}
      position={[baseX, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <RoundedBox args={[1.92, 2.56, 0.24]} radius={0.13} smoothness={4} position={[0, 0, -0.03]}>
        <meshStandardMaterial ref={frameMat} color={data.color} roughness={0.35} metalness={0.3} transparent />
      </RoundedBox>
      <RoundedBox args={[1.78, 2.4, 0.14]} radius={0.09} smoothness={4} position={[0, 0.02, 0.07]}>
        <meshStandardMaterial ref={panelMat} color="#0d0d0d" roughness={0.7} transparent />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.145]}>
        <planeGeometry args={[1.62, 2.02]} />
        <meshStandardMaterial ref={photoMat} map={texture} roughness={0.55} metalness={0.05} transparent />
      </mesh>
    </group>
  );
}

function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <pointLight position={[-4, -1.5, 3]} intensity={0.5} color="#ff7a3c" />
      <pointLight position={[4, 2, -2]} intensity={0.3} color="#5b7a99" />
      <ParallaxRig enabled={!reducedMotion} />
    </>
  );
}

export default function MascotasScene() {
  const [selected, setSelected] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const seleccionada = selected !== null ? MASCOTAS[selected] : null;

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        camera={{ position: [0, 0.3, 8], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <Rig reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          {MASCOTAS.map((m, i) => (
            <MascotCard
              key={m.id}
              data={m}
              index={i}
              total={MASCOTAS.length}
              selected={selected}
              onSelect={setSelected}
              reducedMotion={reducedMotion}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Etiquetas de nombre */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 grid grid-cols-3 px-1 sm:px-4">
        {MASCOTAS.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setSelected(selected === i ? null : i)}
            className="pointer-events-auto mx-auto flex flex-col items-center gap-0.5 group"
          >
            <span
              className="text-[9px] sm:text-[10px] font-bold tracking-wide transition-colors"
              style={{ color: selected === i ? m.color : "#fff" }}
            >
              {m.nombre}
            </span>
            <span
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: selected === i ? "1rem" : "0.35rem",
                backgroundColor: m.color,
                opacity: selected === i ? 1 : 0.5,
              }}
            />
          </button>
        ))}
      </div>

      {/* Tooltip compacto */}
      {seleccionada && (
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 max-w-[85%] rounded-full border bg-black/70 backdrop-blur-md pl-3 pr-2 py-1 text-white shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ borderColor: `${seleccionada.color}55` }}
        >
          <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap" style={{ color: seleccionada.color }}>
            {seleccionada.nombre}
          </span>
          <span className="text-[9px] sm:text-[10px] text-white/70 truncate">{seleccionada.rol}</span>
          <button
            onClick={() => setSelected(null)}
            className="ml-0.5 text-white/50 hover:text-white transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

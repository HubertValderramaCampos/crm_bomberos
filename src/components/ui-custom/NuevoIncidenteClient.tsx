"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Truck, Wrench, Hammer, Camera, X, Loader2, Plus, ImageOff,
} from "lucide-react";
import {
  TIPOS_REPORTE, TIPO_REPORTE_LABEL,
  CATEGORIAS_EQUIPAMIENTO, CATEGORIA_EQUIPAMIENTO_LABEL,
  MAX_FOTOS_REPORTE, MAX_MB_POR_FOTO,
  type TipoReporte, type CategoriaEquipamiento,
} from "@/lib/incidenciasCatalogo";

interface Bombero { id: number; apellidos: string; nombres: string; grado: string; codigo: string }
interface VehiculoOpcion { id: number; codigo: string; tipo: string }

interface Foto { key: string; url: string; nombre: string; subiendo: boolean }

const CATEGORIA_ICON: Record<CategoriaEquipamiento, typeof Truck> = {
  VEHICULO: Truck, EQUIPO_FUERZA: Wrench, HERRAMIENTAS: Hammer,
};

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30";

export function NuevoIncidenteClient() {
  const router = useRouter();

  const [bomberos, setBomberos] = useState<Bombero[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOpcion[]>([]);

  const [bomberoId, setBomberoId] = useState("");
  const [tipoReporte, setTipoReporte] = useState<TipoReporte | "">("");
  const [categoria, setCategoria] = useState<CategoriaEquipamiento | "">("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/bomberos").then(r => r.json()).then((data: Bombero[]) => setBomberos(Array.isArray(data) ? data : [])).catch(() => setBomberos([]));
  }, []);

  useEffect(() => {
    if (categoria !== "VEHICULO") return;
    fetch("/api/vehiculos-b150").then(r => r.json()).then((data: VehiculoOpcion[]) => setVehiculos(Array.isArray(data) ? data : [])).catch(() => setVehiculos([]));
  }, [categoria]);

  async function agregarFotos(files: FileList | null) {
    if (!files) return;
    setError("");
    const disponibles = MAX_FOTOS_REPORTE - fotos.length;
    const seleccion = Array.from(files).slice(0, disponibles);

    for (const file of seleccion) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_MB_POR_FOTO * 1024 * 1024) {
        setError(`"${file.name}" supera los ${MAX_MB_POR_FOTO} MB permitidos.`);
        continue;
      }
      const placeholder: Foto = { key: "", url: URL.createObjectURL(file), nombre: file.name, subiendo: true };
      setFotos(prev => [...prev, placeholder]);

      try {
        const base64 = await archivoABase64(file);
        const subida = await fetch("/api/upload-imagen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagen: base64 }),
        }).then(r => r.json());

        setFotos(prev => prev.map(f =>
          f.url === placeholder.url ? { key: subida.key ?? "", url: subida.url ?? f.url, nombre: file.name, subiendo: false } : f
        ));
        if (!subida.key) setError(`No se pudo subir "${file.name}".`);
      } catch {
        setFotos(prev => prev.filter(f => f.url !== placeholder.url));
        setError(`No se pudo subir "${file.name}".`);
      }
    }
  }

  function quitarFoto(url: string) {
    setFotos(prev => prev.filter(f => f.url !== url));
  }

  async function enviar() {
    setError("");
    if (!bomberoId) return setError("Selecciona el responsable del registro.");
    if (!tipoReporte) return setError("Selecciona el tipo de reporte.");
    if (!categoria) return setError("Selecciona el equipamiento.");
    if (categoria === "VEHICULO" && !vehiculoId) return setError("Selecciona la unidad.");
    if (!descripcion.trim()) return setError("Describe el reporte.");
    if (fotos.some(f => f.subiendo)) return setError("Espera a que terminen de subirse las fotos.");

    setEnviando(true);
    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bomberoId: Number(bomberoId),
          tipoReporte,
          categoria,
          vehiculoId: categoria === "VEHICULO" ? Number(vehiculoId) : null,
          descripcion: descripcion.trim(),
          fotoKeys: fotos.filter(f => f.key).map(f => f.key),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo registrar el reporte."); setEnviando(false); return; }
      router.push(`/incidencias/${data.id}`);
    } catch {
      setError("Error de conexión.");
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/incidencias" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a incidencias
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-700" />
          Registro de Incidencias / Operaciones B150
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Reporta un daño o falla, mantenimiento pendiente o una implementación sugerida</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

        {/* Responsable */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Responsable del registro *</label>
          <select value={bomberoId} onChange={e => setBomberoId(e.target.value)} className={inputCls}>
            <option value="">Selecciona un efectivo…</option>
            {bomberos.map(b => (
              <option key={b.id} value={b.id}>
                {b.grado ? `${b.grado} ` : ""}{b.apellidos}, {b.nombres} ({b.codigo})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">Efectivo que realiza el reporte</p>
        </div>

        {/* Tipo de reporte */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de reporte *</label>
          <div className="flex gap-2 flex-wrap">
            {TIPOS_REPORTE.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoReporte(t)}
                className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipoReporte === t ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {TIPO_REPORTE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Equipamiento */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Equipamiento *</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS_EQUIPAMIENTO.map(c => {
              const Icon = CATEGORIA_ICON[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCategoria(c); setVehiculoId(""); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    categoria === c ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {CATEGORIA_EQUIPAMIENTO_LABEL[c]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unidad (solo si categoria = VEHICULO) */}
        {categoria === "VEHICULO" && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unidad *</label>
            <div className="flex gap-2 flex-wrap">
              {vehiculos.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehiculoId(String(v.id))}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    vehiculoId === String(v.id) ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" /> {v.codigo}
                </button>
              ))}
              {vehiculos.length === 0 && <p className="text-xs text-gray-400 py-2">Cargando unidades…</p>}
            </div>
          </div>
        )}

        {/* Reporte */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reporte *</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={5}
            placeholder="Describa detalladamente el daño, desperfecto, mantenimiento pendiente o implementación sugerida que se requiere en el equipamiento."
            className={inputCls}
          />
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registro fotográfico</label>
          <p className="text-[11px] text-gray-400 mb-2">Sube hasta {MAX_FOTOS_REPORTE} imágenes · máximo {MAX_MB_POR_FOTO} MB por archivo</p>
          <div className="flex gap-2 flex-wrap">
            {fotos.map(f => (
              <div key={f.url} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                {f.subiendo ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                  </div>
                ) : f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => quitarFoto(f.url)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS_REPORTE && (
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 cursor-pointer transition-colors">
                <Camera className="w-5 h-5 mb-0.5" />
                <Plus className="w-3 h-3" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => agregarFotos(e.target.files)} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/incidencias" className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 text-center">
          Cancelar
        </Link>
        <button
          onClick={enviar}
          disabled={enviando}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          {enviando ? "Enviando…" : "Enviar reporte"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Gauge, Truck, Camera, X, Loader2, Plus, ImageOff, AlertTriangle,
} from "lucide-react";
import {
  NIVELES_COMBUSTIBLE, NIVEL_COMBUSTIBLE_LABEL,
  NIVELES_ACEITE_REFRIGERANTE, NIVEL_ACEITE_REFRIGERANTE_LABEL,
  MAX_FOTOS_REPORTE_PILOTO, MAX_MB_POR_FOTO_PILOTO,
  type NivelCombustible, type NivelAceiteRefrigerante,
} from "@/lib/reportePilotoCatalogo";

interface Bombero { id: number; apellidos: string; nombres: string; grado: string; codigo: string }
interface VehiculoOpcion { id: number; codigo: string; tipo: string }
interface Foto { key: string; url: string; nombre: string; subiendo: boolean }

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30";

export function NuevoReportePilotoClient() {
  const router = useRouter();

  const [bomberos, setBomberos] = useState<Bombero[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOpcion[]>([]);

  const [fecha, setFecha] = useState(hoyLocal());
  const [bomberoId, setBomberoId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [combustible, setCombustible] = useState<NivelCombustible | "">("");
  const [aceite, setAceite] = useState<NivelAceiteRefrigerante | "">("");
  const [refrigerante, setRefrigerante] = useState<NivelAceiteRefrigerante | "">("");
  const [estadoNeumaticos, setEstadoNeumaticos] = useState("");
  const [estadoCarroceria, setEstadoCarroceria] = useState("");
  const [estadoSuspension, setEstadoSuspension] = useState("");
  const [estadoEspejosVidrios, setEstadoEspejosVidrios] = useState("");
  const [estadoCabina, setEstadoCabina] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);

  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/bomberos").then(r => r.json()).then((data: Bombero[]) => setBomberos(Array.isArray(data) ? data : [])).catch(() => setBomberos([]));
    fetch("/api/vehiculos-b150").then(r => r.json()).then((data: VehiculoOpcion[]) => setVehiculos(Array.isArray(data) ? data : [])).catch(() => setVehiculos([]));
  }, []);

  async function agregarFotos(files: FileList | null) {
    if (!files) return;
    setError("");
    const disponibles = MAX_FOTOS_REPORTE_PILOTO - fotos.length;
    const seleccion = Array.from(files).slice(0, disponibles);

    for (const file of seleccion) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_MB_POR_FOTO_PILOTO * 1024 * 1024) {
        setError(`"${file.name}" supera los ${MAX_MB_POR_FOTO_PILOTO} MB permitidos.`);
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
    if (!fecha) return setError("Ingresa la fecha.");
    if (!bomberoId) return setError("Selecciona el piloto de turno.");
    if (!vehiculoId) return setError("Selecciona la unidad.");
    if (!kilometraje || Number(kilometraje) < 0) return setError("Ingresa el kilometraje.");
    if (!combustible) return setError("Selecciona el nivel de combustible.");
    if (!aceite) return setError("Selecciona el nivel de aceite.");
    if (!refrigerante) return setError("Selecciona el nivel de refrigerante.");
    if (!estadoNeumaticos.trim()) return setError("Describe el estado de los neumáticos.");
    if (fotos.some(f => f.subiendo)) return setError("Espera a que terminen de subirse las fotos.");

    setEnviando(true);
    try {
      const res = await fetch("/api/reporte-piloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha, bomberoId: Number(bomberoId), vehiculoId: Number(vehiculoId),
          kilometraje: Number(kilometraje), combustible, aceite, refrigerante,
          estadoNeumaticos: estadoNeumaticos.trim(),
          estadoCarroceria: estadoCarroceria.trim(),
          estadoSuspension: estadoSuspension.trim(),
          estadoEspejosVidrios: estadoEspejosVidrios.trim(),
          estadoCabina: estadoCabina.trim(),
          fotoKeys: fotos.filter(f => f.key).map(f => f.key),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo registrar el reporte."); setEnviando(false); return; }
      router.push(`/reporte-piloto/${data.id}`);
    } catch {
      setError("Error de conexión.");
      setEnviando(false);
    }
  }

  const hayAlertaFluidos = aceite === "MINIMO" || refrigerante === "MINIMO";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/reporte-piloto" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a reportes
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-red-700" />
          Reporte Diario de Pilotos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Registro de daños, desperfectos, mantenimientos e implementaciones de las unidades</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Datos generales</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha *</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Piloto de turno *</label>
            <select value={bomberoId} onChange={e => setBomberoId(e.target.value)} className={inputCls}>
              <option value="">Selecciona…</option>
              {bomberos.map(b => (
                <option key={b.id} value={b.id}>
                  {b.grado ? `${b.grado} ` : ""}{b.apellidos}, {b.nombres}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehículo de emergencia *</label>
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

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kilometraje (vehículo estacionado) *</label>
          <input
            type="number" min={0} inputMode="numeric" value={kilometraje}
            onChange={e => setKilometraje(e.target.value)}
            placeholder="Ej: 45820"
            className={inputCls}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Nivel de fluidos</p>
            <p className="text-[11px] text-gray-400">Datos para registrar obligatoriamente por los pilotos</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Combustible *</label>
            <div className="flex gap-2 flex-wrap">
              {NIVELES_COMBUSTIBLE.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCombustible(n)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    combustible === n ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {NIVEL_COMBUSTIBLE_LABEL[n]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Aceite *</label>
            <div className="flex gap-2 flex-wrap">
              {NIVELES_ACEITE_REFRIGERANTE.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAceite(n)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors max-w-full text-left ${
                    aceite === n ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {NIVEL_ACEITE_REFRIGERANTE_LABEL[n]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Refrigerante *</label>
            <div className="flex gap-2 flex-wrap">
              {NIVELES_ACEITE_REFRIGERANTE.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRefrigerante(n)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors max-w-full text-left ${
                    refrigerante === n ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {NIVEL_ACEITE_REFRIGERANTE_LABEL[n]}
                </button>
              ))}
            </div>
          </div>

          {hayAlertaFluidos && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              Nivel mínimo detectado. Comunica esto de inmediato al responsable de sección, además de dejarlo registrado aquí.
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reporte diario</p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado de los neumáticos *</label>
            <textarea
              value={estadoNeumaticos} onChange={e => setEstadoNeumaticos(e.target.value)} rows={2}
              placeholder="Detalle observaciones o coloque CONFORME si no encuentra novedades."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado de la carrocería (exterior)</label>
            <textarea
              value={estadoCarroceria} onChange={e => setEstadoCarroceria(e.target.value)} rows={2}
              placeholder="Golpes, abolladuras, rayones, otros — o CONFORME."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado del sistema de suspensión</label>
            <textarea
              value={estadoSuspension} onChange={e => setEstadoSuspension(e.target.value)} rows={2}
              placeholder="Suspensión baja, fuga de fluido hidráulico, deformación del vástago, otros — o CONFORME."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado de los espejos y vidrios</label>
            <textarea
              value={estadoEspejosVidrios} onChange={e => setEstadoEspejosVidrios(e.target.value)} rows={2}
              placeholder="Espejo roto, parabrisas quiñado, otros — o CONFORME."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado de la cabina (interior)</label>
            <textarea
              value={estadoCabina} onChange={e => setEstadoCabina(e.target.value)} rows={2}
              placeholder="Asientos desgastados, guantera sin tapa, otros — o CONFORME."
              className={inputCls}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registro fotográfico</label>
          <p className="text-[11px] text-gray-400 mb-2">Sube hasta {MAX_FOTOS_REPORTE_PILOTO} imágenes · máximo {MAX_MB_POR_FOTO_PILOTO} MB por archivo</p>
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
            {fotos.length < MAX_FOTOS_REPORTE_PILOTO && (
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
        <Link href="/reporte-piloto" className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 text-center">
          Cancelar
        </Link>
        <button
          onClick={enviar}
          disabled={enviando}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
          {enviando ? "Enviando…" : "Enviar reporte"}
        </button>
      </div>
    </div>
  );
}

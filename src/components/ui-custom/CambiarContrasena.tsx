"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export function CambiarContrasena({ onComplete }: { onComplete: () => void }) {
  const [actual, setActual]     = useState("");
  const [nueva, setNueva]       = useState("");
  const [confirma, setConfirma] = useState("");
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva]   = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const fuerte = nueva.length >= 8;
  const coincide = nueva === confirma && confirma.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fuerte) { setError("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (!coincide) { setError("Las contraseñas no coinciden."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/perfil/contrasena", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al cambiar la contraseña."); return; }
      onComplete();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Cambia tu contraseña</h2>
              <p className="text-xs text-red-200 leading-tight">Obligatorio antes de continuar</p>
            </div>
          </div>
          <p className="text-xs text-red-100 mt-3 leading-relaxed">
            Por seguridad debes establecer una contraseña personal.
            La contraseña asignada es temporal.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Contraseña actual */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Contraseña actual
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type={verActual ? "text" : "password"}
                required
                value={actual}
                onChange={e => setActual(e.target.value)}
                placeholder="Tu contraseña actual"
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <button type="button" onClick={() => setVerActual(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {verActual ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type={verNueva ? "text" : "password"}
                required
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent ${
                  nueva.length > 0 ? (fuerte ? "border-green-400" : "border-red-300") : "border-gray-300"
                }`}
              />
              <button type="button" onClick={() => setVerNueva(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {verNueva ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {nueva.length > 0 && (
              <p className={`text-[11px] mt-1 ${fuerte ? "text-green-600" : "text-red-500"}`}>
                {fuerte ? "✓ Longitud correcta" : `${8 - nueva.length} caracteres más`}
              </p>
            )}
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="password"
                required
                value={confirma}
                onChange={e => setConfirma(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent ${
                  confirma.length > 0 ? (coincide ? "border-green-400" : "border-red-300") : "border-gray-300"
                }`}
              />
              {coincide && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500" />
              )}
            </div>
            {confirma.length > 0 && !coincide && (
              <p className="text-[11px] mt-1 text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !fuerte || !coincide || !actual}
            className="w-full py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors mt-1"
          >
            {loading ? "Guardando..." : "Establecer contraseña"}
          </button>
        </form>

      </div>
    </div>
  );
}

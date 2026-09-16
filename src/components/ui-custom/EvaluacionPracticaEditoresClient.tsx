"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserPlus, X, ShieldCheck } from "lucide-react";
import { esRolJefe, ROLES_JEFE } from "@/lib/roles";
import { ROL_LABELS } from "@/lib/permissions";

interface Usuario {
  id: number; codigo: string; rol: string;
  apellidos: string | null; nombres: string | null; grado: string | null;
}
interface Editor extends Usuario { usuario_id: number; created_at: string }

function tieneAccesoPorRol(rol: string) {
  return esRolJefe(rol) || rol === "OPERACIONES";
}

function nombreDe(u: Usuario) {
  return u.apellidos ? `${u.grado ? u.grado + " " : ""}${u.apellidos}, ${u.nombres}` : u.codigo;
}

export function EvaluacionPracticaEditoresClient() {
  const [editores, setEditores] = useState<Editor[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [agregando, setAgregando] = useState<number | null>(null);
  const [quitando, setQuitando] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargar = () => {
    fetch("/api/evaluacion-practica/editores")
      .then(r => r.json())
      .then(d => {
        setEditores(Array.isArray(d.editores) ? d.editores : []);
        setUsuarios(Array.isArray(d.usuarios) ? d.usuarios : []);
      })
      .catch(() => setError("No se pudo cargar la lista"));
  };

  useEffect(() => { cargar(); }, []);

  async function agregar(usuarioId: number) {
    setAgregando(usuarioId); setError("");
    try {
      const res = await fetch("/api/evaluacion-practica/editores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "No se pudo agregar"); return; }
      setBusqueda(""); setMostrarLista(false);
      cargar();
    } finally {
      setAgregando(null);
    }
  }

  async function quitar(usuarioId: number) {
    setQuitando(usuarioId);
    await fetch(`/api/evaluacion-practica/editores/${usuarioId}`, { method: "DELETE" }).catch(() => {});
    setQuitando(null);
    cargar();
  }

  const yaAutorizadosIds = useMemo(() => new Set((editores ?? []).map(e => e.usuario_id)), [editores]);

  const resultados = useMemo(() => {
    if (busqueda.trim().length === 0) return [];
    const q = busqueda.toLowerCase();
    return usuarios
      .filter(u => !yaAutorizadosIds.has(u.id) && !tieneAccesoPorRol(u.rol))
      .filter(u => `${u.apellidos ?? ""} ${u.nombres ?? ""} ${u.codigo}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [busqueda, usuarios, yaAutorizadosIds]);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Acceso por defecto: <strong>{ROLES_JEFE.map(r => ROL_LABELS[r as keyof typeof ROL_LABELS] ?? r).join(", ")}</strong> y{" "}
          <strong>{ROL_LABELS.OPERACIONES}</strong>. Usa el buscador para autorizar a alguien más puntualmente.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMostrarLista(true); }}
          onFocus={() => setMostrarLista(true)}
          onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
        {mostrarLista && busqueda.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {resultados.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>
            ) : resultados.map(u => (
              <div
                key={u.id}
                onMouseDown={() => agregar(u.id)}
                className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-red-50 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nombreDe(u)}</p>
                  <p className="text-xs text-gray-400">{ROL_LABELS[u.rol as keyof typeof ROL_LABELS] ?? u.rol}</p>
                </div>
                {agregando === u.id ? <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" /> : <UserPlus className="w-4 h-4 text-gray-400 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Lista de autorizados */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Autorizados individualmente</p>
        {editores === null ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
        ) : editores.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-8 text-center">
            Nadie más está autorizado todavía.
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden">
            {editores.map(e => (
              <div key={e.usuario_id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nombreDe(e)}</p>
                  <p className="text-xs text-gray-400">{ROL_LABELS[e.rol as keyof typeof ROL_LABELS] ?? e.rol}</p>
                </div>
                <button
                  onClick={() => quitar(e.usuario_id)}
                  disabled={quitando === e.usuario_id}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 shrink-0"
                >
                  {quitando === e.usuario_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

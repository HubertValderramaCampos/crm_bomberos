"use client";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ChevronDown, Save, Loader2 } from "lucide-react";
import { ROL_LABELS } from "@/lib/permissions";

type Rol = "JEFE_COMPANIA" | "ADMINISTRACION" | "OPERACIONES" | "SERVICIOS_GENERALES" | "INSTRUCCION" | "SANIDAD" | "IMAGEN" | "BOMBERO";
type CuentaArea = { id: number; rol: Rol; activo: boolean; codigo: string };

const ROL_COLOR: Record<Rol, string> = {
  JEFE_COMPANIA:       "bg-red-100 text-red-800 border-red-200",
  ADMINISTRACION:      "bg-purple-100 text-purple-800 border-purple-200",
  OPERACIONES:         "bg-blue-100 text-blue-800 border-blue-200",
  SERVICIOS_GENERALES: "bg-green-100 text-green-800 border-green-200",
  INSTRUCCION:         "bg-yellow-100 text-yellow-800 border-yellow-200",
  SANIDAD:             "bg-pink-100 text-pink-800 border-pink-200",
  IMAGEN:              "bg-indigo-100 text-indigo-800 border-indigo-200",
  BOMBERO:             "bg-gray-100 text-gray-700 border-gray-200",
};

type SeccionDef = { id: string; label: string; grupo: string };

const SECCIONES: SeccionDef[] = [
  // Gestión Operativa
  { id: "dashboard",       label: "Operatividad",          grupo: "Gestión Operativa" },
  { id: "estadisticas",    label: "Estadísticas",           grupo: "Gestión Operativa" },
  { id: "partes",          label: "Partes de Emergencia",   grupo: "Gestión Operativa" },
  { id: "personal",        label: "Bomberos",               grupo: "Gestión Operativa" },
  { id: "asistencias",     label: "Asistencias",            grupo: "Gestión Operativa" },
  { id: "analisis",        label: "Análisis",               grupo: "Gestión Operativa" },
  // Gestión Administrativa
  { id: "oficios-institucionales", label: "Oficios Institucionales", grupo: "Gestión Administrativa" },
  { id: "oficios-varios",          label: "Oficios Varios",          grupo: "Gestión Administrativa" },
  { id: "donaciones",              label: "Donaciones",              grupo: "Gestión Administrativa" },
  { id: "programacion",            label: "Programación",            grupo: "Gestión Administrativa" },
  { id: "entidades",               label: "Entidades",               grupo: "Gestión Administrativa" },
  // Documentos
  { id: "solicitar-capacitacion",  label: "Subir Documento",         grupo: "Documentos" },
  { id: "documentos",              label: "Ver Documentos",          grupo: "Documentos" },
];

const GRUPOS = ["Gestión Operativa", "Gestión Administrativa", "Documentos"];

function TarjetaCuenta({
  cuenta, esSelf,
}: {
  cuenta: CuentaArea; esSelf: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const [permisos, setPermisos] = useState<string[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!expandido || permisos !== null) return;
    fetch(`/api/usuarios/${cuenta.id}/permisos`)
      .then(r => r.json())
      .then(d => setPermisos(Array.isArray(d) ? d : []));
  }, [expandido, cuenta.id, permisos]);

  function toggle(seccion: string) {
    if (!permisos) return;
    setPermisos(prev =>
      prev!.includes(seccion) ? prev!.filter(s => s !== seccion) : [...prev!, seccion]
    );
    setGuardado(false);
  }

  function toggleGrupo(grupo: string) {
    if (!permisos) return;
    const ids = SECCIONES.filter(s => s.grupo === grupo).map(s => s.id);
    const todasActivas = ids.every(id => permisos.includes(id));
    setPermisos(prev =>
      todasActivas
        ? prev!.filter(s => !ids.includes(s))
        : [...new Set([...prev!, ...ids])]
    );
    setGuardado(false);
  }

  async function guardar() {
    if (!permisos) return;
    setGuardando(true);
    await fetch(`/api/usuarios/${cuenta.id}/permisos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(permisos),
    });
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  return (
    <div className={`bg-white border rounded-xl ${esSelf ? "border-red-200" : "border-gray-200"}`}>
      {/* Cabecera */}
      <button
        onClick={() => setExpandido(p => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${ROL_COLOR[cuenta.rol]}`}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{cuenta.codigo}</p>
            {esSelf && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">Tu cuenta</span>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ROL_COLOR[cuenta.rol]}`}>
            {ROL_LABELS[cuenta.rol] ?? cuenta.rol}
          </span>
        </div>
        {permisos !== null && (
          <span className="text-xs text-gray-400 shrink-0">{permisos.length} secciones</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expandido ? "rotate-180" : ""}`} />
      </button>

      {/* Panel de permisos */}
      {expandido && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {permisos === null ? (
            <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
          ) : (
            <>
              {GRUPOS.map(grupo => {
                const seccionesGrupo = SECCIONES.filter(s => s.grupo === grupo);
                const todasActivas = seccionesGrupo.every(s => permisos.includes(s.id));
                const algunaActiva = seccionesGrupo.some(s => permisos.includes(s.id));

                return (
                  <div key={grupo}>
                    {/* Cabecera de grupo con checkbox maestro */}
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={todasActivas}
                        ref={el => { if (el) el.indeterminate = algunaActiva && !todasActivas; }}
                        onChange={() => toggleGrupo(grupo)}
                        className="w-4 h-4 rounded accent-red-600"
                      />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{grupo}</span>
                    </label>

                    {/* Items del grupo */}
                    <div className="grid grid-cols-2 gap-1.5 pl-2">
                      {seccionesGrupo.map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={permisos.includes(s.id)}
                            onChange={() => toggle(s.id)}
                            className="w-3.5 h-3.5 rounded accent-red-600 shrink-0"
                          />
                          <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-400">
                  {permisos.length} de {SECCIONES.length} secciones habilitadas
                </span>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {guardando
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</>
                    : guardado
                      ? "✓ Guardado"
                      : <><Save className="w-3 h-3" /> Guardar cambios</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function PermisosGestion({ selfId }: { selfId: number }) {
  const [cuentas, setCuentas] = useState<CuentaArea[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await fetch("/api/usuarios").then(r => r.json());
    setCuentas(Array.isArray(data) ? data : []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) return <p className="text-sm text-gray-400 py-12 text-center">Cargando cuentas...</p>;

  return (
    <div className="space-y-4 overflow-y-auto pb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Nota:</strong> Los cambios tienen efecto en la próxima sesión de cada cuenta. Las cuentas de bomberos no se gestionan aquí.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cuentas.map(c => (
          <TarjetaCuenta key={c.id} cuenta={c} esSelf={c.id === selfId} />
        ))}
      </div>
    </div>
  );
}

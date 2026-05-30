"use client";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ChevronDown, Save, Loader2, Users, Flame } from "lucide-react";
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

/* ── Secciones ─────────────────────────────────────────────────────── */

type SeccionDef = { id: string; label: string; grupo: string; tieneEdicion: boolean };

const SECCIONES: SeccionDef[] = [
  { id: "dashboard",               label: "Operatividad",             grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "estadisticas",            label: "Estadísticas",             grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "partes",                  label: "Partes de Emergencia",     grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "personal",                label: "Bomberos",                 grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "asistencias",             label: "Asistencias",              grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "analisis",                label: "Análisis",                 grupo: "Gestión Operativa",      tieneEdicion: false },
  { id: "oficios-institucionales", label: "Oficios Institucionales",  grupo: "Gestión Administrativa", tieneEdicion: false },
  { id: "oficios-varios",          label: "Oficios Varios",           grupo: "Gestión Administrativa", tieneEdicion: false },
  { id: "donaciones",              label: "Donaciones",               grupo: "Gestión Administrativa", tieneEdicion: true  },
  { id: "programacion",            label: "Programación",             grupo: "Gestión Administrativa", tieneEdicion: true  },
  { id: "entidades",               label: "Entidades",                grupo: "Gestión Administrativa", tieneEdicion: false },
  { id: "solicitar-capacitacion",  label: "Subir Documento",          grupo: "Documentos",             tieneEdicion: false },
  { id: "documentos",              label: "Ver Documentos",           grupo: "Documentos",             tieneEdicion: false },
  { id: "socios",                  label: "Socios Estratégicos",      grupo: "Gestión Comercial",      tieneEdicion: false },
  { id: "clasificacion",           label: "Clasificación de Socios",  grupo: "Gestión Comercial",      tieneEdicion: true  },
  { id: "proyeccion-social",       label: "Proyección Social",        grupo: "Gestión Comercial",      tieneEdicion: true  },
  { id: "encuestas",               label: "Encuestas",                grupo: "Gestión Comercial",      tieneEdicion: true  },
];

const GRUPOS_AREA     = ["Gestión Operativa", "Gestión Administrativa", "Documentos"];
const GRUPOS_BOMBERO  = ["Gestión Operativa", "Gestión Administrativa", "Documentos", "Gestión Comercial"];

/* ── Permisos de área ───────────────────────────────────────────────── */

function TarjetaCuenta({ cuenta, esSelf }: { cuenta: CuentaArea; esSelf: boolean }) {
  const [expandido, setExpandido] = useState(false);
  const [permisos,  setPermisos]  = useState<string[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado,  setGuardado]  = useState(false);

  useEffect(() => {
    if (!expandido || permisos !== null) return;
    fetch(`/api/usuarios/${cuenta.id}/permisos`)
      .then(r => r.json())
      .then(d => setPermisos(Array.isArray(d) ? d : []));
  }, [expandido, cuenta.id, permisos]);

  function toggle(seccion: string) {
    if (!permisos) return;
    setPermisos(prev => prev!.includes(seccion) ? prev!.filter(s => s !== seccion) : [...prev!, seccion]);
    setGuardado(false);
  }

  function toggleGrupo(grupo: string) {
    if (!permisos) return;
    const ids = SECCIONES.filter(s => s.grupo === grupo).map(s => s.id);
    const todasActivas = ids.every(id => permisos.includes(id));
    setPermisos(prev => todasActivas ? prev!.filter(s => !ids.includes(s)) : [...new Set([...prev!, ...ids])]);
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
          permisos.length === 0
            ? <span className="text-xs text-green-600 font-medium shrink-0">Acceso completo</span>
            : <span className="text-xs text-amber-600 font-medium shrink-0">{permisos.length} secciones restringidas</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expandido ? "rotate-180" : ""}`} />
      </button>

      {expandido && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {permisos === null ? (
            <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
          ) : (
            <>
              {/* Aviso modelo restrictivo */}
              <div className={`text-xs px-3 py-2 rounded-lg border ${permisos.length === 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                {permisos.length === 0
                  ? "✓ Sin restricciones — acceso completo al rol. Marca secciones para limitar el acceso."
                  : `Solo puede ver las ${permisos.length} secciones marcadas. Desmarca todas para restaurar acceso completo.`}
              </div>

              {GRUPOS_AREA.map(grupo => {
                const seccionesGrupo = SECCIONES.filter(s => s.grupo === grupo);
                const todasActivas   = seccionesGrupo.every(s => permisos.includes(s.id));
                const algunaActiva   = seccionesGrupo.some(s => permisos.includes(s.id));
                return (
                  <div key={grupo}>
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
                  {permisos.length === 0 ? "Acceso completo" : `${permisos.length} de ${SECCIONES.filter(s => GRUPOS_AREA.includes(s.grupo)).length} secciones`}
                </span>
                <div className="flex items-center gap-2">
                  {permisos.length > 0 && (
                    <button onClick={() => { setPermisos([]); setGuardado(false); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Quitar restricciones
                    </button>
                  )}
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {guardando ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</> : guardado ? "✓ Guardado" : <><Save className="w-3 h-3" /> Guardar</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Permisos bomberos por racha ────────────────────────────────────── */

type RachaRow = { seccion: string; racha_min: number; puede_editar: boolean };

const RACHA_NIVELES = [-1, 0, 1, 2, 3, 4];

function BomberoPermisosPanel() {
  const [config,    setConfig]    = useState<RachaRow[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bombero-acceso-racha")
      .then(r => r.json())
      .then(d => setConfig(Array.isArray(d) ? d : []))
      .catch(() => setError("Error al cargar configuración"));
  }, []);

  function setRachaMin(seccion: string, val: number) {
    setConfig(prev => prev!.map(r => r.seccion === seccion ? { ...r, racha_min: val } : r));
    setGuardado(false);
  }

  function setPuedeEditar(seccion: string, val: boolean) {
    setConfig(prev => prev!.map(r => r.seccion === seccion ? { ...r, puede_editar: val } : r));
    setGuardado(false);
  }

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/bombero-acceso-racha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch {
      setError("Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!config) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      {GRUPOS_BOMBERO.map(grupo => {
        const secciones = SECCIONES.filter(s => s.grupo === grupo);
        return (
          <div key={grupo} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">{grupo}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {secciones.map(s => {
                const row = config.find(r => r.seccion === s.id);
                const rachaMin    = row?.racha_min    ?? 0;
                const puedeEditar = row?.puede_editar ?? false;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Nombre sección */}
                    <div className="w-44 shrink-0">
                      <p className="text-sm text-gray-800 font-medium">{s.label}</p>
                    </div>

                    {/* Racha mínima para ver */}
                    <div className="flex items-center gap-2 flex-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-xs text-gray-500 shrink-0">Ver desde racha</span>
                      <select
                        value={rachaMin}
                        onChange={e => setRachaMin(s.id, Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                      >
                        {RACHA_NIVELES.map(n => (
                          <option key={n} value={n}>
                            {n === -1 ? "Nunca" : n === 0 ? "Siempre" : `≥ ${n} sem.`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Puede editar — solo en secciones que lo soportan */}
                    <div className="shrink-0 w-28">
                      {s.tieneEdicion ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={puedeEditar}
                            onChange={e => setPuedeEditar(s.id, e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-red-600"
                          />
                          <span className="text-xs text-gray-500">Puede editar</span>
                        </label>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Solo lectura</span>
                      )}
                    </div>

                    {/* Indicador visual */}
                    <div className="shrink-0">
                      {rachaMin === -1 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">Bloqueado</span>
                      ) : rachaMin === 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Libre</span>
                      ) : rachaMin <= 2 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">≥ {rachaMin} sem.</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">≥ {rachaMin} sem.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex items-center gap-1.5 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50 transition-colors"
        >
          {guardando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : guardado
              ? "✓ Guardado"
              : <><Save className="w-4 h-4" /> Guardar configuración</>
          }
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ───────────────────────────────────────────── */

export function PermisosGestion({ selfId }: { selfId: number }) {
  const [tab,      setTab]      = useState<"areas" | "bomberos">("areas");
  const [cuentas,  setCuentas]  = useState<CuentaArea[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await fetch("/api/usuarios").then(r => r.json());
    setCuentas(Array.isArray(data) ? data : []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="space-y-4 pb-6">
      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("areas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "areas"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Cuentas de área
        </button>
        <button
          onClick={() => setTab("bomberos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "bomberos"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Bomberos por racha
        </button>
      </div>

      {/* Pestaña Áreas */}
      {tab === "areas" && (
        <>
          {cargando ? (
            <p className="text-sm text-gray-400 py-12 text-center">Cargando cuentas...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cuentas.map(c => (
                <TarjetaCuenta key={c.id} cuenta={c} esSelf={c.id === selfId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pestaña Bomberos */}
      {tab === "bomberos" && <BomberoPermisosPanel />}
    </div>
  );
}

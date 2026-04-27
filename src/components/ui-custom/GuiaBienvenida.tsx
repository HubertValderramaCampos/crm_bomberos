"use client";

import { useState } from "react";
import {
  Flame, Shield, Truck, Star, Award, ChevronRight, ChevronLeft,
  CheckCircle, Lock, Zap, Users, Phone, Calendar, Mail,
  UserCheck, Heart, ArrowRight, Sparkles, TrendingUp, X
} from "lucide-react";

interface Props {
  nombre: string;
  grado: string;
  datosIniciales: {
    fecha_nacimiento: string | null;
    correo: string | null;
    telefono: string | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
  };
  onComplete: () => void;
}

const PASOS = ["bienvenida", "sistema", "racha", "logros", "datos", "listo"] as const;
type Paso = typeof PASOS[number];

interface Recompensa {
  icon: React.ElementType;
  label: string;
  descripcion: string;
  requisito: string;
  semanas: number | null;
  color: string;
  colorBg: string;
}

const RECOMPENSAS: Recompensa[] = [
  {
    icon: Users,
    label: "Ver quién está en turno",
    descripcion: "Consulta en tiempo real quién está en la compañía ahora mismo.",
    requisito: "Asistir al menos 1 vez esta semana",
    semanas: 1,
    color: "text-blue-700",
    colorBg: "bg-blue-50 border-blue-200",
  },
  {
    icon: Truck,
    label: "Ver estado de unidades",
    descripcion: "Conoce el estado operativo de cada vehículo: operativo, en emergencia o con falla.",
    requisito: "Mantener racha de 2 semanas seguidas",
    semanas: 2,
    color: "text-amber-700",
    colorBg: "bg-amber-50 border-amber-200",
  },
  {
    icon: Star,
    label: "Ver ranking completo",
    descripcion: "Accede al ranking de horas de todos los bomberos del mes y compara tu desempeño.",
    requisito: "Cumplir tu meta de horas del mes",
    semanas: null,
    color: "text-purple-700",
    colorBg: "bg-purple-50 border-purple-200",
  },
];

function Dot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
      done ? "bg-red-600" : active ? "bg-red-400 scale-125" : "bg-gray-200"
    }`} />
  );
}

export function GuiaBienvenida({ nombre, grado, datosIniciales, onComplete }: Props) {
  const [paso, setPaso] = useState<Paso>("bienvenida");
  const [form, setForm] = useState({
    fecha_nacimiento:             datosIniciales.fecha_nacimiento ?? "",
    correo:                       datosIniciales.correo ?? "",
    telefono:                     datosIniciales.telefono ?? "",
    contacto_emergencia_nombre:   datosIniciales.contacto_emergencia_nombre ?? "",
    contacto_emergencia_telefono: datosIniciales.contacto_emergencia_telefono ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idx = PASOS.indexOf(paso);

  function next() {
    if (idx < PASOS.length - 1) setPaso(PASOS[idx + 1]);
  }
  function prev() {
    if (idx > 0) setPaso(PASOS[idx - 1]);
  }

  async function finalizar() {
    setError(null);
    if (!form.telefono.trim()) {
      setError("Tu teléfono es obligatorio.");
      return;
    }
    if (!form.contacto_emergencia_nombre.trim()) {
      setError("El nombre del contacto de emergencia es obligatorio.");
      return;
    }
    if (!form.contacto_emergencia_telefono.trim()) {
      setError("El teléfono del contacto de emergencia es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/perfil/datos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fecha_nacimiento: form.fecha_nacimiento || null,
          correo: form.correo || null,
          telefono: form.telefono || null,
          contacto_emergencia_nombre: form.contacto_emergencia_nombre || null,
          contacto_emergencia_telefono: form.contacto_emergencia_telefono || null,
          perfil_completado: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
        return;
      }
      onComplete();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-red-600 transition-all duration-500"
            style={{ width: `${((idx + 1) / PASOS.length) * 100}%` }}
          />
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-1">
          {PASOS.map((p, i) => (
            <Dot key={p} active={i === idx} done={i < idx} />
          ))}
        </div>

        {/* Content */}
        <div className="px-7 py-5 min-h-[420px] flex flex-col">

          {/* ── Paso 1: Bienvenida ── */}
          {paso === "bienvenida" && (
            <div className="flex flex-col items-center text-center gap-4 flex-1 justify-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <Flame className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Bienvenido al sistema</p>
                <h2 className="text-2xl font-bold text-gray-900">Hola, {nombre}</h2>
                <p className="text-sm text-gray-500 mt-1">{grado} · Cía. B. V. N.° 150</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                Esta guía te explicará cómo funciona tu perfil, el sistema de racha y los beneficios que puedes desbloquear asistiendo más seguido a la estación.
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Cuanto más asistas, más funcionalidades desbloqueas.</p>
              </div>
            </div>
          )}

          {/* ── Paso 2: Cómo funciona el sistema ── */}
          {paso === "sistema" && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">El sistema</p>
                <h2 className="text-xl font-bold text-gray-900">¿Cómo funciona tu perfil?</h2>
                <p className="text-sm text-gray-500 mt-1">El CRM registra automáticamente tu actividad cada vez que llegas a la compañía.</p>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  {
                    icon: Calendar,
                    color: "bg-blue-100 text-blue-700",
                    title: "Asistencias automáticas",
                    desc: "Cada vez que estás en turno, el sistema lo registra en tiempo real. No necesitas hacer nada.",
                  },
                  {
                    icon: Flame,
                    color: "bg-red-100 text-red-700",
                    title: "Racha semanal",
                    desc: "Si asistes al menos una vez por semana, mantienes tu racha activa. Cada semana seguida suma.",
                  },
                  {
                    icon: TrendingUp,
                    color: "bg-green-100 text-green-700",
                    title: "Meta de horas",
                    desc: "Cada grado tiene una meta mensual de horas. Cumplirla desbloquea acceso al ranking.",
                  },
                  {
                    icon: Zap,
                    color: "bg-purple-100 text-purple-700",
                    title: "Beneficios por asistencia",
                    desc: "A mayor racha, más funcionalidades se habilitan en tu cuenta. ¡Todo depende de ti!",
                  },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Paso 3: Racha ── */}
          {paso === "racha" && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Racha semanal</p>
                <h2 className="text-xl font-bold text-gray-900">¿Cómo funciona la racha?</h2>
              </div>

              {/* Visual racha */}
              <div className="bg-gradient-to-br from-red-50 to-amber-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`flex flex-col items-center gap-1`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          i <= 4 ? "bg-red-500" : "bg-gray-200"
                        }`}>
                          <Flame className={`w-4 h-4 ${i <= 4 ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <span className="text-[9px] text-gray-400">S{i}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-black text-red-600">4🔥</p>
                    <p className="text-xs text-gray-500">semanas</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  En este ejemplo, el bombero asistió <strong>4 semanas seguidas</strong>. Las llamas encendidas representan cada semana activa.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">¿Qué cuenta para la racha?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Aparecer registrado en cualquier turno dentro de la semana (lunes a domingo).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">¿Qué rompe la racha?</p>
                    <p className="text-xs text-gray-500 mt-0.5">No aparecer en ningún turno durante una semana completa. La racha se reinicia a 0.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Mejor racha histórica</p>
                    <p className="text-xs text-amber-600 mt-0.5">Tu mejor racha se guarda aunque la pierdas. ¡Intenta superarla!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 4: Logros y beneficios ── */}
          {paso === "logros" && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Beneficios</p>
                <h2 className="text-xl font-bold text-gray-900">Desbloquea funcionalidades</h2>
                <p className="text-sm text-gray-500 mt-1">Cuanto más constante seas, más podrás ver dentro del sistema.</p>
              </div>
              <div className="space-y-3 flex-1">
                {RECOMPENSAS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.label} className={`flex items-start gap-3 p-3.5 rounded-xl border ${r.colorBg}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white border`}>
                        <Icon className={`w-4 h-4 ${r.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold ${r.color}`}>{r.label}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/80 border border-current rounded-full opacity-70 shrink-0">
                            {r.semanas ? `${r.semanas} sem.` : "meta horas"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{r.descripcion}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Lock className="w-3 h-3 text-gray-400" />
                          <p className="text-[11px] text-gray-500 font-medium">{r.requisito}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500">Los beneficios se actualizan automáticamente cada vez que entras al sistema.</p>
              </div>
            </div>
          )}

          {/* ── Paso 5: Datos personales ── */}
          {paso === "datos" && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Tus datos</p>
                <h2 className="text-xl font-bold text-gray-900">Completa tu perfil</h2>
                <p className="text-sm text-gray-500 mt-1">Esta información es solo para la compañía. Puedes actualizarla en cualquier momento.</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Fecha de nacimiento</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={form.fecha_nacimiento}
                      onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Teléfono <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      className={`${inputCls} ${error && !form.telefono.trim() ? "border-red-400 ring-1 ring-red-400" : ""}`}
                      placeholder="9XXXXXXXX"
                      value={form.telefono}
                      onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Correo electrónico</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="tucorreo@ejemplo.com"
                    value={form.correo}
                    onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  />
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contacto de emergencia</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nombre <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={`${inputCls} ${error && !form.contacto_emergencia_nombre.trim() ? "border-red-400 ring-1 ring-red-400" : ""}`}
                        placeholder="Nombre completo"
                        value={form.contacto_emergencia_nombre}
                        onChange={e => setForm(f => ({ ...f, contacto_emergencia_nombre: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        className={`${inputCls} ${error && !form.contacto_emergencia_telefono.trim() ? "border-red-400 ring-1 ring-red-400" : ""}`}
                        placeholder="9XXXXXXXX"
                        value={form.contacto_emergencia_telefono}
                        onChange={e => setForm(f => ({ ...f, contacto_emergencia_telefono: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-red-500 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3 h-3" />
                  Teléfono, contacto de emergencia y su teléfono son obligatorios.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <X className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 6: Listo ── */}
          {paso === "listo" && (
            <div className="flex flex-col items-center text-center gap-4 flex-1 justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¡Todo listo, {nombre}!</h2>
                <p className="text-sm text-gray-500 mt-1">Tu perfil está configurado.</p>
              </div>
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Flame className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Asiste esta semana para <strong>activar tu racha</strong> y desbloquear el primer beneficio.</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Star className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Mantén <strong>2 semanas seguidas</strong> para ver el estado de las unidades en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Award className="w-4 h-4 text-purple-500 shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Cumple tu <strong>meta de horas</strong> del mes para acceder al ranking completo.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer / Navegación */}
        <div className="px-7 pb-6 flex items-center gap-3">
          {idx > 0 && paso !== "listo" && (
            <button
              onClick={prev}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          )}

          <div className="flex-1" />


          {paso !== "listo" && paso !== "datos" && (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {paso === "datos" && (
            <button
              onClick={finalizar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? "Guardando…" : (<>Guardar y continuar <ArrowRight className="w-4 h-4" /></>)}
            </button>
          )}

          {paso === "listo" && (
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-8 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Ir a mi perfil <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Save, KeyRound, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

interface DatosPersonales {
  fecha_nacimiento: string | null;
  correo: string | null;
  telefono: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
}

function Alert({ tipo, msg }: { tipo: "ok" | "err"; msg: string }) {
  const ok = tipo === "ok";
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
      ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

export function PerfilEditForm({ datos }: { datos: DatosPersonales }) {
  const [form, setForm] = useState({
    fecha_nacimiento:             datos.fecha_nacimiento ?? "",
    correo:                       datos.correo ?? "",
    telefono:                     datos.telefono ?? "",
    contacto_emergencia_nombre:   datos.contacto_emergencia_nombre ?? "",
    contacto_emergencia_telefono: datos.contacto_emergencia_telefono ?? "",
  });
  const [savingDatos, setSavingDatos] = useState(false);
  const [msgDatos, setMsgDatos] = useState<{ tipo: "ok" | "err"; msg: string } | null>(null);

  const [pass, setPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [msgPass, setMsgPass] = useState<{ tipo: "ok" | "err"; msg: string } | null>(null);

  async function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    setSavingDatos(true);
    setMsgDatos(null);
    try {
      const res = await fetch("/api/perfil/datos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_nacimiento:             form.fecha_nacimiento || null,
          correo:                       form.correo || null,
          telefono:                     form.telefono || null,
          contacto_emergencia_nombre:   form.contacto_emergencia_nombre || null,
          contacto_emergencia_telefono: form.contacto_emergencia_telefono || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsgDatos({ tipo: "err", msg: data.error ?? "Error al guardar" });
      else setMsgDatos({ tipo: "ok", msg: "Datos actualizados correctamente" });
    } catch {
      setMsgDatos({ tipo: "err", msg: "Error de conexión" });
    } finally {
      setSavingDatos(false);
    }
  }

  async function cambiarContrasena(e: React.FormEvent) {
    e.preventDefault();
    setMsgPass(null);
    if (pass.nueva !== pass.confirmar) {
      setMsgPass({ tipo: "err", msg: "Las contraseñas nuevas no coinciden" });
      return;
    }
    if (pass.nueva.length < 8) {
      setMsgPass({ tipo: "err", msg: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }
    setSavingPass(true);
    try {
      const res = await fetch("/api/perfil/contrasena", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: pass.actual, nueva: pass.nueva }),
      });
      const data = await res.json();
      if (!res.ok) setMsgPass({ tipo: "err", msg: data.error ?? "Error al cambiar contraseña" });
      else {
        setMsgPass({ tipo: "ok", msg: "Contraseña actualizada correctamente" });
        setPass({ actual: "", nueva: "", confirmar: "" });
      }
    } catch {
      setMsgPass({ tipo: "err", msg: "Error de conexión" });
    } finally {
      setSavingPass(false);
    }
  }

  const labelCls = "block text-xs font-medium text-gray-600 mb-1";
  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white";

  return (
    <div className="space-y-6">

      {/* Datos personales editables */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Save className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Mis datos personales</h2>
        </div>
        <form onSubmit={guardarDatos} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className={labelCls}>Correo electrónico</label>
              <input
                type="email"
                className={inputCls}
                placeholder="tucorreo@ejemplo.com"
                value={form.correo}
                onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input
                type="tel"
                className={inputCls}
                placeholder="9XXXXXXXX"
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Contacto de emergencia</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Nombre completo"
                  value={form.contacto_emergencia_nombre}
                  onChange={e => setForm(f => ({ ...f, contacto_emergencia_nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="tel"
                  className={inputCls}
                  placeholder="9XXXXXXXX"
                  value={form.contacto_emergencia_telefono}
                  onChange={e => setForm(f => ({ ...f, contacto_emergencia_telefono: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {msgDatos && <Alert tipo={msgDatos.tipo} msg={msgDatos.msg} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingDatos}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {savingDatos ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Cambiar contraseña</h2>
        </div>
        <form onSubmit={cambiarContrasena} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Contraseña actual</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={inputCls + " pr-10"}
                  value={pass.actual}
                  onChange={e => setPass(p => ({ ...p, actual: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(s => !s)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <input
                type={showPass ? "text" : "password"}
                className={inputCls}
                placeholder="Mínimo 8 caracteres"
                value={pass.nueva}
                onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className={labelCls}>Confirmar nueva contraseña</label>
              <input
                type={showPass ? "text" : "password"}
                className={inputCls}
                placeholder="Repetir contraseña"
                value={pass.confirmar}
                onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
                required
              />
            </div>
          </div>

          {msgPass && <Alert tipo={msgPass.tipo} msg={msgPass.msg} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPass}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {savingPass ? "Cambiando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

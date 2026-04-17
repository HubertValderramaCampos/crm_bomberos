"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Correo electrónico o contraseña incorrectos.");
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Panel izquierdo — institucional */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Franja roja superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-700" />
        {/* Patrón sutil */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <Image
            src="/LOGO_150.png"
            alt="Compañía de Bomberos Voluntarios 150 - Puente Piedra"
            width={180}
            height={180}
            className="mb-8 drop-shadow-2xl"
            priority
          />
          <h1 className="text-3xl font-bold text-white leading-tight font-[family-name:var(--font-heading)]">
            Cía. Brig. CBP<br />
            <span className="text-red-500">Julio Upiachihua Cárdenas</span>
          </h1>
          <div className="w-12 h-0.5 bg-red-600 my-5" />
          <p className="text-gray-400 text-sm leading-relaxed">
            Compañía de Bomberos Voluntarios N.° 150<br />
            Puente Piedra — Lima, Perú
          </p>
          <p className="text-gray-600 text-xs mt-6">
            Cuerpo General de Bomberos Voluntarios del Perú
          </p>
        </div>

        {/* Franja roja inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-700" />
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo móvil */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <Image src="/LOGO_150.png" alt="Logo CIA 150" width={90} height={90} priority />
          <h1 className="text-lg font-bold text-gray-900 mt-3 text-center">
            Cía. B. V. N.° 150 — Puente Piedra
          </h1>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mt-1">Sistema de Gestión Institucional</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@cbpp.pe"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verificando..." : "Ingresar al sistema"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              © {new Date().getFullYear()} Cía. Brig. CBP Julio Upiachihua Cárdenas N.° 150
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Acceso restringido a personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

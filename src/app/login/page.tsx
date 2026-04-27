"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Hash, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [codigo, setCodigo]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { codigo, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/inicio");
    } else {
      setError("Código o contraseña incorrectos.");
    }
  }

  return (
    <>
      {/* Keyframes inyectados una vez */}
      <style>{`
        @keyframes logo-enter {
          0%   { opacity: 0; transform: scale(0.72) translateY(18px); filter: brightness(0.4); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-4px); filter: brightness(1.1); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    filter: brightness(1);   }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0); }
          50%       { box-shadow: 0 0 48px 16px rgba(185,28,28,0.22); }
        }
        @keyframes stripe-enter {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes text-fade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes form-slide {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .logo-anim {
          animation: logo-enter 0.9s cubic-bezier(0.34,1.56,0.64,1) both,
                     glow-pulse 3.5s ease-in-out 1.2s infinite;
          border-radius: 9999px;
        }
        .stripe-anim {
          transform-origin: left;
          animation: stripe-enter 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .text-anim-1 { animation: text-fade 0.6s ease both 0.7s; opacity: 0; }
        .text-anim-2 { animation: text-fade 0.6s ease both 0.9s; opacity: 0; }
        .text-anim-3 { animation: text-fade 0.6s ease both 1.1s; opacity: 0; }
        .text-anim-4 { animation: text-fade 0.6s ease both 1.3s; opacity: 0; }
        .form-anim   { animation: form-slide 0.55s cubic-bezier(0.22,1,0.36,1) both 0.2s; opacity: 0; }
      `}</style>

      <div className="min-h-screen flex bg-gray-50">

        {/* ── Panel izquierdo — institucional ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#111827] flex-col items-center justify-center p-12 relative overflow-hidden">

          {/* Franja roja superior */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-700 stripe-anim" style={{ animationDelay: "0s" }} />

          {/* Patrón diagonal sutil */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "24px 24px" }} />

          {/* Halo rojo difuso detrás del logo */}
          <div className="absolute w-72 h-72 rounded-full bg-red-800/10 blur-3xl pointer-events-none"
            style={{ animation: "glow-pulse 4s ease-in-out 1s infinite" }} />

          <div className="relative z-10 flex flex-col items-center text-center max-w-xs">

            {/* Logo animado */}
            <div className="logo-anim mb-8">
              <Image
                src="/LOGO_150.png"
                alt="Compañía de Bomberos Voluntarios 150 – Puente Piedra"
                width={176}
                height={176}
                priority
                className="drop-shadow-[0_8px_32px_rgba(185,28,28,0.45)]"
              />
            </div>

            <h1 className="text-anim-1 text-3xl font-bold text-white leading-snug font-[family-name:var(--font-heading)]">
              Cía. Brig. CBP<br />
              <span className="text-red-500">Julio Upiachihua Cárdenas</span>
            </h1>

            <div className="text-anim-2 w-10 h-0.5 bg-red-600 my-5 mx-auto" />

            <p className="text-anim-3 text-gray-400 text-sm leading-relaxed">
              Compañía de Bomberos Voluntarios N.° 150<br />
              Puente Piedra — Lima, Perú
            </p>

            <p className="text-anim-4 text-gray-600 text-xs mt-5 uppercase tracking-widest">
              CGBVP
            </p>
          </div>

          {/* Franja roja inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-700 stripe-anim" style={{ animationDelay: "0.15s" }} />
        </div>

        {/* ── Panel derecho — formulario ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">

          {/* Logo móvil */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <div className="logo-anim">
              <Image src="/LOGO_150.png" alt="Logo CIA 150" width={88} height={88} priority />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mt-3 text-center text-anim-1">
              Cía. B. V. N.° 150 — Puente Piedra
            </h1>
          </div>

          <div className="w-full max-w-sm form-anim">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
              <p className="text-sm text-gray-500 mt-1">Sistema de Gestión Institucional</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código de bombero
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    placeholder="Ej: a23071"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white placeholder:text-gray-400"
                  />
                </div>
              </div>

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
                    onChange={e => setPassword(e.target.value)}
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
    </>
  );
}

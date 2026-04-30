"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BtnCancelarEmergencia({ id, numeroParte }: { id: number; numeroParte: string }) {
  const [loading, setLoading]     = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const router = useRouter();

  async function cancelar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergencias/${id}/cancelar`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirmar(false);
    }
  }

  if (confirmar) {
    return (
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[10px] text-gray-500">¿Cancelar {numeroParte}?</span>
        <button onClick={cancelar} disabled={loading}
          className="text-[10px] font-semibold text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded disabled:opacity-50 flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Sí, cancelar
        </button>
        <button onClick={() => setConfirmar(false)} className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded">
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirmar(true)}
      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-600 transition-colors mt-1.5">
      <XCircle className="w-3 h-3" /> Cancelar emergencia
    </button>
  );
}

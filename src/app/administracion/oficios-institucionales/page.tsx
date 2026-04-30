import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Scroll } from "lucide-react";
import pool from "@/lib/db";
import { PageHeader } from "@/components/ui-custom/PageHeader";

async function getData() {
  const { rows } = await pool.query<{
    id: number; fecha: string; entidad: string; resumen: string | null; respuesta: string | null;
  }>(`SELECT id, fecha::text, entidad, resumen, respuesta FROM oficio_institucional ORDER BY fecha DESC`);
  return rows;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function OficiosInstituccionalesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rows = await getData().catch(() => []);

  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={Scroll} title="Oficios Institucionales" subtitle={`${rows.length} registros`} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-gray-400">Sin registros aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Fecha", "Entidad", "Resumen", "Respuesta"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmt(r.fecha)}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px]">
                      <p className="truncate">{r.entidad}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs">
                      <p className="line-clamp-2">{r.resumen ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-xs">
                      {r.respuesta ? (
                        <p className="line-clamp-2 text-green-700">{r.respuesta}</p>
                      ) : (
                        <span className="text-amber-500 font-medium">Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const ESTADO_COLOR: Record<string, "green"|"yellow"|"red"|"gray"> = {
  OPERATIVO: "green", EN_REPARACION: "yellow", FUERA_DE_SERVICIO: "red", BAJA: "gray",
};

export default async function EquiposPage() {
  const equipos = await prisma.equipo.findMany({ orderBy: [{ categoria: "asc" }, { nombre: "asc" }] });

  const byCategoria: Record<string, typeof equipos> = {};
  equipos.forEach((e) => { byCategoria[e.categoria] = [...(byCategoria[e.categoria] ?? []), e]; });

  const operativos = equipos.filter((e) => e.estado === "OPERATIVO").length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Boxes} title="Equipos" subtitle={`${operativos} operativos de ${equipos.length} total`} />

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">{cat}</h2>
            <span className="text-xs text-gray-400">{items.length} ítem{items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Código", "Nombre", "Marca / Modelo", "Ubicación", "Estado"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{eq.codigo}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{eq.nombre}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{[eq.marca, eq.modelo].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{eq.ubicacion ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge label={eq.estado.replace(/_/g, " ")} color={ESTADO_COLOR[eq.estado] ?? "gray"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

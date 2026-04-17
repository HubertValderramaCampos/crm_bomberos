import { prisma } from "@/lib/prisma";
import { Package, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default async function InventarioPage() {
  const items = await prisma.itemInventario.findMany({ orderBy: [{ categoria: "asc" }, { nombre: "asc" }] });
  const bajosStock = items.filter((i) => i.stock <= i.stockMinimo);

  return (
    <div className="space-y-5">
      <PageHeader icon={Package} title="Inventario" subtitle={`${items.length} ítems · ${bajosStock.length} bajo stock mínimo`} />

      {bajosStock.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Ítems bajo stock mínimo</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {bajosStock.map((i) => (
                <span key={i.id} className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                  {i.nombre} ({i.stock}/{i.stockMinimo})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Código", "Nombre", "Categoría", "Stock actual", "Stock mínimo", "Unidad", "Ubicación"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => {
                const bajo = i.stock <= i.stockMinimo;
                return (
                  <tr key={i.id} className={`hover:bg-gray-50 transition-colors ${bajo ? "bg-red-50" : ""}`}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{i.codigo}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{i.nombre}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{i.categoria}</td>
                    <td className="px-5 py-3">
                      <span className={`text-base font-bold ${bajo ? "text-red-600" : "text-gray-900"}`}>{i.stock}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{i.stockMinimo}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{i.unidad}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{i.ubicacion ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

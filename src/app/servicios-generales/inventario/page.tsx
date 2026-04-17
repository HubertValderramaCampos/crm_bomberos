import { Package, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

const items = [
  { id: "1", codigo: "INV-001", nombre: "Manguera presurizada 45mm x 20m", categoria: "MANGUERAS", stock: 8, stockMinimo: 6, unidad: "rollos", ubicacion: "Almacén A" },
  { id: "2", codigo: "INV-002", nombre: "Manguera presurizada 70mm x 20m", categoria: "MANGUERAS", stock: 4, stockMinimo: 4, unidad: "rollos", ubicacion: "Almacén A" },
  { id: "3", codigo: "INV-003", nombre: "Lanzas de agua tipo pistola", categoria: "ACCESORIOS", stock: 6, stockMinimo: 4, unidad: "unidades", ubicacion: "Almacén A" },
  { id: "4", codigo: "INV-004", nombre: "Espuma AFFF 6% (bidones)", categoria: "AGENTES EXTINTORES", stock: 2, stockMinimo: 4, unidad: "bidones 20L", ubicacion: "Almacén B" },
  { id: "5", codigo: "INV-005", nombre: "Extintores PQS 10kg", categoria: "AGENTES EXTINTORES", stock: 5, stockMinimo: 4, unidad: "unidades", ubicacion: "Almacén B" },
  { id: "6", codigo: "INV-006", nombre: "Combustible Diesel (reserva)", categoria: "COMBUSTIBLES", stock: 80, stockMinimo: 100, unidad: "litros", ubicacion: "Cisterna" },
  { id: "7", codigo: "INV-007", nombre: "Aceite de motor 15W40", categoria: "LUBRICANTES", stock: 12, stockMinimo: 8, unidad: "litros", ubicacion: "Taller" },
  { id: "8", codigo: "INV-008", nombre: "Cascos de bombero", categoria: "EPP", stock: 10, stockMinimo: 8, unidad: "unidades", ubicacion: "Almacén EPP" },
  { id: "9", codigo: "INV-009", nombre: "Guantes de combate", categoria: "EPP", stock: 3, stockMinimo: 8, unidad: "pares", ubicacion: "Almacén EPP" },
  { id: "10", codigo: "INV-010", nombre: "Botas de seguridad", categoria: "EPP", stock: 6, stockMinimo: 6, unidad: "pares", ubicacion: "Almacén EPP" },
];

export default function InventarioPage() {
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

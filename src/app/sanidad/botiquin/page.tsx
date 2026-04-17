import { Pill, AlertTriangle, XCircle, Package } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatCard } from "@/components/ui-custom/StatCard";

const items = [
  { id: "1", nombre: "Vendas elásticas 4\"", categoria: "MATERIALES DE CURACIÓN", cantidad: 15, cantidadMinima: 10, unidad: "unidades", fechaVencimiento: null, ubicacion: "Armario A" },
  { id: "2", nombre: "Gasas estériles 10x10cm", categoria: "MATERIALES DE CURACIÓN", cantidad: 8, cantidadMinima: 20, unidad: "paquetes", fechaVencimiento: null, ubicacion: "Armario A" },
  { id: "3", nombre: "Alcohol 70°", categoria: "ANTISÉPTICOS", cantidad: 5, cantidadMinima: 5, unidad: "frascos 500ml", fechaVencimiento: "2026-12-31", ubicacion: "Armario B" },
  { id: "4", nombre: "Agua oxigenada", categoria: "ANTISÉPTICOS", cantidad: 3, cantidadMinima: 4, unidad: "frascos 500ml", fechaVencimiento: "2026-08-15", ubicacion: "Armario B" },
  { id: "5", nombre: "Ibuprofeno 400mg", categoria: "MEDICAMENTOS", cantidad: 48, cantidadMinima: 30, unidad: "tabletas", fechaVencimiento: "2026-04-30", ubicacion: "Armario C" },
  { id: "6", nombre: "Paracetamol 500mg", categoria: "MEDICAMENTOS", cantidad: 60, cantidadMinima: 30, unidad: "tabletas", fechaVencimiento: "2027-03-20", ubicacion: "Armario C" },
  { id: "7", nombre: "Suero fisiológico 500ml", categoria: "SOLUCIONES", cantidad: 4, cantidadMinima: 6, unidad: "bolsas", fechaVencimiento: "2026-06-30", ubicacion: "Refrigerador" },
  { id: "8", nombre: "Mascarilla de oxígeno adulto", categoria: "EQUIPOS", cantidad: 2, cantidadMinima: 2, unidad: "unidades", fechaVencimiento: null, ubicacion: "Unidad de rescate" },
  { id: "9", nombre: "Férulas inflables", categoria: "EQUIPOS", cantidad: 3, cantidadMinima: 2, unidad: "juegos", fechaVencimiento: null, ubicacion: "Almacén" },
  { id: "10", nombre: "Guantes de nitrilo M", categoria: "EQUIPOS", cantidad: 20, cantidadMinima: 50, unidad: "pares", fechaVencimiento: null, ubicacion: "Armario A" },
];

export default function BotiquinPage() {
  const hoy = new Date();
  const en30dias = new Date(hoy);
  en30dias.setDate(hoy.getDate() + 30);

  const vencidos = items.filter((i) => i.fechaVencimiento && new Date(i.fechaVencimiento) < hoy);
  const porVencer = items.filter((i) => i.fechaVencimiento && new Date(i.fechaVencimiento) <= en30dias && new Date(i.fechaVencimiento) >= hoy);
  const bajosStock = items.filter((i) => i.cantidad <= i.cantidadMinima);

  const byCategoria: Record<string, typeof items> = {};
  items.forEach((i) => { byCategoria[i.categoria] = [...(byCategoria[i.categoria] ?? []), i]; });

  return (
    <div className="space-y-6">
      <PageHeader icon={Pill} title="Botiquín" subtitle={`${items.length} ítems registrados`} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={XCircle} label="Vencidos" value={vencidos.length} accent="red" />
        <StatCard icon={AlertTriangle} label="Por Vencer (30 días)" value={porVencer.length} accent="yellow" />
        <StatCard icon={Package} label="Bajo Cantidad Mínima" value={bajosStock.length} accent="yellow" />
      </div>

      {(vencidos.length > 0 || porVencer.length > 0 || bajosStock.length > 0) && (
        <div className="space-y-2">
          {vencidos.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">{vencidos.length} ítem(s) VENCIDOS — retirar inmediatamente</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {vencidos.map((i) => (
                    <span key={i.id} className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-md font-medium">{i.nombre}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {porVencer.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800"><strong>{porVencer.length} ítem(s)</strong> vencen en los próximos 30 días</p>
            </div>
          )}
          {bajosStock.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <Package className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-sm text-orange-800"><strong>{bajosStock.length} ítem(s)</strong> por debajo de la cantidad mínima</p>
            </div>
          )}
        </div>
      )}

      {Object.entries(byCategoria).map(([cat, catItems]) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{cat}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Nombre", "Cantidad", "Mínimo", "Vencimiento", "Ubicación"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {catItems.map((i) => {
                  const vencido = i.fechaVencimiento && new Date(i.fechaVencimiento) < hoy;
                  const prox = i.fechaVencimiento && new Date(i.fechaVencimiento) <= en30dias && !vencido;
                  const bajo = i.cantidad <= i.cantidadMinima;
                  return (
                    <tr key={i.id} className={`hover:bg-gray-50 transition-colors ${vencido ? "bg-red-50" : bajo ? "bg-orange-50" : ""}`}>
                      <td className="px-5 py-3 font-medium text-gray-900">{i.nombre}</td>
                      <td className="px-5 py-3">
                        <span className={`font-bold text-base ${bajo ? "text-orange-600" : "text-gray-900"}`}>{i.cantidad}</span>
                        <span className="text-gray-400 text-xs ml-1">{i.unidad}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{i.cantidadMinima}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {i.fechaVencimiento ? (
                          <span className={`text-xs font-semibold ${vencido ? "text-red-600" : prox ? "text-amber-600" : "text-gray-600"}`}>
                            {new Date(i.fechaVencimiento).toLocaleDateString("es-PE")}
                            {vencido && " — VENCIDO"}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{i.ubicacion ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

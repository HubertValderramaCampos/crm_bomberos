import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatCard } from "@/components/ui-custom/StatCard";

const partidas = [
  { id: "1", descripcion: "Remuneraciones y beneficios", categoria: "PERSONAL", montoAprobado: 480000, montoEjecutado: 156000 },
  { id: "2", descripcion: "Combustibles y lubricantes", categoria: "BIENES", montoAprobado: 85000, montoEjecutado: 62400 },
  { id: "3", descripcion: "Mantenimiento de vehículos", categoria: "SERVICIOS", montoAprobado: 120000, montoEjecutado: 89500 },
  { id: "4", descripcion: "Equipos de protección personal", categoria: "BIENES", montoAprobado: 65000, montoEjecutado: 48000 },
  { id: "5", descripcion: "Capacitación y formación", categoria: "SERVICIOS", montoAprobado: 30000, montoEjecutado: 12500 },
  { id: "6", descripcion: "Material médico y botiquín", categoria: "BIENES", montoAprobado: 20000, montoEjecutado: 8900 },
  { id: "7", descripcion: "Servicios básicos (agua, luz, internet)", categoria: "SERVICIOS", montoAprobado: 18000, montoEjecutado: 6200 },
];

export default function PresupuestoPage() {
  const totalAprobado = partidas.reduce((s, p) => s + p.montoAprobado, 0);
  const totalEjecutado = partidas.reduce((s, p) => s + p.montoEjecutado, 0);
  const totalSaldo = totalAprobado - totalEjecutado;
  const pct = totalAprobado > 0 ? Math.round((totalEjecutado / totalAprobado) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={DollarSign} title="Presupuesto 2026" subtitle="Ejecución presupuestal por partida" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Presupuesto Aprobado" value={`S/ ${totalAprobado.toLocaleString("es-PE")}`} accent="slate" />
        <StatCard icon={DollarSign} label="Monto Ejecutado" value={`S/ ${totalEjecutado.toLocaleString("es-PE")}`} accent="green" sub={`${pct}% del total`} />
        <StatCard icon={DollarSign} label="Saldo Disponible" value={`S/ ${totalSaldo.toLocaleString("es-PE")}`} accent={totalSaldo < 0 ? "red" : "blue"} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Ejecución global</p>
          <p className="text-sm font-bold text-gray-900">{pct}%</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${pct >= 90 ? "bg-red-600" : pct >= 70 ? "bg-amber-500" : "bg-green-600"}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Partidas Presupuestales</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {partidas.map((p) => {
            const pctP = p.montoAprobado > 0 ? Math.round((p.montoEjecutado / p.montoAprobado) * 100) : 0;
            const saldo = p.montoAprobado - p.montoEjecutado;
            return (
              <div key={p.id} className="px-6 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{p.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.categoria}</p>
                  </div>
                  <span className={`text-sm font-bold ${pctP >= 90 ? "text-red-600" : pctP >= 70 ? "text-amber-600" : "text-green-700"}`}>
                    {pctP}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-2 rounded-full ${pctP >= 90 ? "bg-red-500" : pctP >= 70 ? "bg-amber-400" : "bg-green-500"}`}
                    style={{ width: `${Math.min(pctP, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 text-xs text-gray-500">
                  <span>Ejecutado: <strong className="text-gray-800">S/ {p.montoEjecutado.toLocaleString("es-PE")}</strong></span>
                  <span className="text-center">Aprobado: <strong className="text-gray-800">S/ {p.montoAprobado.toLocaleString("es-PE")}</strong></span>
                  <span className="text-right">Saldo: <strong className={saldo < 0 ? "text-red-600" : "text-gray-800"}>S/ {saldo.toLocaleString("es-PE")}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Truck } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const ESTADO_COLOR: Record<string, "green"|"yellow"|"red"|"gray"> = {
  OPERATIVO: "green", EN_MANTENIMIENTO: "yellow", FUERA_DE_SERVICIO: "red", BAJA: "gray",
};
const TIPO_LABEL: Record<string, string> = {
  AUTOBOMBA: "Autobomba", AUTOTANQUE: "Autotanque", UNIDAD_RESCATE: "Unidad de Rescate",
  AMBULANCIA: "Ambulancia", CAMIONETA_COMANDO: "Camioneta Comando", UNIDAD_APOYO: "Unidad de Apoyo",
};

const vehiculos = [
  { id: "1", nombre: "B-101 Autobomba", tipo: "AUTOBOMBA", placa: "B1-001", marca: "Mercedes-Benz", modelo: "Atego 1725", anio: 2018, kilometraje: 85400, estado: "OPERATIVO", ultimaRevision: "2026-03-10", proximaRevision: "2026-09-10", observaciones: null, mantenimientos: [] },
  { id: "2", nombre: "B-102 Autobomba", tipo: "AUTOBOMBA", placa: "B1-002", marca: "Scania", modelo: "P310", anio: 2015, kilometraje: 142000, estado: "EN_MANTENIMIENTO", ultimaRevision: "2026-01-15", proximaRevision: "2026-04-15", observaciones: "En revisión de sistema hidráulico.", mantenimientos: [{id:"1"}] },
  { id: "3", nombre: "R-101 Unidad de Rescate", tipo: "UNIDAD_RESCATE", placa: "B1-003", marca: "Toyota", modelo: "Land Cruiser 200", anio: 2020, kilometraje: 41200, estado: "OPERATIVO", ultimaRevision: "2026-02-20", proximaRevision: "2026-08-20", observaciones: null, mantenimientos: [] },
  { id: "4", nombre: "A-101 Ambulancia", tipo: "AMBULANCIA", placa: "B1-004", marca: "Ford", modelo: "Transit", anio: 2021, kilometraje: 28500, estado: "OPERATIVO", ultimaRevision: "2026-04-01", proximaRevision: "2026-10-01", observaciones: null, mantenimientos: [] },
  { id: "5", nombre: "C-101 Comando", tipo: "CAMIONETA_COMANDO", placa: "B1-005", marca: "Mitsubishi", modelo: "L200", anio: 2019, kilometraje: 67800, estado: "OPERATIVO", ultimaRevision: "2026-03-25", proximaRevision: "2026-09-25", observaciones: null, mantenimientos: [] },
  { id: "6", nombre: "T-101 Autotanque", tipo: "AUTOTANQUE", placa: "B1-006", marca: "Volvo", modelo: "FM 440", anio: 2012, kilometraje: 218000, estado: "FUERA_DE_SERVICIO", ultimaRevision: "2025-06-10", proximaRevision: "2025-12-10", observaciones: "Motor requiere reparación mayor. En evaluación para baja.", mantenimientos: [{id:"1"},{id:"2"}] },
];

export default function VehiculosPage() {
  const operativos = vehiculos.filter((v) => v.estado === "OPERATIVO").length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Truck} title="Vehículos" subtitle={`${operativos} operativos de ${vehiculos.length} unidades`} />

      <div className="grid md:grid-cols-2 gap-4">
        {vehiculos.map((v) => {
          const estadoColor = ESTADO_COLOR[v.estado] ?? "gray";
          const proxVenc = v.proximaRevision && new Date(v.proximaRevision) < new Date();
          return (
            <div key={v.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-sm transition-shadow ${v.estado !== "OPERATIVO" ? "border-amber-300" : "border-gray-200"}`}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{v.nombre}</p>
                    <p className="text-xs text-gray-500">{TIPO_LABEL[v.tipo] ?? v.tipo}</p>
                  </div>
                </div>
                <StatusBadge label={v.estado.replace(/_/g, " ")} color={estadoColor} />
              </div>

              <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Placa</p>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{v.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Marca / Modelo</p>
                  <p className="text-gray-700 mt-0.5">{v.marca} {v.modelo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Año</p>
                  <p className="text-gray-700 mt-0.5">{v.anio}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Kilometraje</p>
                  <p className="text-gray-700 mt-0.5">{v.kilometraje.toLocaleString("es-PE")} km</p>
                </div>
                {v.ultimaRevision && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Última revisión</p>
                    <p className="text-gray-700 mt-0.5">{new Date(v.ultimaRevision).toLocaleDateString("es-PE")}</p>
                  </div>
                )}
                {v.proximaRevision && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Próxima revisión</p>
                    <p className={`mt-0.5 font-medium ${proxVenc ? "text-red-600" : "text-gray-700"}`}>
                      {new Date(v.proximaRevision).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                )}
              </div>

              {(v.observaciones || v.mantenimientos.length > 0) && (
                <div className="px-5 pb-4 space-y-1.5">
                  {v.observaciones && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">{v.observaciones}</p>}
                  {v.mantenimientos.length > 0 && (
                    <p className="text-xs text-amber-700 font-medium">{v.mantenimientos.length} mantenimiento(s) pendiente(s)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

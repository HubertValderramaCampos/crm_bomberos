import { prisma } from "@/lib/prisma";
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

export default async function VehiculosPage() {
  const vehiculos = await prisma.vehiculo.findMany({
    orderBy: { nombre: "asc" },
    include: { mantenimientos: { where: { estado: { in: ["PENDIENTE", "EN_PROCESO"] } } } },
  });
  const operativos = vehiculos.filter((v) => v.estado === "OPERATIVO").length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Truck} title="Vehículos" subtitle={`${operativos} operativos de ${vehiculos.length} unidades`} />

      <div className="grid md:grid-cols-2 gap-4">
        {vehiculos.map((v) => {
          const estadoColor = ESTADO_COLOR[v.estado] ?? "gray";
          const proxVenc = v.proximaRevision && new Date(v.proximaRevision) < new Date();
          return (
            <div
              key={v.id}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-sm transition-shadow ${v.estado !== "OPERATIVO" ? "border-amber-300" : "border-gray-200"}`}
            >
              {/* Header */}
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

              {/* Body */}
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
                  {v.observaciones && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">{v.observaciones}</p>
                  )}
                  {v.mantenimientos.length > 0 && (
                    <p className="text-xs text-amber-700 font-medium">
                      {v.mantenimientos.length} mantenimiento(s) pendiente(s)
                    </p>
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

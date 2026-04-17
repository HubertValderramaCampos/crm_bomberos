import { prisma } from "@/lib/prisma";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const ESTADO_COLOR: Record<string, "yellow"|"blue"|"green"|"gray"> = {
  PENDIENTE: "yellow", EN_PROCESO: "blue", COMPLETADO: "green", CANCELADO: "gray",
};
const TIPO_LABEL: Record<string, string> = {
  PREVENTIVO: "Preventivo", CORRECTIVO: "Correctivo", REVISION_PERIODICA: "Revisión Periódica",
};

export default async function MantenimientoPage() {
  const mantenimientos = await prisma.mantenimiento.findMany({
    orderBy: { fechaProgramada: "desc" },
    include: {
      vehiculo: { select: { nombre: true, placa: true } },
      equipo: { select: { nombre: true, codigo: true } },
    },
  });

  const pendientes = mantenimientos.filter((m) => m.estado === "PENDIENTE").length;
  const enProceso = mantenimientos.filter((m) => m.estado === "EN_PROCESO").length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Wrench}
        title="Mantenimiento"
        subtitle={`${pendientes} pendientes · ${enProceso} en proceso`}
      />

      {(pendientes > 0 || enProceso > 0) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{pendientes + enProceso} mantenimiento(s)</strong> requieren atención
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Tipo", "Descripción", "Activo", "Fecha Prog.", "Proveedor", "Costo", "Estado"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mantenimientos.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-gray-600 font-medium whitespace-nowrap">
                    {TIPO_LABEL[m.tipo] ?? m.tipo}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-gray-900 truncate">{m.descripcion}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {m.vehiculo
                      ? `${m.vehiculo.nombre} (${m.vehiculo.placa})`
                      : m.equipo
                      ? `${m.equipo.nombre}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(m.fechaProgramada).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{m.proveedor ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700 text-sm whitespace-nowrap">
                    {m.costo ? `S/ ${m.costo.toLocaleString("es-PE")}` : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={m.estado.replace(/_/g, " ")} color={ESTADO_COLOR[m.estado] ?? "gray"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const GRADO_LABELS: Record<string, string> = {
  BOMBERO_RASO: "Bro. Raso", BOMBERO_PRIMERO: "Bro. 1.°", CABO: "Cabo",
  SARGENTO_SEGUNDO: "Sgto. 2.°", SARGENTO_PRIMERO: "Sgto. 1.°", ALFEREZ: "Alférez",
  TENIENTE: "Tte.", CAPITAN: "Cap.", MAYOR: "My.",
  TENIENTE_CORONEL: "Tte. Crnl.", CORONEL: "Crnl.", GENERAL: "Gral.",
};
const ESTADO_COLOR: Record<string, "green"|"gray"|"red"|"yellow"> = {
  ACTIVO: "green", INACTIVO: "gray", SUSPENDIDO: "red",
  BAJA_TEMPORAL: "yellow", BAJA_DEFINITIVA: "red",
};

export default async function PersonalPage() {
  const bomberos = await prisma.bombero.findMany({
    orderBy: [{ estado: "asc" }, { apellidos: "asc" }],
  });
  const activos = bomberos.filter((b) => b.estado === "ACTIVO").length;

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Personal"
        subtitle={`${activos} bomberos activos · ${bomberos.length} registros totales`}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["CIP", "Apellidos y Nombres", "Grado", "Área Principal", "Ingreso", "Estado"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomberos.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400 font-medium">{b.cip}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{b.apellidos}, {b.nombres}</p>
                    {b.telefono && <p className="text-xs text-gray-400 mt-0.5">{b.telefono}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm">{GRADO_LABELS[b.grado] ?? b.grado}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{b.areaPrincipal?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(b.fechaIngreso).toLocaleDateString("es-PE", { year: "numeric", month: "short" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={b.estado.replace(/_/g, " ")}
                      color={ESTADO_COLOR[b.estado] ?? "gray"}
                    />
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

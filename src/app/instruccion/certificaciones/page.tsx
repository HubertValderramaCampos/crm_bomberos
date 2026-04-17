import { prisma } from "@/lib/prisma";
import { Award, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default async function CertificacionesPage() {
  const certificaciones = await prisma.certificacion.findMany({
    orderBy: { fechaEmision: "desc" },
    include: { bombero: { select: { nombres: true, apellidos: true, cip: true, grado: true } } },
  });

  const hoy = new Date();
  const en30 = new Date(hoy);
  en30.setDate(hoy.getDate() + 30);

  const vencidas = certificaciones.filter((c) => c.fechaVencimiento && new Date(c.fechaVencimiento) < hoy);
  const porVencer = certificaciones.filter((c) => c.fechaVencimiento && new Date(c.fechaVencimiento) <= en30 && new Date(c.fechaVencimiento) >= hoy);

  return (
    <div className="space-y-5">
      <PageHeader icon={Award} title="Certificaciones" subtitle={`${certificaciones.length} registradas`} />

      {(vencidas.length > 0 || porVencer.length > 0) && (
        <div className="space-y-2">
          {vencidas.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                <strong>{vencidas.length} certificación(es) vencida(s)</strong> — requieren renovación
              </p>
            </div>
          )}
          {porVencer.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{porVencer.length} certificación(es)</strong> vencen en los próximos 30 días
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Bombero", "Certificación", "Entidad Emisora", "Fecha Emisión", "Vencimiento"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificaciones.map((c) => {
                const vencida = c.fechaVencimiento && new Date(c.fechaVencimiento) < hoy;
                const proxima = c.fechaVencimiento && new Date(c.fechaVencimiento) <= en30 && !vencida;
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${vencida ? "bg-red-50" : proxima ? "bg-amber-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{c.bombero.apellidos}, {c.bombero.nombres}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.bombero.cip}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{c.entidadEmisora}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(c.fechaEmision).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {c.fechaVencimiento ? (
                        <span className={`text-xs font-semibold ${vencida ? "text-red-600" : proxima ? "text-amber-600" : "text-gray-600"}`}>
                          {new Date(c.fechaVencimiento).toLocaleDateString("es-PE")}
                          {vencida && " — VENCIDO"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin vencimiento</span>
                      )}
                    </td>
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

import { prisma } from "@/lib/prisma";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const TIPO_LABEL: Record<string, string> = {
  OFICIO: "Oficio", MEMORANDO: "Memorando", INFORME: "Informe",
  RESOLUCION: "Resolución", ACTA: "Acta", CONVENIO: "Convenio", OTRO: "Otro",
};
const ESTADO_COLOR: Record<string, "green"|"yellow"|"gray"> = {
  PUBLICADO: "green", BORRADOR: "yellow", ARCHIVADO: "gray",
};

export default async function DocumentosPage() {
  const docs = await prisma.documento.findMany({ orderBy: { fechaEmision: "desc" } });

  return (
    <div>
      <PageHeader icon={FileText} title="Documentos" subtitle={`${docs.length} documentos registrados`} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["N.° / Referencia", "Título", "Tipo", "Fecha de emisión", "Estado"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{d.numero ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{d.titulo}</p>
                    {d.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{d.descripcion}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{TIPO_LABEL[d.tipo] ?? d.tipo}</td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(d.fechaEmision).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={d.estado} color={ESTADO_COLOR[d.estado] ?? "gray"} />
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

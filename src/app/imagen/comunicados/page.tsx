import { Megaphone, Newspaper, Smartphone, ClipboardList, FileText, Edit3 } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { StatCard } from "@/components/ui-custom/StatCard";
import type React from "react";

const TIPO_LABEL: Record<string, string> = {
  PRENSA: "Prensa", REDES_SOCIALES: "Redes Sociales",
  BOLETIN_INTERNO: "Boletín Interno", COMUNICADO_OFICIAL: "Comunicado Oficial",
};
const TIPO_COLOR: Record<string, "blue" | "orange" | "green" | "red"> = {
  PRENSA: "blue", REDES_SOCIALES: "orange",
  BOLETIN_INTERNO: "green", COMUNICADO_OFICIAL: "red",
};
const TIPO_ICON: Record<string, React.ElementType> = {
  PRENSA: Newspaper, REDES_SOCIALES: Smartphone,
  BOLETIN_INTERNO: ClipboardList, COMUNICADO_OFICIAL: Megaphone,
};

const comunicados = [
  { id: "1", titulo: "La Compañía de Bomberos Voluntarios sofoca incendio en edificio de Breña", tipo: "PRENSA", estado: "PUBLICADO", contenido: "En la madrugada del 17 de abril, la compañía respondió al llamado de emergencia en Av. Brasil 1245. Gracias a la rápida intervención, se evitaron mayores pérdidas humanas y materiales.", fechaPublicacion: "2026-04-17", createdAt: "2026-04-17" },
  { id: "2", titulo: "Simulacro de evacuación en el Centro de Lima este sábado", tipo: "REDES_SOCIALES", estado: "PUBLICADO", contenido: "Este sábado 19 de abril realizaremos un simulacro de evacuación en coordinación con la Municipalidad de Lima. Invitamos a la ciudadanía a participar.", fechaPublicacion: "2026-04-15", createdAt: "2026-04-14" },
  { id: "3", titulo: "Boletín interno N.° 04 – Abril 2026", tipo: "BOLETIN_INTERNO", estado: "PUBLICADO", contenido: "Estimados compañeros: se adjunta el boletín mensual con el resumen de actividades, guardias y novedades del mes.", fechaPublicacion: "2026-04-10", createdAt: "2026-04-10" },
  { id: "4", titulo: "Comunicado sobre protocolo de respuesta a materiales peligrosos", tipo: "COMUNICADO_OFICIAL", estado: "BORRADOR", contenido: "Se actualiza el protocolo interno de atención a incidentes con materiales peligrosos. Pendiente de revisión por la jefatura.", fechaPublicacion: null, createdAt: "2026-04-12" },
  { id: "5", titulo: "Jornada de capacitación en rescate vehicular – inscripciones abiertas", tipo: "REDES_SOCIALES", estado: "PUBLICADO", contenido: "Abrimos inscripciones para la jornada de capacitación en técnicas de rescate vehicular. Cupos limitados.", fechaPublicacion: "2026-04-08", createdAt: "2026-04-07" },
  { id: "6", titulo: "Nuevo convenio con hospital regional", tipo: "COMUNICADO_OFICIAL", estado: "BORRADOR", contenido: "Se está coordinando la firma de un convenio de cooperación con el Hospital Regional para atención de emergencias médicas.", fechaPublicacion: null, createdAt: "2026-04-13" },
];

export default function ComunicadosPage() {
  const publicados = comunicados.filter((c) => c.estado === "PUBLICADO").length;
  const borradores = comunicados.filter((c) => c.estado === "BORRADOR").length;

  return (
    <div className="space-y-6">
      <PageHeader icon={Megaphone} title="Comunicados" subtitle={`${publicados} publicados · ${borradores} borradores`} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Megaphone} label="Publicados" value={publicados} accent="green" />
        <StatCard icon={Edit3} label="Borradores" value={borradores} accent="yellow" />
      </div>

      {borradores > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{borradores} borrador(es)</strong> pendiente(s) de revisión y publicación
          </p>
        </div>
      )}

      <div className="space-y-3">
        {comunicados.map((c) => {
          const Icon = TIPO_ICON[c.tipo] ?? FileText;
          return (
            <div key={c.id} className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${c.estado === "BORRADOR" ? "border-amber-300" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <StatusBadge label={TIPO_LABEL[c.tipo] ?? c.tipo.replace(/_/g, " ")} color={TIPO_COLOR[c.tipo] ?? "gray"} />
                </div>
                <StatusBadge label={c.estado} color={c.estado === "PUBLICADO" ? "green" : "yellow"} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{c.titulo}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{c.contenido}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                {c.fechaPublicacion && (
                  <span>Publicado: {new Date(c.fechaPublicacion).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</span>
                )}
                <span>Creado: {new Date(c.createdAt).toLocaleDateString("es-PE")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Siren, Users, Truck, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const TIPO_LABELS: Record<string, string> = {
  INCENDIO_URBANO: "Incendio Urbano", INCENDIO_FORESTAL: "Incendio Forestal",
  RESCATE_VEHICULAR: "Rescate Vehicular", RESCATE_ALTURA: "Rescate en Altura",
  RESCATE_ACUATICO: "Rescate Acuático", MATERIALES_PELIGROSOS: "Mat. Peligrosos",
  EMERGENCIA_MEDICA: "Emergencia Médica", APOYO_INTER_INSTITUCIONAL: "Apoyo Interinst.",
  FALSA_ALARMA: "Falsa Alarma", OTRO: "Otro",
};
const NIVEL_COLOR: Record<string, "blue"|"yellow"|"red"> = {
  PRIMERA_ALARMA: "blue", SEGUNDA_ALARMA: "yellow", TERCERA_ALARMA: "red",
};
const NIVEL_LABEL: Record<string, string> = {
  PRIMERA_ALARMA: "1.ª Alarma", SEGUNDA_ALARMA: "2.ª Alarma", TERCERA_ALARMA: "3.ª Alarma",
};
const ESTADO_COLOR: Record<string, "red"|"yellow"|"green"|"gray"> = {
  EN_CURSO: "red", CONTROLADA: "yellow", CERRADA: "green", CANCELADA: "gray",
};
const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO: "En Curso", CONTROLADA: "Controlada", CERRADA: "Cerrada", CANCELADA: "Cancelada",
};

function minDiff(a: Date, b: Date | null) {
  if (!b) return null;
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

const emergencias = [
  { id: "1", codigoEmergencia: "EM-2026-041", tipo: "INCENDIO_URBANO", nivel: "SEGUNDA_ALARMA", estado: "EN_CURSO", direccion: "Av. Brasil 1245", distrito: "Breña", fechaHoraAlerta: "2026-04-17T08:30:00", fechaHoraLlegada: "2026-04-17T08:43:00", descripcion: "Incendio en edificio de 5 pisos, se reportan personas atrapadas", heridos: 2, bajas: 0, bomberos: [{id:"1"},{id:"2"},{id:"3"}], vehiculos: [{id:"1"},{id:"2"}] },
  { id: "2", codigoEmergencia: "EM-2026-040", tipo: "RESCATE_VEHICULAR", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Carretera Central km 8", distrito: "Ate", fechaHoraAlerta: "2026-04-16T15:10:00", fechaHoraLlegada: "2026-04-16T15:28:00", descripcion: "Volcadura de camión con mercancía", heridos: 1, bajas: 0, bomberos: [{id:"1"},{id:"2"}], vehiculos: [{id:"1"}] },
  { id: "3", codigoEmergencia: "EM-2026-039", tipo: "EMERGENCIA_MEDICA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Jr. Huallaga 320", distrito: "Lima Cercado", fechaHoraAlerta: "2026-04-15T22:45:00", fechaHoraLlegada: "2026-04-15T22:55:00", descripcion: null, heridos: 0, bajas: 0, bomberos: [{id:"1"}], vehiculos: [{id:"1"}] },
  { id: "4", codigoEmergencia: "EM-2026-038", tipo: "INCENDIO_FORESTAL", nivel: "TERCERA_ALARMA", estado: "CONTROLADA", direccion: "Lomas de Carabayllo", distrito: "Carabayllo", fechaHoraAlerta: "2026-04-14T11:00:00", fechaHoraLlegada: "2026-04-14T11:22:00", descripcion: "Incendio forestal de gran magnitud, viento favorable", heridos: 0, bajas: 0, bomberos: [{id:"1"},{id:"2"},{id:"3"},{id:"4"}], vehiculos: [{id:"1"},{id:"2"},{id:"3"}] },
  { id: "5", codigoEmergencia: "EM-2026-037", tipo: "FALSA_ALARMA", nivel: "PRIMERA_ALARMA", estado: "CANCELADA", direccion: "Av. Arequipa 3100", distrito: "San Isidro", fechaHoraAlerta: "2026-04-13T09:15:00", fechaHoraLlegada: "2026-04-13T09:25:00", descripcion: null, heridos: 0, bajas: 0, bomberos: [{id:"1"}], vehiculos: [{id:"1"}] },
  { id: "6", codigoEmergencia: "EM-2026-036", tipo: "MATERIALES_PELIGROSOS", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Zona industrial – Ate Vitarte", distrito: "Ate", fechaHoraAlerta: "2026-04-12T14:30:00", fechaHoraLlegada: "2026-04-12T14:48:00", descripcion: "Fuga de gas industrial en almacén", heridos: 3, bajas: 0, bomberos: [{id:"1"},{id:"2"},{id:"3"}], vehiculos: [{id:"1"},{id:"2"}] },
];

export default function EmergenciasPage() {
  const enCurso = emergencias.filter((e) => e.estado === "EN_CURSO").length;

  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={Siren} title="Emergencias" subtitle={`${emergencias.length} atenciones registradas · ${enCurso} en curso`} />

      {enCurso > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-red-700 text-white rounded-xl">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse shrink-0" />
          <p className="font-semibold text-sm">
            {enCurso} emergencia{enCurso > 1 ? "s" : ""} activa{enCurso > 1 ? "s" : ""} en este momento
          </p>
        </div>
      )}

      <div className="space-y-3">
        {emergencias.map((e) => {
          const tResp = minDiff(new Date(e.fechaHoraAlerta), e.fechaHoraLlegada ? new Date(e.fechaHoraLlegada) : null);
          const activa = e.estado === "EN_CURSO";
          return (
            <div key={e.id} className={`bg-white rounded-xl border transition-shadow hover:shadow-sm ${activa ? "border-red-300" : "border-gray-200"}`}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activa ? "bg-red-700" : "bg-gray-100"}`}>
                      <Siren className={`w-4 h-4 ${activa ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-gray-400 font-medium">{e.codigoEmergencia}</span>
                        <StatusBadge label={NIVEL_LABEL[e.nivel] ?? e.nivel} color={NIVEL_COLOR[e.nivel] ?? "gray"} />
                        <StatusBadge label={ESTADO_LABEL[e.estado] ?? e.estado} color={ESTADO_COLOR[e.estado] ?? "gray"} />
                      </div>
                      <p className="font-semibold text-gray-900">{TIPO_LABELS[e.tipo] ?? e.tipo}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{e.direccion} · {e.distrito}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 shrink-0">
                    <p className="font-medium text-gray-600">
                      {new Date(e.fechaHoraAlerta).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p>{new Date(e.fechaHoraAlerta).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs</p>
                  </div>
                </div>

                {e.descripcion && (
                  <p className="text-sm text-gray-500 mt-3 ml-12 border-t border-gray-50 pt-3">{e.descripcion}</p>
                )}

                <div className="flex items-center gap-5 mt-3 ml-12 text-xs text-gray-400">
                  {tResp !== null && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3 h-3" />
                      {tResp} min respuesta
                    </span>
                  )}
                  {e.heridos > 0 && <span className="text-amber-600 font-medium">{e.heridos} herido{e.heridos > 1 ? "s" : ""}</span>}
                  {e.bajas > 0 && <span className="text-red-700 font-semibold">{e.bajas} baja{e.bajas > 1 ? "s" : ""}</span>}
                  {e.bomberos.length > 0 && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.bomberos.length}</span>
                  )}
                  {e.vehiculos.length > 0 && (
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {e.vehiculos.length}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

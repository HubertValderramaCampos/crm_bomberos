import { CalendarCheck, MapPin, Globe, Lock, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { StatCard } from "@/components/ui-custom/StatCard";

const eventos = [
  { id: "1", titulo: "Simulacro de evacuación – Centro de Lima", descripcion: "Ejercicio de evacuación en coordinación con Municipalidad de Lima y Defensa Civil.", fechaInicio: "2026-04-19T09:00:00", fechaFin: "2026-04-19T12:00:00", lugar: "Plaza Mayor de Lima", publico: true },
  { id: "2", titulo: "Capacitación: Rescate en Altura", descripcion: "Jornada de entrenamiento especializado para el equipo de rescate.", fechaInicio: "2026-04-22T08:00:00", fechaFin: "2026-04-22T17:00:00", lugar: "Cuartel Central", publico: false },
  { id: "3", titulo: "Día del Bombero Voluntario", descripcion: "Ceremonia de reconocimiento y acto público en conmemoración del día del bombero.", fechaInicio: "2026-05-05T10:00:00", fechaFin: "2026-05-05T13:00:00", lugar: "Parque Kennedy, Miraflores", publico: true },
  { id: "4", titulo: "Reunión mensual de jefes de guardia", descripcion: null, fechaInicio: "2026-04-30T16:00:00", fechaFin: "2026-04-30T18:00:00", lugar: "Sala de reuniones – Compañía", publico: false },
  { id: "5", titulo: "Incendio forestal – Operativo Lomas de Carabayllo", descripcion: "Operativo de control de incendio forestal con 4 unidades y apoyo de Municipalidad.", fechaInicio: "2026-04-14T11:00:00", fechaFin: "2026-04-14T20:00:00", lugar: "Lomas de Carabayllo", publico: true },
  { id: "6", titulo: "Charla de seguridad en colegio San Pedro", descripcion: "Charla educativa sobre prevención de incendios dirigida a alumnos de primaria.", fechaInicio: "2026-04-10T09:00:00", fechaFin: "2026-04-10T11:00:00", lugar: "Colegio San Pedro – Los Olivos", publico: true },
];

export default function EventosPage() {
  const hoy = new Date();
  const proximos = eventos.filter((e) => new Date(e.fechaInicio) >= hoy);
  const pasados = eventos.filter((e) => new Date(e.fechaInicio) < hoy);

  function EventoCard({ evento }: { evento: (typeof eventos)[0] }) {
    const esFuturo = new Date(evento.fechaInicio) >= hoy;
    const esHoy = new Date(evento.fechaInicio).toDateString() === hoy.toDateString();
    return (
      <div className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${esHoy ? "border-red-400" : esFuturo ? "border-blue-200" : "border-gray-200 opacity-80"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {esHoy && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">HOY</span>}
            <StatusBadge label={evento.publico ? "Público" : "Interno"} color={evento.publico ? "green" : "gray"} />
          </div>
          <div className="text-right text-xs text-gray-500 shrink-0">
            <p className="font-semibold text-gray-700">
              {new Date(evento.fechaInicio).toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" })}
            </p>
            <p className="flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(evento.fechaInicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs
            </p>
          </div>
        </div>

        <h3 className="font-bold text-gray-900">{evento.titulo}</h3>
        {evento.descripcion && <p className="text-sm text-gray-600 mt-1">{evento.descripcion}</p>}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          {evento.lugar && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evento.lugar}</span>
          )}
          {evento.fechaFin && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Hasta: {new Date(evento.fechaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs
            </span>
          )}
          <span className="flex items-center gap-1">
            {evento.publico ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {evento.publico ? "Evento público" : "Evento interno"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarCheck} title="Eventos" subtitle={`${proximos.length} próximos · ${pasados.length} pasados`} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={CalendarCheck} label="Próximos" value={proximos.length} accent="blue" />
        <StatCard icon={CalendarCheck} label="Realizados" value={pasados.length} accent="slate" />
      </div>

      {proximos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Próximos</p>
          <div className="grid md:grid-cols-2 gap-4">
            {proximos.map((e) => <EventoCard key={e.id} evento={e} />)}
          </div>
        </div>
      )}

      {pasados.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Realizados</p>
          <div className="grid md:grid-cols-2 gap-4">
            {pasados.map((e) => <EventoCard key={e.id} evento={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}

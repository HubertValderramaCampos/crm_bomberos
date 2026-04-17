import { prisma } from "@/lib/prisma";
import { CalendarCheck, MapPin, Globe, Lock, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { StatCard } from "@/components/ui-custom/StatCard";

export default async function EventosPage() {
  const eventos = await prisma.evento.findMany({ orderBy: { fechaInicio: "asc" } });

  const hoy = new Date();
  const proximos = eventos.filter((e) => new Date(e.fechaInicio) >= hoy);
  const pasados = eventos.filter((e) => new Date(e.fechaInicio) < hoy);

  function EventoCard({ evento }: { evento: (typeof eventos)[0] }) {
    const esFuturo = new Date(evento.fechaInicio) >= hoy;
    const esHoy = new Date(evento.fechaInicio).toDateString() === hoy.toDateString();
    return (
      <div
        className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
          esHoy ? "border-red-400" : esFuturo ? "border-blue-200" : "border-gray-200 opacity-80"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {esHoy && (
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">HOY</span>
            )}
            <StatusBadge
              label={evento.publico ? "Público" : "Interno"}
              color={evento.publico ? "green" : "gray"}
            />
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
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {evento.lugar}
            </span>
          )}
          {evento.fechaFin && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Hasta:{" "}
              {new Date(evento.fechaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} hrs
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

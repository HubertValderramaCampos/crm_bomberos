import { BarChart3, Siren, Clock, AlertTriangle, Users } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatCard } from "@/components/ui-custom/StatCard";

const TIPO_LABELS: Record<string, string> = {
  INCENDIO_URBANO: "Incendio Urbano", INCENDIO_FORESTAL: "Incendio Forestal",
  RESCATE_VEHICULAR: "Rescate Vehicular", RESCATE_ALTURA: "Rescate Altura",
  MATERIALES_PELIGROSOS: "Mat. Peligrosos", EMERGENCIA_MEDICA: "Emerg. Médica",
  APOYO_INTER_INSTITUCIONAL: "Apoyo Interinst.", FALSA_ALARMA: "Falsa Alarma", OTRO: "Otro",
};
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const porMes: Record<number, number> = { 0: 4, 1: 6, 2: 8, 3: 6 };
const porTipo: Record<string, number> = {
  INCENDIO_URBANO: 8, RESCATE_VEHICULAR: 6, EMERGENCIA_MEDICA: 4,
  INCENDIO_FORESTAL: 2, MATERIALES_PELIGROSOS: 2, FALSA_ALARMA: 2,
};
const totalEmergencias = 24;
const promedioRespuesta = 14;
const totalHeridos = 6;
const totalBajas = 0;

const sortedTipos = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);
const maxMes = Math.max(...Object.values(porMes), 1);
const maxTipo = Math.max(...Object.values(porTipo), 1);

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Estadísticas Operacionales" subtitle="Análisis de emergencias atendidas — 2026" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Siren}         label="Total Emergencias"       value={totalEmergencias}       accent="slate"  />
        <StatCard icon={Clock}         label="Tiempo prom. respuesta"  value={`${promedioRespuesta} min`} accent="blue" />
        <StatCard icon={AlertTriangle} label="Total Heridos"           value={totalHeridos}           accent="yellow" />
        <StatCard icon={Users}         label="Total Bajas"             value={totalBajas}             accent="red"    />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Emergencias por Mes</h2>
          <div className="space-y-3">
            {MESES.slice(0, 6).map((mes, idx) => {
              const count = porMes[idx] ?? 0;
              const pct = Math.round((count / maxMes) * 100);
              return (
                <div key={mes} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500 shrink-0 font-medium">{mes}</span>
                  <div className="flex-1 h-7 bg-gray-100 rounded overflow-hidden">
                    {count > 0 && (
                      <div className="h-7 bg-red-700 rounded flex items-center justify-end pr-2.5 transition-all" style={{ width: `${Math.max(pct, 8)}%` }}>
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                    )}
                  </div>
                  {count === 0 && <span className="text-xs text-gray-300 font-medium">0</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Emergencias por Tipo</h2>
          <div className="space-y-3">
            {sortedTipos.map(([tipo, count]) => {
              const pct = Math.round((count / maxTipo) * 100);
              return (
                <div key={tipo} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-gray-500 shrink-0 font-medium truncate">{TIPO_LABELS[tipo] ?? tipo}</span>
                  <div className="flex-1 h-7 bg-gray-100 rounded overflow-hidden">
                    <div className="h-7 bg-gray-700 rounded flex items-center justify-end pr-2.5 transition-all" style={{ width: `${Math.max(pct, 8)}%` }}>
                      <span className="text-white text-xs font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

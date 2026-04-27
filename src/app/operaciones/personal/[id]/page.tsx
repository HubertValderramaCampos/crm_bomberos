import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { User, Clock, CalendarCheck, Siren, ShieldCheck, ArrowLeft } from "lucide-react";
import pool from "@/lib/db";
import Link from "next/link";
import { BomberoHistorialChart } from "@/components/ui-custom/BomberoHistorialChart";

async function getBomberoDetalle(id: number) {
  const client = await pool.connect();
  try {
    const [bomberoRes, historialRes, emergenciasRes, turnosRecientes] = await Promise.all([
      client.query<{
        id: number; codigo: string; grado: string; apellidos: string; nombres: string;
        dni: string | null; fecha_ingreso: string | null; foto_url: string | null;
        estado_actual: string | null;
      }>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres, b.dni,
               b.fecha_ingreso::text, b.foto_url,
               CASE WHEN bea.estado ILIKE '%turno%' THEN 'en_turno'
                    ELSE NULL END AS estado_actual
        FROM bombero b
        LEFT JOIN bombero_estado_actual bea ON bea.bombero_id = b.id
        WHERE b.id = $1 AND b.activo = true
      `, [id]),

      client.query<{
        mes: number; anio: number; dias_asistidos: number;
        dias_guardia: number; horas_acumuladas: number; num_emergencias: number;
      }>(`
        SELECT mes, anio, dias_asistidos, dias_guardia, horas_acumuladas, num_emergencias
        FROM asistencia_mensual
        WHERE bombero_id = $1
        ORDER BY anio DESC, mes DESC
        LIMIT 12
      `, [id]),

      client.query<{
        numero_parte: string; tipo: string; tipo_desc: string | null;
        estado: string; fecha_salida: string | null; fecha_despacho: string | null;
        direccion: string | null;
      }>(`
        SELECT e.numero_parte, e.tipo,
               te.descripcion AS tipo_desc,
               e.estado,
               e.fecha_salida::text, e.fecha_despacho::text,
               e.direccion
        FROM emergencia e
        LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE e.al_mando_id = $1
        ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) DESC
        LIMIT 20
      `, [id]),

      client.query<{ dia: string; turnos: string }>(`
        SELECT DATE(ec.created_at)::text AS dia, COUNT(DISTINCT ec.id) AS turnos
        FROM asistencia_turno at2
        JOIN estado_compania ec ON ec.id = at2.estado_compania_id
        WHERE at2.bombero_id = $1
          AND ec.created_at >= NOW() - INTERVAL '60 days'
        GROUP BY dia
        ORDER BY dia DESC
        LIMIT 30
      `, [id]),
    ]);

    if (!bomberoRes.rows[0]) return null;

    return {
      bombero:        bomberoRes.rows[0],
      historial:      historialRes.rows.reverse(),
      emergencias:    emergenciasRes.rows,
      turnosRecientes: turnosRecientes.rows,
    };
  } finally {
    client.release();
  }
}

const MESES_ES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function BomberoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const data = await getBomberoDetalle(Number(id)).catch(() => null);
  if (!data) notFound();

  const { bombero, historial, emergencias, turnosRecientes } = data;

  const ultimoMes = historial[historial.length - 1];
  const totalHoras = historial.reduce((s, h) => s + (h.horas_acumuladas ?? 0), 0);
  const totalEmerg = historial.reduce((s, h) => s + (h.num_emergencias ?? 0), 0);

  const estadoBadge = bombero.estado_actual === "en_turno"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className="space-y-4 pb-6">
      {/* Back */}
      <Link href="/operaciones/personal" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Volver a Personal
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xl font-bold text-red-700 overflow-hidden">
          {bombero.foto_url
            ? <img src={bombero.foto_url} alt="foto" className="w-full h-full object-cover" />
            : `${bombero.apellidos.trim()[0]}${bombero.nombres[0]}`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{bombero.grado}</p>
          <h1 className="text-xl font-bold text-gray-900 truncate">{bombero.apellidos.trim()}, {bombero.nombres}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
            <span className="font-mono font-medium">{bombero.codigo}</span>
            {bombero.dni && <span>DNI {bombero.dni}</span>}
            {bombero.fecha_ingreso && (
              <span>Ingreso: {new Date(bombero.fecha_ingreso).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" })}</span>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${estadoBadge}`}>
          {bombero.estado_actual === "en_turno" ? "En turno" : "Franco"}
        </span>
      </div>

      {/* KPIs acumulados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Clock,         label: "Horas totales",  value: totalHoras + "h",                  sub: `${historial.length} meses`,           color: "text-purple-600" },
          { icon: CalendarCheck, label: "Días últ. mes",  value: ultimoMes?.dias_asistidos ?? "—",  sub: ultimoMes ? `${MESES_ES[ultimoMes.mes]} ${ultimoMes.anio}` : "sin datos", color: "text-blue-600" },
          { icon: Siren,         label: "Emergencias",    value: totalEmerg,                         sub: "acumulado",                           color: "text-red-600"    },
          { icon: ShieldCheck,   label: "Veces al mando", value: emergencias.length,                 sub: "partes registrados",                  color: "text-amber-600"  },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfica historial */}
      {historial.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-0.5">Historial mensual</h2>
          <p className="text-xs text-gray-400 mb-4">Horas acumuladas y emergencias por mes</p>
          <BomberoHistorialChart
            data={historial.map(h => ({
              label: `${MESES_ES[h.mes]} ${h.anio}`,
              horas: h.horas_acumuladas,
              emergencias: h.num_emergencias,
              dias: h.dias_asistidos,
            }))}
          />
        </div>
      )}

      {/* Tabla historial */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Asistencia por mes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Mes","Días asistidos","Guardias","Horas","Emergencias"].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...historial].reverse().map((h, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-700 text-xs">{MESES_ES[h.mes]} {h.anio}</td>
                  <td className="px-5 py-3 text-gray-700 text-xs">{h.dias_asistidos ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-700 text-xs">{h.dias_guardia ?? "—"}</td>
                  <td className="px-5 py-3 font-bold text-gray-900 text-xs">{h.horas_acumuladas ?? "—"}h</td>
                  <td className="px-5 py-3 text-gray-700 text-xs">{h.num_emergencias ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergencias como al mando */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Partes como Jefe de Emergencia</h2>
          <p className="text-xs text-gray-400 mt-0.5">{emergencias.length} partes registrados</p>
        </div>
        {emergencias.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin partes registrados como jefe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["N.° Parte","Tipo","Estado","Fecha","Dirección"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emergencias.map((e, i) => {
                  const fecha = e.fecha_salida ?? e.fecha_despacho;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-500">{e.numero_parte}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{e.tipo_desc ?? e.tipo}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          e.estado === "CERRADO" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                        }`}>{e.estado}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fecha ? new Date(fecha).toLocaleDateString("es-PE", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[220px]">
                        <p className="truncate">{e.direccion ?? "—"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

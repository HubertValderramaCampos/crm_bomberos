import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { Users, Truck, ShieldCheck, CheckCircle, Wrench, Siren, XCircle } from "lucide-react";

interface PersonalTurno {
  nombre_raw: string;
  tipo: string | null;
  hora_ingreso: string | null;
  es_al_mando: boolean | null;
  es_piloto: boolean | null;
  apellidos: string | null;
  nombres: string | null;
  grado: string | null;
  codigo: string | null;
}

interface Vehiculo {
  codigo: string;
  tipo: string | null;
  estado: string;
  motivo: string | null;
}

async function getCompaniaData() {
  const client = await pool.connect();
  try {
    const ecRes = await client.query<{ id: number; estado_general: string | null; primer_jefe: string | null; created_at: string }>(
      `SELECT id, estado_general, primer_jefe, created_at FROM estado_compania ORDER BY created_at DESC LIMIT 1`
    );
    const ec = ecRes.rows[0] ?? null;

    const [personalRes, vehiculosRes] = await Promise.all([
      ec ? client.query<PersonalTurno>(`
        SELECT at.nombre_raw, at.tipo, at.hora_ingreso, at.es_al_mando, at.es_piloto,
               b.apellidos, b.nombres, b.grado, b.codigo
        FROM asistencia_turno at
        LEFT JOIN bombero b ON b.id = at.bombero_id
        WHERE at.estado_compania_id = $1
        ORDER BY at.es_al_mando DESC, at.hora_ingreso
      `, [ec.id]) : Promise.resolve({ rows: [] }),

      client.query<Vehiculo>(
        `SELECT codigo, tipo, estado, motivo FROM vehiculo ORDER BY codigo`
      ),
    ]);

    return { ec, personal: personalRes.rows as PersonalTurno[], vehiculos: vehiculosRes.rows };
  } finally {
    client.release();
  }
}

const ESTADO_CIA: Record<string, { dot: string; text: string; bg: string }> = {
  "EN SERVICIO":       { dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50 border-green-200"  },
  "EN EMERGENCIA":     { dot: "bg-amber-500 animate-pulse", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  "FUERA DE SERVICIO": { dot: "bg-red-600",    text: "text-red-700",    bg: "bg-red-50 border-red-200"      },
};

export default async function CompaniaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { ec, personal, vehiculos } = await getCompaniaData().catch(() => ({
    ec: null, personal: [], vehiculos: [],
  }));

  const tieneMotivo   = (v: Vehiculo) => !!(v.motivo && v.motivo.trim());
  const operativos    = vehiculos.filter(v => v.estado === "EN BASE" && !tieneMotivo(v));
  const enEmergencia  = vehiculos.filter(v => v.estado === "EN EMERGENCIA" && !tieneMotivo(v));
  const conFalla      = vehiculos.filter(v => tieneMotivo(v));

  const estadoStyle = ESTADO_CIA[ec?.estado_general ?? ""] ?? { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50 border-gray-200" };

  const personalBomberos = personal.filter(p => p.tipo === "BOM");
  const personalRentados = personal.filter(p => p.tipo === "REN");

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-700" />
          Mi Compañía
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Cía. B. V. N.° 150 — Puente Piedra</p>
      </div>

      {/* Estado general */}
      <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${estadoStyle.bg}`}>
        <span className={`w-3 h-3 rounded-full shrink-0 ${estadoStyle.dot}`} />
        <div>
          <p className={`font-bold ${estadoStyle.text}`}>{ec?.estado_general ?? "Sin datos"}</p>
          {ec?.primer_jefe && (
            <p className="text-xs text-gray-500 mt-0.5">
              Al mando: {ec.primer_jefe.replace(/^(Sub)?T(nte|te)\s*/i, "").split(",")[0].trim()}
            </p>
          )}
        </div>
        <p className="ml-auto text-xs text-gray-400">
          {ec ? new Date(ec.created_at).toLocaleString("es-PE", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : ""}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{personal.length}</p>
          <p className="text-xs text-gray-400">en turno ahora</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{personalBomberos.length} bomb. · {personalRentados.length} rent.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <Truck className={`w-4 h-4 mx-auto mb-1 ${operativos.length > 0 ? "text-green-500" : "text-gray-300"}`} />
          <p className="text-2xl font-bold text-gray-900">{operativos.length}<span className="text-sm text-gray-400 font-normal">/{vehiculos.length}</span></p>
          <p className="text-xs text-gray-400">unidades operativas</p>
          {conFalla.length > 0 && <p className="text-[10px] text-amber-600 mt-0.5">{conFalla.length} con falla</p>}
        </div>
        <div className={`rounded-xl border px-4 py-3 text-center ${enEmergencia.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <Siren className={`w-4 h-4 mx-auto mb-1 ${enEmergencia.length > 0 ? "text-red-500 animate-pulse" : "text-gray-300"}`} />
          <p className={`text-2xl font-bold ${enEmergencia.length > 0 ? "text-red-700" : "text-gray-900"}`}>{enEmergencia.length}</p>
          <p className="text-xs text-gray-400">{enEmergencia.length > 0 ? "unidades en emergencia" : "sin emergencias"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Personal en turno */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Personal en Turno</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">{personal.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {personal.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sin personal en turno.</p>
            ) : personal.map((p, i) => {
              const nombre = p.apellidos && p.nombres
                ? `${p.apellidos.trim()}, ${p.nombres}`
                : p.nombre_raw.replace(/^(Ren)?tado\s+/i, "").replace(/^(BOM|REN|SubTnte|Sec|Tte|Cap|Brig)\s*/i, "").split("(")[0].trim();
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className={`w-1 h-8 rounded-full shrink-0 ${p.tipo === "REN" ? "bg-amber-400" : "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                      {p.es_al_mando && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded uppercase tracking-wide shrink-0">Mando</span>
                      )}
                      {p.es_piloto && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase tracking-wide shrink-0">Piloto</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.grado && <span className="text-[11px] text-gray-500">{p.grado}</span>}
                      {p.codigo && <span className="text-[11px] text-gray-400 font-mono">{p.codigo}</span>}
                    </div>
                  </div>
                  {p.hora_ingreso && (
                    <span className="text-[11px] text-gray-400 shrink-0">{p.hora_ingreso}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado de flota */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Estado de Flota</h2>
            <span className="ml-auto text-xs text-gray-400">{vehiculos.length} unidades</span>
          </div>
          <div className="divide-y divide-gray-50">
            {vehiculos.map((v, i) => {
              const operativo = v.estado === "EN BASE" && !tieneMotivo(v);
              const enEmerg   = v.estado === "EN EMERGENCIA";
              const falla     = tieneMotivo(v);
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    operativo ? "bg-green-50" : falla ? "bg-amber-50" : enEmerg ? "bg-blue-50" : "bg-red-50"
                  }`}>
                    {operativo  ? <CheckCircle className="w-4 h-4 text-green-600" />
                    : falla     ? <Wrench      className="w-4 h-4 text-amber-500" />
                    : enEmerg   ? <Siren       className="w-4 h-4 text-blue-600 animate-pulse" />
                    :             <XCircle     className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 font-mono">{v.codigo}</p>
                    <p className="text-[11px] text-gray-400">{v.tipo ?? "—"}</p>
                    {v.motivo && <p className="text-[11px] text-amber-600 truncate">{v.motivo}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    operativo ? "bg-green-100 text-green-700 border-green-200"
                    : falla   ? "bg-amber-100 text-amber-700 border-amber-200"
                    : enEmerg ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-red-100 text-red-700 border-red-200"
                  }`}>
                    {operativo ? "OPER." : falla ? "FALLA" : enEmerg ? "EMERG." : "FUERA"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

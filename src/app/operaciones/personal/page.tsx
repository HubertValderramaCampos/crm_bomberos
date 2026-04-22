import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import pool from "@/lib/db";
import { PersonalTable } from "@/components/ui-custom/PersonalTable";

export interface BomberoRow {
  id: number;
  codigo: string;
  grado: string;
  apellidos: string;
  nombres: string;
  estado_actual: string | null;
  // mes más reciente disponible
  mes: number | null;
  anio: number | null;
  dias_asistidos: number | null;
  dias_guardia: number | null;
  horas_acumuladas: number | null;
  num_emergencias: number | null;
  // emergencias como al mando (acumulado 2026)
  veces_al_mando: number;
}

async function getPersonal(filtros: {
  grado: string;
  estado: string;
  busqueda: string;
  mes: number;
  anio: number;
}) {
  const client = await pool.connect();
  try {
    const condiciones: string[] = ["b.activo = true"];
    const params: (string | number)[] = [];
    let p = 1;

    if (filtros.grado) {
      condiciones.push(`b.grado = $${p++}`);
      params.push(filtros.grado);
    }
    if (filtros.estado) {
      condiciones.push(`bea.estado ILIKE $${p++}`);
      params.push(`%${filtros.estado === "en_turno" ? "turno" : filtros.estado}%`);
    }
    if (filtros.busqueda) {
      condiciones.push(`(b.apellidos ILIKE $${p} OR b.nombres ILIKE $${p} OR b.codigo ILIKE $${p})`);
      params.push(`%${filtros.busqueda}%`);
      p++;
    }

    params.push(filtros.mes, filtros.anio);
    const pMes = p++; const pAnio = p++;

    const res = await client.query<BomberoRow>(`
      SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres,
             CASE WHEN bea.estado ILIKE '%turno%' THEN 'en_turno'
                  ELSE NULL END AS estado_actual,
             am.mes, am.anio,
             am.dias_asistidos, am.dias_guardia,
             am.horas_acumuladas, am.num_emergencias,
             COALESCE(em.veces, 0) AS veces_al_mando
      FROM bombero b
      LEFT JOIN bombero_estado_actual bea ON bea.bombero_id = b.id
      LEFT JOIN asistencia_mensual am ON am.bombero_id = b.id
        AND am.mes = $${pMes} AND am.anio = $${pAnio}
      LEFT JOIN (
        SELECT al_mando_id, COUNT(*) AS veces
        FROM emergencia
        WHERE EXTRACT(year FROM COALESCE(fecha_salida, fecha_despacho, created_at)) = $${pAnio}
          AND al_mando_id IS NOT NULL
        GROUP BY al_mando_id
      ) em ON em.al_mando_id = b.id
      WHERE ${condiciones.join(" AND ")}
      ORDER BY am.horas_acumuladas DESC NULLS LAST, b.apellidos
    `, params);

    // KPIs del mes
    const kpi = await client.query<{
      total_bomberos: string;
      en_turno: string;
      total_horas: string;
      total_emergencias: string;
    }>(`
      SELECT
        COUNT(DISTINCT b.id) AS total_bomberos,
        COUNT(DISTINCT bea.bombero_id) FILTER (WHERE bea.estado ILIKE '%turno%') AS en_turno,
        COALESCE(SUM(am.horas_acumuladas), 0) AS total_horas,
        (SELECT COUNT(*) FROM emergencia
         WHERE tipo = 'EMERGENCIA'
           AND EXTRACT(month FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $1
           AND EXTRACT(year  FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $2
        ) AS total_emergencias
      FROM bombero b
      LEFT JOIN bombero_estado_actual bea ON bea.bombero_id = b.id
      LEFT JOIN asistencia_mensual am ON am.bombero_id = b.id
        AND am.mes = $1 AND am.anio = $2
      WHERE b.activo = true
    `, [filtros.mes, filtros.anio]);

    // Meses disponibles
    const mesesRes = await client.query<{ mes: number; anio: number }>(`
      SELECT DISTINCT mes, anio FROM asistencia_mensual
      ORDER BY anio DESC, mes DESC
      LIMIT 12
    `);

    return {
      bomberos: res.rows,
      kpi: kpi.rows[0],
      meses: mesesRes.rows,
    };
  } finally {
    client.release();
  }
}

const MESES_ES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sp = await searchParams;

  // Último mes con datos disponibles por defecto
  const client = await pool.connect();
  const ultimoMes = await client.query<{ mes: number; anio: number }>(
    `SELECT mes, anio FROM asistencia_mensual ORDER BY anio DESC, mes DESC LIMIT 1`
  ).finally(() => client.release());

  const defMes  = ultimoMes.rows[0]?.mes  ?? new Date().getMonth() + 1;
  const defAnio = ultimoMes.rows[0]?.anio ?? new Date().getFullYear();

  const filtros = {
    grado:    sp.grado    || "",
    estado:   sp.estado   || "",
    busqueda: sp.q        || "",
    mes:      Number(sp.mes)  || defMes,
    anio:     Number(sp.anio) || defAnio,
  };

  const { bomberos, kpi, meses } = await getPersonal(filtros).catch(() => ({
    bomberos: [], kpi: null, meses: [],
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-red-700" />
          Bomberos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Actividad y asistencia — {MESES_ES[filtros.mes]} {filtros.anio}
        </p>
      </div>

      {/* KPIs */}
      {kpi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Bomberos activos",    value: kpi.total_bomberos,   sub: "en la compañía" },
            { label: "En turno ahora",      value: kpi.en_turno,         sub: "estado actual" },
            { label: "Horas acumuladas",    value: Number(kpi.total_horas).toLocaleString(), sub: `${MESES_ES[filtros.mes]} ${filtros.anio}` },
            { label: "Emergencias atendidas", value: kpi.total_emergencias, sub: `${MESES_ES[filtros.mes]} ${filtros.anio}` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <PersonalTable
        bomberos={bomberos}
        filtros={filtros}
        meses={meses}
      />
    </div>
  );
}

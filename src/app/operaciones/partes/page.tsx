import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Siren } from "lucide-react";
import pool from "@/lib/db";
import { PartesTable } from "@/components/ui-custom/PartesTable";

export interface Parte {
  id: number;
  numero_parte: string;
  tipo: string;
  tipo_desc: string | null;
  estado: string;
  direccion: string | null;
  distrito: string | null;
  fecha_despacho: string | null;
  fecha_salida: string | null;
  fecha_llegada: string | null;
  fecha_retorno: string | null;
  piloto_nombre: string | null;
  al_mando: string | null;
  al_mando_grado: string | null;
  numero_efectivos: number | null;
  vehiculos: string[];
}

async function getDistritosCategorias() {
  const client = await pool.connect();
  try {
    const [dRes, cRes] = await Promise.all([
      client.query<{ id: number; nombre: string }>(`SELECT id, nombre FROM distrito ORDER BY nombre`),
      client.query<{ cat: string }>(`
        SELECT DISTINCT SPLIT_PART(te.descripcion, ' / ', 1) AS cat
        FROM emergencia e JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        ORDER BY cat
      `),
    ]);
    return { distritos: dRes.rows, categorias: cRes.rows.map(r => r.cat) };
  } finally {
    client.release();
  }
}

async function getPartes(filtros: {
  tipo: string; estado: string; busqueda: string;
  desde: string; hasta: string; distrito: string;
  categoria: string; pagina: number;
}) {
  const client = await pool.connect();
  try {
    const POR_PAGINA = 30;
    const offset = (filtros.pagina - 1) * POR_PAGINA;

    const conds: string[] = [];
    const params: (string | number)[] = [];
    let p = 1;

    if (filtros.tipo)      { conds.push(`e.tipo = $${p++}`);               params.push(filtros.tipo); }
    if (filtros.estado)    { conds.push(`e.estado = $${p++}`);             params.push(filtros.estado); }
    if (filtros.distrito)  { conds.push(`d.nombre ILIKE $${p++}`);         params.push(`%${filtros.distrito}%`); }
    if (filtros.categoria) {
      conds.push(`SPLIT_PART(te.descripcion, ' / ', 1) ILIKE $${p++}`);
      params.push(`%${filtros.categoria}%`);
    }
    if (filtros.busqueda) {
      conds.push(`(e.numero_parte ILIKE $${p} OR e.direccion ILIKE $${p} OR e.piloto_nombre ILIKE $${p} OR b.apellidos ILIKE $${p})`);
      params.push(`%${filtros.busqueda}%`); p++;
    }
    if (filtros.desde) { conds.push(`COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at) >= $${p++}`); params.push(filtros.desde); }
    if (filtros.hasta) { conds.push(`COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at) <= $${p++}`); params.push(filtros.hasta + " 23:59:59"); }

    const where = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";

    const [partesRes, totalRes] = await Promise.all([
      client.query<Omit<Parte, "vehiculos">>(`
        SELECT e.id, e.numero_parte, e.tipo,
               te.descripcion AS tipo_desc,
               e.estado, e.direccion,
               d.nombre AS distrito,
               e.fecha_despacho::text, e.fecha_salida::text,
               e.fecha_llegada::text, e.fecha_retorno::text,
               e.piloto_nombre,
               b.grado || ' ' || b.apellidos || ', ' || b.nombres AS al_mando,
               b.grado AS al_mando_grado,
               e.numero_efectivos
        FROM emergencia e
        LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        LEFT JOIN bombero b ON b.id = e.al_mando_id
        LEFT JOIN distrito d ON d.id = e.distrito_id
        ${where}
        ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) DESC
        LIMIT ${POR_PAGINA} OFFSET ${offset}
      `, params),
      client.query<{ total: string }>(`
        SELECT COUNT(*) AS total FROM emergencia e
        LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        LEFT JOIN bombero b ON b.id = e.al_mando_id
        LEFT JOIN distrito d ON d.id = e.distrito_id
        ${where}
      `, params),
    ]);

    const ids = partesRes.rows.map(r => r.id);
    let vehiculosMap: Record<number, string[]> = {};
    if (ids.length > 0) {
      const vRes = await client.query<{ emergencia_id: number; codigo: string }>(`
        SELECT ev.emergencia_id, v.codigo FROM emergencia_vehiculo ev JOIN vehiculo v ON v.id = ev.vehiculo_id
        WHERE ev.emergencia_id = ANY($1)
        UNION ALL
        SELECT eve.emergencia_id, eve.codigo_vehiculo FROM emergencia_vehiculo_externo eve
        WHERE eve.emergencia_id = ANY($1)
      `, [ids]);
      vehiculosMap = vRes.rows.reduce((acc, r) => {
        if (!acc[r.emergencia_id]) acc[r.emergencia_id] = [];
        acc[r.emergencia_id].push(r.codigo);
        return acc;
      }, {} as Record<number, string[]>);
    }

    return {
      partes: partesRes.rows.map(r => ({ ...r, vehiculos: vehiculosMap[r.id] ?? [] })),
      total: Number(totalRes.rows[0].total),
      porPagina: POR_PAGINA,
    };
  } finally {
    client.release();
  }
}

export default async function PartesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [sp, meta] = await Promise.all([searchParams, getDistritosCategorias()]);

  const filtros = {
    tipo:      sp.tipo      || "",
    estado:    sp.estado    || "",
    busqueda:  sp.q         || "",
    desde:     sp.desde     || "",
    hasta:     sp.hasta     || "",
    distrito:  sp.distrito  || "",
    categoria: sp.categoria || "",
    pagina:    Number(sp.pagina) || 1,
  };

  const { partes, total, porPagina } = await getPartes(filtros).catch(() => ({
    partes: [], total: 0, porPagina: 30,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-700" />
          Partes de Emergencia
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} partes registrados</p>
      </div>

      <PartesTable
        partes={partes}
        total={total}
        pagina={filtros.pagina}
        totalPaginas={Math.ceil(total / porPagina)}
        filtros={filtros}
        distritos={meta.distritos}
        categorias={meta.categorias}
      />
    </div>
  );
}

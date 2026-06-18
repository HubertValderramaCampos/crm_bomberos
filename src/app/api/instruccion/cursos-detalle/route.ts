import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const anio = Number(searchParams.get("anio")) || new Date().getFullYear();

  try {
    // 1. Intentar con capacitaciones finalizadas del año
    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.fecha::text                                                              AS fecha,
        a.tipo,
        a.descripcion                                                              AS tema,
        a.lugar,
        e.nombre                                                                   AS entidad,
        a.hora_inicio::text,
        a.hora_fin::text,
        MAX(b.apellidos || ', ' || b.nombres) FILTER (WHERE pp.es_instructor = true) AS instructor_nombre,
        MAX(b.grado)                           FILTER (WHERE pp.es_instructor = true) AS instructor_grado,
        COUNT(pp.bombero_id)::int                                                  AS total_convocados,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = true)::int                AS asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = false)::int               AS no_asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio IS NULL)::int               AS sin_marcar,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'bombero_id',    pp.bombero_id,
            'apellidos',     b.apellidos,
            'nombres',       b.nombres,
            'grado',         b.grado,
            'asistio',       pp.asistio,
            'es_instructor', pp.es_instructor
          ) ORDER BY b.apellidos
        ) FILTER (WHERE pp.bombero_id IS NOT NULL)                                AS participantes
      FROM programacion_actividad a
      LEFT JOIN entidad e                    ON e.id  = a.entidad_id
      LEFT JOIN programacion_participante pp ON pp.actividad_id = a.id
      LEFT JOIN bombero b                    ON b.id  = pp.bombero_id
      WHERE a.es_capacitacion = true
        AND a.finalizado      = true
        AND EXTRACT(year FROM a.fecha) = $1
      GROUP BY a.id, a.fecha, a.tipo, a.descripcion, a.lugar, e.nombre, a.hora_inicio, a.hora_fin
      ORDER BY a.fecha DESC
    `, [anio]);

    if (rows.length > 0) {
      return NextResponse.json({ data: rows, sintetico: false });
    }

    // 2. Sin data real → generar sintética con bomberos y entidades reales de la BD
    const [bomberosRes, entidadesRes] = await Promise.all([
      pool.query(`
        SELECT id, apellidos, nombres, grado, codigo
        FROM bombero WHERE activo = true ORDER BY apellidos LIMIT 40
      `),
      pool.query(`SELECT id, nombre FROM entidad ORDER BY nombre LIMIT 10`),
    ]);

    const bomberos  = bomberosRes.rows;
    const entidades = entidadesRes.rows;

    if (bomberos.length === 0) {
      return NextResponse.json({ data: [], sintetico: false });
    }

    const TEMAS = [
      { descripcion: "Manejo de equipos de rescate vehicular — Técnicas HHSS",     hora_inicio: "08:00", hora_fin: "12:00" },
      { descripcion: "Primeros auxilios avanzados y RCP con DEA",                   hora_inicio: "09:00", hora_fin: "13:00" },
      { descripcion: "Combate de incendios estructurales — Nivel I",                hora_inicio: "08:00", hora_fin: "17:00" },
      { descripcion: "Uso y mantenimiento de SCBA (equipo autónomo de respiración)",hora_inicio: "14:00", hora_fin: "18:00" },
      { descripcion: "Manejo de materiales peligrosos — HAZMAT básico",             hora_inicio: "08:00", hora_fin: "12:00" },
      { descripcion: "Técnicas de rescate en altura y espacios confinados",         hora_inicio: "09:00", hora_fin: "16:00" },
    ];

    const MESES_CURSO = [1, 2, 3, 4, 5, 6]; // Ene–Jun

    const sinteticos = TEMAS.map((tema, i) => {
      const mes    = MESES_CURSO[i];
      const dia    = 10 + (i % 10);
      const fecha  = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

      // Instructor: rotativo entre los primeros bomberos
      const instructor = bomberos[i % Math.min(bomberos.length, 8)];

      // Entidad: rotativa
      const entidad = entidades.length > 0 ? entidades[i % entidades.length] : null;

      // Participantes: 8–14 bomberos distintos del instructor
      const candidatos = bomberos.filter(b => b.id !== instructor.id);
      const inicio  = (i * 5) % Math.max(1, candidatos.length - 14);
      const n       = 8 + (i % 7);
      const slice   = candidatos.slice(inicio, inicio + n);

      // 70–85% asistencia
      const pctAsistio = 0.70 + (i % 3) * 0.075;
      const participantes = slice.map((b, j) => ({
        bombero_id:    b.id,
        apellidos:     b.apellidos,
        nombres:       b.nombres,
        grado:         b.grado,
        asistio:       j < Math.round(slice.length * pctAsistio),
        es_instructor: false,
      }));

      const asistieron    = participantes.filter(p => p.asistio).length;
      const no_asistieron = participantes.filter(p => !p.asistio).length;

      return {
        id:               -(i + 1),
        fecha,
        tipo:             "CAPACITACION",
        tema:             tema.descripcion,
        lugar:            entidad?.nombre ?? "Sede CIA B-150 — Puente Piedra",
        entidad:          entidad?.nombre ?? null,
        hora_inicio:      tema.hora_inicio,
        hora_fin:         tema.hora_fin,
        instructor_nombre: `${instructor.apellidos}, ${instructor.nombres}`,
        instructor_grado:  instructor.grado,
        total_convocados:  participantes.length,
        asistieron,
        no_asistieron,
        sin_marcar:        0,
        participantes: [
          {
            bombero_id:    instructor.id,
            apellidos:     instructor.apellidos,
            nombres:       instructor.nombres,
            grado:         instructor.grado,
            asistio:       true,
            es_instructor: true,
          },
          ...participantes,
        ],
      };
    });

    return NextResponse.json({ data: sinteticos, sintetico: true });
  } catch (err) {
    console.error("[GET cursos-detalle]", err);
    return NextResponse.json({ error: "Error al cargar cursos" }, { status: 500 });
  }
}

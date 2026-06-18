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
    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.fecha::text                                                        AS fecha,
        a.tipo,
        a.descripcion                                                        AS tema,
        a.lugar,
        e.nombre                                                             AS entidad,
        a.hora_inicio::text,
        a.hora_fin::text,
        -- Instructor (primer participante con es_instructor = true)
        MAX(b.apellidos || ', ' || b.nombres) FILTER (WHERE pp.es_instructor = true)  AS instructor_nombre,
        MAX(b.grado)                           FILTER (WHERE pp.es_instructor = true)  AS instructor_grado,
        -- Conteos
        COUNT(pp.bombero_id)::int                                            AS total_convocados,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = true)::int          AS asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = false)::int         AS no_asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio IS NULL)::int         AS sin_marcar,
        -- Detalle de participantes
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'bombero_id',  pp.bombero_id,
            'apellidos',   b.apellidos,
            'nombres',     b.nombres,
            'grado',       b.grado,
            'asistio',     pp.asistio,
            'es_instructor', pp.es_instructor
          ) ORDER BY b.apellidos
        ) FILTER (WHERE pp.bombero_id IS NOT NULL)                          AS participantes
      FROM programacion_actividad a
      LEFT JOIN entidad e              ON e.id  = a.entidad_id
      LEFT JOIN programacion_participante pp ON pp.actividad_id = a.id
      LEFT JOIN bombero b              ON b.id  = pp.bombero_id
      WHERE a.es_capacitacion = true
        AND a.finalizado      = true
        AND EXTRACT(year FROM a.fecha) = $1
      GROUP BY a.id, a.fecha, a.tipo, a.descripcion, a.lugar, e.nombre,
               a.hora_inicio, a.hora_fin
      ORDER BY a.fecha DESC
    `, [anio]);

    // Si hay data real, devolverla
    if (rows.length > 0) {
      return NextResponse.json({ data: rows, sintetico: false });
    }

    // Sin data real → devolver data sintética con bomberos y empresas reales de la BD
    const [bomberosRes, entidadesRes] = await Promise.all([
      pool.query(`
        SELECT id, apellidos, nombres, grado, codigo
        FROM bombero WHERE activo = true ORDER BY apellidos LIMIT 30
      `),
      pool.query(`SELECT id, nombre FROM entidad LIMIT 10`),
    ]);

    const bomberos  = bomberosRes.rows;
    const entidades = entidadesRes.rows;

    if (bomberos.length === 0) {
      return NextResponse.json({ data: [], sintetico: false });
    }

    // Generar 6 cursos sintéticos
    const TEMAS = [
      { tipo: "CAPACITACION", descripcion: "Manejo de equipos de rescate vehicular — Técnicas HHSS" },
      { tipo: "CAPACITACION", descripcion: "Primeros auxilios avanzados y RCP con DEA" },
      { tipo: "CAPACITACION", descripcion: "Combate de incendios estructurales — Nivel I" },
      { tipo: "CAPACITACION", descripcion: "Uso y mantenimiento de SCBA (equipo autónomo)" },
      { tipo: "CAPACITACION", descripcion: "Manejo de materiales peligrosos — HAZMAT básico" },
      { tipo: "CAPACITACION", descripcion: "Técnicas de rescate en altura y espacios confinados" },
    ];

    const baseDate = new Date(anio, 0, 15);
    const sinteticos = TEMAS.map((tema, i) => {
      const fecha = new Date(baseDate);
      fecha.setMonth(i * 2);

      // Seleccionar instructor (rotativo)
      const instructor = bomberos[i % bomberos.length];

      // Seleccionar 8-12 participantes aleatorios (excluyendo instructor)
      const candidatos = bomberos.filter(b => b.id !== instructor.id);
      const n = 8 + (i % 4);
      const participantes = candidatos.slice(i * 3, i * 3 + n).map((b, j) => ({
        bombero_id:    b.id,
        apellidos:     b.apellidos,
        nombres:       b.nombres,
        grado:         b.grado,
        asistio:       j < Math.floor(n * 0.75) ? true : false, // 75% asistió
        es_instructor: false,
      }));

      const entidad = entidades.length > 0 ? entidades[i % entidades.length] : null;
      const asistieron    = participantes.filter(p => p.asistio).length;
      const no_asistieron = participantes.filter(p => !p.asistio).length;

      return {
        id:               -(i + 1),
        fecha:            fecha.toISOString().slice(0, 10),
        tipo:             tema.tipo,
        tema:             tema.descripcion,
        lugar:            entidad?.nombre ?? "Sede CIA B-150",
        entidad:          entidad?.nombre ?? null,
        hora_inicio:      "08:00:00",
        hora_fin:         "12:00:00",
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

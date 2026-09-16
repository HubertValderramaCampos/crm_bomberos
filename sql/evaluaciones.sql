-- Evaluación de Práctica: control de simulacros/entrenamientos operativos.
-- Todos los usuarios pueden ver; solo Operaciones, Jefes y los editores
-- autorizados individualmente (evaluacion_practica_editor) pueden llenar/editar.

CREATE TABLE IF NOT EXISTS evaluacion_practica (
  id            SERIAL PRIMARY KEY,
  fecha         DATE NOT NULL,
  hora          VARCHAR(10),
  lugar         VARCHAR(200),
  tipo_practica VARCHAR(60) NOT NULL,
  comentarios   TEXT,
  creado_por    INTEGER NOT NULL REFERENCES usuario(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluacion_practica_item (
  id            SERIAL PRIMARY KEY,
  evaluacion_id INTEGER NOT NULL REFERENCES evaluacion_practica(id) ON DELETE CASCADE,
  seccion       VARCHAR(20) NOT NULL,   -- PREVIAS | OPERATIVAS | FINALES
  orden         INTEGER NOT NULL,
  descripcion   VARCHAR(300) NOT NULL,
  respuesta     VARCHAR(2),             -- 'SI' | 'NO' | NULL (sin responder)
  UNIQUE(evaluacion_id, seccion, orden)
);

-- Usuarios autorizados individualmente por el jefe para llenar evaluaciones,
-- además de los roles con acceso por defecto (Jefes + Operaciones).
CREATE TABLE IF NOT EXISTS evaluacion_practica_editor (
  usuario_id   INTEGER PRIMARY KEY REFERENCES usuario(id),
  agregado_por INTEGER REFERENCES usuario(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluacion_practica_fecha     ON evaluacion_practica(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_evaluacion_practica_item_eval ON evaluacion_practica_item(evaluacion_id);

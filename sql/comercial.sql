-- Socios estratégicos
CREATE TABLE IF NOT EXISTS socio_estrategico (
  id              SERIAL PRIMARY KEY,
  empresa         VARCHAR(200) NOT NULL,
  tipo_proceso    VARCHAR(100) NOT NULL,
  contacto        VARCHAR(150),
  telefono        VARCHAR(30),
  correo          VARCHAR(150),
  estado          VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clasificación de socios
CREATE TABLE IF NOT EXISTS clasificacion_socio (
  id              SERIAL PRIMARY KEY,
  socio_id        INTEGER NOT NULL REFERENCES socio_estrategico(id) ON DELETE CASCADE,
  tamano          VARCHAR(50) NOT NULL,
  tipo_apoyo      VARCHAR(100) NOT NULL,
  nivel           VARCHAR(30) NOT NULL DEFAULT 'MEDIO',
  descripcion     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

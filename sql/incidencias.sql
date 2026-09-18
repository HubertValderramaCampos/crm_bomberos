-- Registro de Incidencias / Operaciones B150: reporte de daños o fallas,
-- mantenimiento pendiente (PV/CR) o implementaciones sugeridas sobre
-- vehículos de emergencia, equipo de fuerza o herramientas manuales.
-- Cualquier efectivo puede reportar; Jefes y Operaciones gestionan el estado.

CREATE TABLE IF NOT EXISTS reporte_operativo (
  id           SERIAL PRIMARY KEY,
  fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
  bombero_id   INTEGER NOT NULL REFERENCES bombero(id),
  tipo_reporte VARCHAR(20) NOT NULL,   -- DANIO_FALLA | MANTENIMIENTO | IMPLEMENTACION
  categoria    VARCHAR(20) NOT NULL,   -- VEHICULO | EQUIPO_FUERZA | HERRAMIENTAS
  vehiculo_id  INTEGER REFERENCES vehiculo(id),
  descripcion  TEXT NOT NULL,
  estado       VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE | EN_PROCESO | RESUELTO
  creado_por   INTEGER NOT NULL REFERENCES usuario(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reporte_operativo_foto (
  id         SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reporte_operativo(id) ON DELETE CASCADE,
  foto_key   TEXT NOT NULL,
  orden      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reporte_operativo_fecha  ON reporte_operativo(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_reporte_operativo_estado ON reporte_operativo(estado);
CREATE INDEX IF NOT EXISTS idx_reporte_operativo_foto   ON reporte_operativo_foto(reporte_id);

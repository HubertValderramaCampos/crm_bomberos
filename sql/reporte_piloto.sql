-- Reporte Diario de Pilotos / Operaciones B150: inspección diaria que realiza
-- el piloto de turno sobre la unidad asignada (kilometraje, niveles de
-- fluidos y estado físico general). Registro de solo lectura para consulta;
-- no maneja flujo de estados.

CREATE TABLE IF NOT EXISTS reporte_piloto (
  id                     SERIAL PRIMARY KEY,
  fecha                  DATE NOT NULL DEFAULT CURRENT_DATE,
  vehiculo_id            INTEGER NOT NULL REFERENCES vehiculo(id),
  bombero_id             INTEGER NOT NULL REFERENCES bombero(id), -- piloto de turno
  kilometraje            INTEGER NOT NULL,
  combustible            VARCHAR(15) NOT NULL, -- FULL | TRES_CUARTOS | MEDIO | UN_CUARTO
  aceite                 VARCHAR(10) NOT NULL, -- FULL | MINIMO
  refrigerante           VARCHAR(10) NOT NULL, -- FULL | MINIMO
  estado_neumaticos      TEXT NOT NULL,
  estado_carroceria      TEXT,
  estado_suspension      TEXT,
  estado_espejos_vidrios TEXT,
  estado_cabina          TEXT,
  creado_por             INTEGER NOT NULL REFERENCES usuario(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reporte_piloto_foto (
  id         SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reporte_piloto(id) ON DELETE CASCADE,
  foto_key   TEXT NOT NULL,
  orden      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reporte_piloto_vehiculo_fecha ON reporte_piloto(vehiculo_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_reporte_piloto_foto           ON reporte_piloto_foto(reporte_id);

-- Cuentas PILOTO (sin ficha de bombero) registran su propio reporte: en ese caso
-- bombero_id queda NULL y el piloto de turno es la cuenta de creado_por.
ALTER TABLE reporte_piloto ALTER COLUMN bombero_id DROP NOT NULL;

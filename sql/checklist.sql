-- Checklist de unidades (equipo por vehículo)

CREATE TABLE IF NOT EXISTS checklist_item (
  id          SERIAL PRIMARY KEY,
  vehiculo_id INTEGER NOT NULL REFERENCES vehiculo(id),
  seccion     VARCHAR(150) NOT NULL,
  orden       INTEGER NOT NULL,
  articulo    VARCHAR(300) NOT NULL,
  cantidad    INTEGER,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_registro (
  id                SERIAL PRIMARY KEY,
  vehiculo_id       INTEGER NOT NULL REFERENCES vehiculo(id),
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  bombero_id        INTEGER NOT NULL REFERENCES bombero(id),
  efectivo_al_mando VARCHAR(150),
  estado            VARCHAR(20) NOT NULL DEFAULT 'EN_PROGRESO',
  observaciones     TEXT,
  completado_en     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_registro_item (
  id          SERIAL PRIMARY KEY,
  registro_id INTEGER NOT NULL REFERENCES checklist_registro(id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES checklist_item(id),
  estado      VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
  observacion TEXT,
  UNIQUE(registro_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_item_vehiculo     ON checklist_item(vehiculo_id, orden);
CREATE INDEX IF NOT EXISTS idx_checklist_registro_vehiculo ON checklist_registro(vehiculo_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_registro_item_reg ON checklist_registro_item(registro_id);

ALTER TABLE checklist_registro_item ADD COLUMN IF NOT EXISTS foto_key TEXT;

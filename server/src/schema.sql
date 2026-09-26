-- Go-din: esquema de base de datos (MVP)
-- La BD se crea con: createdb godin (o CREATE DATABASE godin;)

CREATE TABLE IF NOT EXISTS partidas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT 'Partida sin nombre',
  estado JSONB NOT NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partidas_actualizada ON partidas (actualizada_en DESC);

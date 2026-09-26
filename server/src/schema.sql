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

-- Configuraciones del juego (balance ajustable sin tocar código)
CREATE TABLE IF NOT EXISTS configuraciones (
  id SERIAL PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general',
  descripcion TEXT,
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defaults de dinero (tipo 'dinero')
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
  ('dinero.ahorro_inicial', '10000', 'dinero', 'Ahorros fijos con los que el personaje inicia el mes'),
  ('dinero.transporte', '{"a_pie": 0, "camion": 60, "auto": 100}', 'dinero', 'Costo diario de transporte ida y regreso por tipo'),
  ('dinero.comida', '{"opciones": [{"nombre": "torta", "precio": 50}, {"nombre": "comida corrida", "precio": 100}, {"nombre": "restaurante", "precio": 150}]}', 'dinero', 'Menú de comida y sus precios'),
  ('dinero.bebida', '{"opciones": [{"nombre": "agua", "precio": 15}, {"nombre": "refresco", "precio": 25}, {"nombre": "cafe", "precio": 40}]}', 'dinero', 'Bebidas y sus precios'),
  ('dinero.ropa', '{"oficina": 500, "comoda": 300}', 'dinero', 'Precio de ropa de oficina y ropa cómoda'),
  ('dinero.actividades', '{"tv": 0, "salir": 100}', 'dinero', 'Costo de actividades de tiempo libre'),
  ('dinero.eventos', '{"accidente": 200, "multa": 150, "enfermedad": 300}', 'dinero', 'Costos de eventos aleatorios')
ON CONFLICT (clave) DO NOTHING;

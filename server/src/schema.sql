-- Go-din: database schema (MVP)
-- The database is created with: createdb godin (or CREATE DATABASE godin;)

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Unnamed game',
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_updated ON games (updated_at DESC);

-- Game configurations (adjustable balance without touching code)
CREATE TABLE IF NOT EXISTS configurations (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Money defaults (type 'money')
INSERT INTO configurations (key, value, type, description) VALUES
  ('money.initial_savings', '10000', 'money', 'Fixed savings the character starts the month with'),
  ('money.transport', '{"on_foot": 0, "bus": 60, "car": 100}', 'money', 'Daily round-trip transport cost by type'),
  ('money.food', '{"options": [{"name": "torta", "price": 50}, {"name": "comida corrida", "price": 100}, {"name": "restaurante", "price": 150}]}', 'money', 'Food menu and prices'),
  ('money.drinks', '{"options": [{"name": "agua", "price": 15}, {"name": "refresco", "price": 25}, {"name": "cafe", "price": 40}]}', 'money', 'Drinks and prices'),
  ('money.clothes', '{"office": 500, "comfortable": 300}', 'money', 'Office and comfortable clothing prices'),
  ('money.activities', '{"tv": 0, "going_out": 100}', 'money', 'Free-time activity costs'),
  ('money.events', '{"accident": 200, "fine": 150, "illness": 300}', 'money', 'Random event costs')
ON CONFLICT (key) DO NOTHING;

-- Fatigue defaults (type 'fatigue')
INSERT INTO configurations (key, value, type, description) VALUES
  ('fatigue.daily_cost', '10', 'fatigue', 'Fixed daily fatigue cost'),
  ('fatigue.thresholds', '{"normal": 40, "tired": 60, "critical": 80, "collapse": 100}', 'fatigue', 'Fatigue thresholds that trigger decisions'),
  ('fatigue.costs', '{"work_activity": 2, "wake_up_late": 5, "transport_problems": 5, "not_eating": 8, "multimedia": 3, "lost_sleep_hour": 2, "weekend_work": 15}', 'fatigue', 'Fatigue costs by source'),
  ('fatigue.recoveries', '{"full_sleep": 25, "partial_sleep_per_hour": 3, "food": 10, "drink": 5, "comfortable_clothes": 5}', 'fatigue', 'Fatigue recovery by source')
ON CONFLICT (key) DO NOTHING;

-- Time defaults (type 'time')
INSERT INTO configurations (key, value, type, description) VALUES
  ('time.project_days', '30', 'time', 'Days of the project (the month)'),
  ('time.phases', '{"wake_up": {"gameHours": 1, "realSeconds": 0}, "transport_to_work": {"gameHours": 2, "realSeconds": 0}, "office_entry": {"gameHours": 0.5, "realSeconds": 0}, "work": {"gameHours": 8, "realSeconds": 300}, "office_exit": {"gameHours": 0.5, "realSeconds": 0}, "transport_home": {"gameHours": 2, "realSeconds": 0}, "free_time": {"gameHours": 2, "realSeconds": 0}, "sleep": {"gameHours": 8, "realSeconds": 0}}', 'time', 'Game hours and real seconds per phase'),
  ('time.lost_sleep_fatigue_per_hour', '2', 'time', 'Fatigue cost per lost sleep hour')
ON CONFLICT (key) DO NOTHING;

-- Project defaults (type 'project')
INSERT INTO configurations (key, value, type, description) VALUES
  ('project.progress_per_minigame', '1.6666666666666667', 'project', 'Project progress gained per completed minigame'),
  ('project.minigames_per_day', '2', 'project', 'Minigames completed per work session')
ON CONFLICT (key) DO NOTHING;

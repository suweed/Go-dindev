# GO-DIN — Plan del Proyecto (MVP)

> Documento vivo: se refina conforme avanzamos. Fuente de referencia: `Go-din_MVP.txt`.

## 1. Visión

Juego de oficinista ("godín") en 3D con **React Three Fiber**: click-and-point con cámara cenital y efecto tilt-shift, jugable en mobile y desktop. El jugador vive **30 días de trabajo** (una sesión ≈ 25 min reales, configurable) gestionando **tiempo**, **cansancio** y **dinero** para completar un proyecto asignado aleatoriamente.

Finales posibles:
- **Completar el proyecto** (victoria, happy path)
- **Ser despedido** (llegar al día 30 sin terminar el proyecto)
- **Muerte por cansancio** (llenar la barra): se vuelve loco / muere y va a un isekai / se va a una montaña de ermitaño

## 2. Pilares de diseño

1. **Tiempo como recurso** — cada día de juego son 24 h divididas en fases fijas; el tiempo real es configurable por fase.
2. **Cansancio como presión** — gasto fijo diario + costos por actividad; umbrales que disparan pantallas de decisión; al llenarse, final.
3. **Dinero como limitante** — transporte, comida, ropa e ítems cuestan; se puede quedar sin dinero.
4. **Decisiones con consecuencias** — cada fase tiene eventos aleatorios que cuestan tiempo/cansancio/dinero extra.
5. **Progresión por proyecto** — las actividades de trabajo (minijuegos) acumulan % del proyecto; 100% = victoria.

## 3. Alcance MVP

### 3.1 Mecánicas core
- Ciclo diario completo: despertar → transporte ida → entrada a oficina → trabajo → comida → salida → transporte regreso → tiempo libre → dormir
- Motor de tiempo (fases, horas extra, descuentos en orden: tiempo libre → sueño → nuevo día)
- Motor de cansancio (gasto fijo diario, costos, recuperaciones, umbrales, final por colapso)
- Motor de dinero (gastos fijos, compras de comida/bebida/ropa)
- Proyectos aleatorios con % de avance (los minijuegos de trabajo acumulan %)
- Eventos aleatorios por fase (despertar, transporte, trabajo, comida, salida, noche)
- Tutorial en la habitación (noche previa al día 1; puede afectar el primer día)
- Guardar/cargar partida (persistencia en PostgreSQL)

### 3.2 Ubicaciones (MVP)
- **Habitación**: cama, escritorio, televisión, ropero, minibar
- **Pasillo de entrada del edificio** (interacciones antes de la oficina)
- **Oficina**: zona común, sala de juntas
- Fase 2: baño, sótano (cuarto de conexiones, estacionamiento del jefe, cuarto de conserje, calderas), estacionamiento del edificio

### 3.3 Personaje
- Atributos: cansancio, dinero
- Afectaciones: accidentes, quedarse sin dinero, enfermedades, despido
- Customización sencilla (a definir): sexo, peinado, ropa de oficina

## 4. Fases de desarrollo

| Fase | Entregable |
|---|---|
| **0. Fundación** | Proyecto Vite + React + TS + R3F; motores de tiempo/cansancio/dinero como lógica pura con tests; máquina de estados del día; config de balance centralizada |
| **1. Habitación y tutorial** | Escena 3D de la habitación, personaje con click-to-move, tutorial completo (minibar → ropero → cama) |
| **2. Flujo diario** | Todas las pantallas del ciclo diario con eventos aleatorios y decisiones |
| **3. Trabajo y proyectos** | Minijuegos de trabajo, % de avance del proyecto, proyectos aleatorios |
| **4. Ubicaciones secundarias** | Pasillo completo, baño, sótano, oficina completa |
| **5. Finales y pulido** | Finales (victoria, despido, colapso), settings, persistencia, tilt-shift, mobile |

## 5. Arquitectura

- **React Three Fiber** — escena 3D (cámara cenital, tilt-shift)
- **Zustand** — estado global (día, fase, tiempo, cansancio, dinero, inventario, proyecto)
- **Lógica pura** — motores de tiempo/cansancio/dinero como módulos TS sin dependencias de React (testables)
- **Máquina de estados** — flujo diario (fases y transiciones)
- **Config de balance** — un solo archivo con todos los números ajustables
- **Backend (Node + Express)** — API REST para guardar/cargar partidas
- **Persistencia** — PostgreSQL (guardar/cargar partida); el frontend se comunica con la API

### Estructura de carpetas (propuesta)

```
god-in/
├─ PLAN.md
├─ docs/
│  └─ motor-tiempo-cansancio.md
├─ server/            # backend: API REST + acceso a PostgreSQL
│  ├─ src/
│  │  ├─ db.ts        # conexión PostgreSQL (pg)
│  │  ├─ routes/      # partidas (guardar, cargar, listar)
│  │  └─ schema.sql   # tablas (partidas, estado del juego)
│  └─ package.json
├─ src/
│  ├─ game/            # lógica pura (motores, máquina de estados, eventos)
│  │  ├─ time/
│  │  ├─ fatigue/
│  │  ├─ money/
│  │  ├─ project/
│  │  └─ events/
│  ├─ state/           # stores de Zustand
│  ├─ scenes/          # escenas R3F (habitación, pasillo, oficina)
│  ├─ ui/              # HUD, pantallas de decisión, menús
│  ├─ api/             # cliente HTTP hacia el backend
│  └─ config/          # balance.ts
└─ ...
```

### PostgreSQL (MVP)

- **Tabla `partidas`**: id, nombre, fecha de creación/actualización, estado serializado (JSONB) o columnas explícitas (día, fase, tiempo, cansancio, dinero, inventario, proyecto, eventos).
- **API**: `POST /partidas`, `GET /partidas`, `GET /partidas/:id`, `PUT /partidas/:id` (guardar), `DELETE /partidas/:id`.
- **Entorno local**: PostgreSQL en WSL o Docker Compose (`docker-compose.yml` con `postgres:16`); credenciales vía variables de entorno (`.env`).
- El guardado puede ser automático (al final de cada día) y manual (menú de pausa).

## 6. Decisiones abiertas (para refinar juntos)

- Números exactos de balance (tiempos reales por fase, costos de cansancio/dinero) — ver `docs/motor-tiempo-cansancio.md`
- Minijuegos de trabajo concretos (qué actividades acumulan % de proyecto)
- Lista de eventos aleatorios por fase
- Sistema de transporte (a pie / auto / otros) y sus costos
- Customización del personaje
- Variante del final por cansancio: aleatoria o según decisiones previas

# GO-DIN — Plan del Proyecto (MVP)

> Documento vivo: se refina conforme avanzamos. Fuente de referencia: `Go-din_MVP.txt`.

## 1. Visión

Juego de oficinista ("godín") en 3D con **React Three Fiber**: click-and-point con cámara isométrica y efecto tilt-shift, jugable en mobile y desktop.

**Historia (lore):** el personaje fue despedido de su trabajo anterior y, buscando otro antes de terminar sus ahorros, logra encontrar este nuevo empleo justo a tiempo. Solo tiene **$10,000** para administrar y llegar a fin de mes (los 30 días del proyecto). El dinero es fijo al inicio y va disminuyendo; hay que administrarlo para no terminarlo antes del mes (comida, ropa, ítems, transporte). El objetivo del juego es **terminar el proyecto sin quedarse sin dinero ni morir de cansancio**. El dinero puede aumentar con bonos (por resolver actividades rápido o descubrir secretos; se definen después). El MVP cubre el flujo principal de la historia; los finales se establecen después (habrá varios). A futuro (no en esta versión): al terminar el mes se cobra el salario y se pagan renta y gastos de la casa.

Finales posibles (a detallar):
- **Final principal**: completar el proyecto sin quedarse sin dinero ni morir de cansancio (victoria)
- **Ser despedido** (llegar al día 30 sin terminar el proyecto)
- **Muerte por cansancio** (llenar la barra): se vuelve loco / muere y va a un isekai / se va a una montaña de ermitaño
- **Quedarse sin dinero** antes del mes (no puede pagar transporte → no va al trabajo → no avanza el proyecto)

## 2. Pilares de diseño

1. **Tiempo como recurso** — cada día de juego son 24 h divididas en fases fijas; el tiempo real es configurable por fase.
2. **Cansancio como presión** — gasto fijo diario + costos por actividad; umbrales que disparan pantallas de decisión; al llenarse, final.
3. **Dinero como limitante** — ahorros fijos de $10,000 para sobrevivir el mes; transporte, comida, ropa e ítems cuestan; si se acaba antes del mes, no se puede ir al trabajo.
4. **Decisiones con consecuencias** — cada fase tiene eventos aleatorios que cuestan tiempo/cansancio/dinero extra.
5. **Progresión por proyecto** — las actividades de trabajo (minijuegos) acumulan % del proyecto; 100% = victoria.

## 3. Alcance MVP

### 3.1 Mecánicas core
- Ciclo diario completo: despertar → transporte ida → entrada a oficina → trabajo → comida → salida → transporte regreso → tiempo libre → dormir
- Motor de tiempo (fases, horas extra, descuentos en orden: tiempo libre → sueño → nuevo día)
- Motor de cansancio (gasto fijo diario, costos, recuperaciones, umbrales, final por colapso)
- Motor de dinero (ahorros fijos $10,000, gastos diarios, bonos; configurable desde la BD)
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
- Atributos: cansancio, dinero (ahorros: $10,000 al inicio)
- Afectaciones: accidentes, quedarse sin dinero, enfermedades, despido
- Customización sencilla (a definir): sexo, peinado, ropa de oficina

## 4. Fases de desarrollo

| Fase | Entregable | Estado |
|---|---|---|
| **0. Fundación** | Proyecto Vite + React + TS + R3F; motores de tiempo/cansancio/dinero como lógica pura con tests; máquina de estados del día; config de balance centralizada | ✅ Base del proyecto lista (client + server + BD). Motores en curso |
| **1. Habitación y tutorial** | Escena 3D de la habitación, personaje con click-to-move, tutorial completo (minibar → ropero → cama) | ⏳ Pendiente |
| **2. Flujo diario** | Todas las pantallas del ciclo diario con eventos aleatorios y decisiones | ⏳ Pendiente |
| **3. Trabajo y proyectos** | Minijuegos de trabajo, % de avance del proyecto, proyectos aleatorios | ⏳ Pendiente |
| **4. Ubicaciones secundarias** | Pasillo completo, baño, sótano, oficina completa | ⏳ Pendiente |
| **5. Finales y pulido** | Finales (victoria, despido, colapso), settings, persistencia, tilt-shift, mobile | ⏳ Pendiente |

## 4.1 Estado actual (progreso)

- ✅ Base del proyecto: `client/` (Vite + React + TS + R3F, hello world 3D isométrico) y `server/` (Express + pg, `/health` con BD conectada)
- ✅ BD PostgreSQL `godin` creada en WSL con tablas `partidas` y `configuraciones` (defaults de dinero insertados)
- ✅ **Motor de dinero** implementado (`client/src/game/money/`) con 8 tests pasando
- 🔄 **En curso: motor de cansancio** (lógica pura + tests)
- ⏳ Pendiente: motor de tiempo, máquina de estados del día, config de balance centralizada

## 5. Arquitectura

- **React Three Fiber** — escena 3D (cámara isométrica, tilt-shift)
- **Zustand** — estado global (día, fase, tiempo, cansancio, dinero, inventario, proyecto)
- **Lógica pura** — motores de tiempo/cansancio/dinero como módulos TS sin dependencias de React (testables)
- **Máquina de estados** — flujo diario (fases y transiciones)
- **Config de balance** — un solo archivo con todos los números ajustables
- **Backend (Node + Express)** — API REST para guardar/cargar partidas
- **Persistencia** — PostgreSQL (guardar/cargar partida); el frontend se comunica con la API

### Estructura de carpetas (real)

```
god-in/
├─ docs/
│  ├─ PLAN.md
│  ├─ motor-tiempo-cansancio.md
│  └─ motor-dinero.md
├─ client/           # frontend: Vite + React + TS + React Three Fiber
│  ├─ src/
│  │  ├─ game/       # lógica pura (motores, máquina de estados, eventos) — fase 1
│  │  ├─ state/      # stores de Zustand — fase 1
│  │  ├─ scenes/     # escenas R3F (habitación, pasillo, oficina)
│  │  ├─ ui/         # HUD, pantallas de decisión, menús
│  │  ├─ api/        # cliente HTTP hacia el backend
│  │  └─ config/     # balance.ts
│  └─ package.json
├─ server/           # backend: API REST + acceso a PostgreSQL
│  ├─ src/
│  │  ├─ db.ts       # conexión PostgreSQL (pg)
│  │  ├─ index.ts    # Express + /health
│  │  └─ schema.sql  # tablas (partidas)
│  └─ package.json
└─ ...
```

### PostgreSQL (MVP)

- **Tabla `partidas`**: id, nombre, fecha de creación/actualización, estado serializado (JSONB) o columnas explícitas (día, fase, tiempo, cansancio, dinero, inventario, proyecto, eventos).
- **Tabla `configuraciones`**: balance del juego ajustable sin tocar código (clave, valor JSONB, tipo). Empezamos con `tipo='dinero'`: ahorro inicial, transporte, comida, bebida, ropa, actividades, eventos. Después se agregan `cansancio`, `tiempo`, etc.
- **API**: `POST /partidas`, `GET /partidas`, `GET /partidas/:id`, `PUT /partidas/:id` (guardar), `DELETE /partidas/:id`. (Configuraciones: lectura vía API en fase futura.)
- **Entorno local**: PostgreSQL 16 nativo en WSL (credenciales vía variables de entorno en `server/.env`).
- El guardado puede ser automático (al final de cada día) y manual (menú de pausa).

## 6. Decisiones abiertas (para refinar juntos)

- Números exactos de balance (tiempos reales por fase, costos de cansancio/dinero) — ver `docs/motor-tiempo-cansancio.md`
- Minijuegos de trabajo concretos (qué actividades acumulan % de proyecto)
- Lista de eventos aleatorios por fase
- Sistema de transporte (a pie / auto / otros) y sus costos
- Customización del personaje
- Variante del final por cansancio: aleatoria o según decisiones previas

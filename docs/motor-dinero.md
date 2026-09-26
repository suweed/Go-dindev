# Motor de Dinero — Especificación

> Documento vivo. Define qué necesitamos decidir y qué se implementará. Los números vienen de la **tabla `configuraciones`** de PostgreSQL (tipo `dinero`), no del código.

## 1. Objetivo

Modelar el **dinero** del personaje como recurso limitante según el lore: **ahorros fijos de $10,000** (configurable) que deben durar todo el mes (los 30 días del proyecto). El dinero va disminuyendo con los gastos diarios (transporte, comida, bebida, ropa, ítems) y solo aumenta con **bonos** (a definir).

**El objetivo del juego es terminar el proyecto sin quedarse sin dinero ni morir de cansancio.** No hay salario ni renta en esta versión (a futuro, no incluidos).

El motor es **lógica pura** (TypeScript sin React) para poder testearlo.

## 2. Modelo del dinero (según el lore)

```
Inicio del mes (día 1)
  └─ Ahorros: $10,000 (configurable en BD: dinero.ahorro_inicial)

Cada día (día 1..30)
  └─ Gastos: transporte + comida + bebida + (opcional) ropa/ítems/actividades
  └─ Ingresos: bonos (a definir después)

Fin del juego
  └─ Proyecto completado + dinero > 0 + cansancio < 100 → FINAL PRINCIPAL (victoria)
  └─ Dinero en 0 antes del mes → no puede pagar transporte → no va al trabajo → final malo
```

**Regla central:** el dinero es un **fondo que se agota**. Si llega a $0 antes del mes, no se puede pagar el transporte → no se va al trabajo → no se avanza el proyecto → final malo.

## 3. Configuraciones en la BD (tabla `configuraciones`)

La tabla guarda el balance del juego sin tocar código:

```sql
CREATE TABLE configuraciones (
  id SERIAL PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'general',
  descripcion TEXT,
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Defaults de dinero ya insertados (tipo `dinero`)

| clave | valor | descripción |
|---|---|---|
| `dinero.ahorro_inicial` | `10000` | Ahorros fijos con los que inicia el mes |
| `dinero.transporte` | `{"a_pie": 0, "camion": 60, "auto": 100}` | Costo diario de transporte ida y regreso por tipo |
| `dinero.comida` | `{"opciones": [{"nombre": "torta", "precio": 50}, {"nombre": "comida corrida", "precio": 100}, {"nombre": "restaurante", "precio": 150}]}` | Menú de comida y precios |
| `dinero.bebida` | `{"opciones": [{"nombre": "agua", "precio": 15}, {"nombre": "refresco", "precio": 25}, {"nombre": "cafe", "precio": 40}]}` | Bebidas y precios |
| `dinero.ropa` | `{"oficina": 500, "comoda": 300}` | Precio de ropa de oficina y cómoda |
| `dinero.actividades` | `{"tv": 0, "salir": 100}` | Costo de actividades de tiempo libre |
| `dinero.eventos` | `{"accidente": 200, "multa": 150, "enfermedad": 300}` | Costos de eventos aleatorios |

**Cómo se usan:** el motor recibe la config por inyección (cargada desde la BD al iniciar la partida). Cambiar un valor en la BD cambia el balance sin recompilar.

## 4. Estado y límites

```ts
interface EstadoDinero {
  valor: number;              // dinero actual (ahorros), nunca negativo
  ahorrosIniciales: number;   // de config (default 10000)
  historial: Transaccion[];   // registro de ingresos/gastos (para resumen de día)
}

interface Transaccion {
  fuente: string;   // 'transporte' | 'comida' | 'bono' | ...
  monto: number;    // positivo = ingreso, negativo = gasto
  dia: number;
}
```

**Reglas:**
- El dinero **nunca es negativo**: si no alcanza, la compra/acción se bloquea.
- Si el dinero llega a 0 y no se puede pagar el transporte → no se puede ir al trabajo → día perdido → riesgo de despido (afectación "quedarse sin dinero").
- Los bonos son la única forma de aumentar el dinero durante el mes (a definir).

## 5. Qué se hará (implementación)

### 5.1 Estructura

```
client/src/game/money/
├─ types.ts        # EstadoDinero, Transaccion, Resultado
├─ money.ts        # motor: funciones puras
├─ balance.ts      # tipos de la config de dinero (cargada desde la BD)
└─ money.test.ts   # tests
```

### 5.2 API del motor

```ts
puedePagar(estado, monto): boolean;
aplicarIngreso(estado, fuente, monto): Resultado;   // suma + registra (bonos)
aplicarGasto(estado, fuente, monto): Resultado;     // resta + registra; falla si no alcanza
pagarTransporte(estado, tipoTransporte, config): Resultado; // descuenta según tipo
comprarItem(estado, item, config): Resultado;       // valida saldo y descuenta
```

### 5.3 Tests (invariantes)

- El dinero nunca queda negativo.
- Un gasto mayor al saldo falla (se bloquea la compra).
- Quedarse sin dinero para el transporte → no se puede ir al trabajo (afectación).
- El transporte descuenta según el tipo (a pie $0, camión $60, auto $100).
- Los bonos aumentan el dinero y se registran en el historial.
- El historial registra cada transacción con su día.
- El ahorro inicial se lee de la config (BD), no está hardcodeado.

## 6. Decisiones abiertas (con defaults)

1. **Ahorro inicial**: $10,000 (default, configurable en BD).
2. **Costos de transporte**: a pie $0 / camión $60 / auto $100 (default, en BD).
3. **Menú de comida**: opciones y precios (default en BD).
4. **Eventos con costo**: accidente, multa, enfermedad — montos y probabilidades (default en BD).
5. **Bonos**: montos y condiciones (fase futura).

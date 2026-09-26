# Motor de Tiempo y Cansancio — Especificación

> Documento vivo. Los tiempos del `Go-din_MVP.txt` son ejemplos de la idea; aquí se formalizan en un modelo configurable. Todos los números son **defaults propuestos** y se ajustan desde `src/config/balance.ts` sin tocar código.

## 1. Objetivo

Modelar el **tiempo de juego** (días, horas, fases) y el **cansancio** del personaje como recursos con costos, recuperaciones, umbrales y consecuencias. El motor es **lógica pura** (TypeScript sin React) para poder testearlo.

---

## 2. Tiempo

### 2.1 Principio fundamental: el tiempo real de las pantallas NO existe

El jugador puede tardar lo que quiera pensando una decisión: **el tiempo real de las pantallas y decisiones no cuenta**. Lo que cuenta es el **tiempo de juego**, que se consume por fases:

- Cada fase del día tiene un **costo fijo en horas de juego** (despertar 2 h, transporte 2 h, etc.).
- Las decisiones y eventos aleatorios pueden **añadir horas extra de juego** y/o cansancio.
- El **único tiempo real que importa** es el de los **minijuegos de trabajo**: 2 minijuegos de 2.5 min = 5 min reales = 8 h de juego.

### 2.2 Estructura del día

Un día de juego = **24 horas de juego**, divididas en fases fijas. La suma de `horasJuego` siempre da 24 h; las horas extra se suman aparte.

| Fase | Horas de juego | Tiempo real | Notas |
|---|---|---|---|
| Despertar | 2 h | 0 (solo animación + decisión) | decisión: ir al trabajo o quedarse en casa |
| Transporte ida | 2 h | 0 | pantalla aleatoria; puede sumar tiempo extra |
| Entrada a oficina (pasillo) | 0.5 h | 0 | eventos del pasillo pueden sumar tiempo |
| Trabajo | 8 h | **5 min** (2 minijuegos × 2.5 min) | único tiempo real del día |
| Salida de oficina | 0.5 h | 0 | pasillo de salida |
| Transporte regreso | 2 h | 0 | pantalla aleatoria; puede sumar tiempo extra |
| Tiempo libre | 3 h | 0 | el jugador lo termina cuando quiera |
| Dormir | 8 h | 0 | resumen de noche; recupera cansancio |
| **Total** | **24 h** | **5 min** | 30 días ≈ 2.5 h reales de minijuegos |

**Ejemplo del flujo (del documento):** al iniciar el día se muestra la animación de despertar y la decisión (continuar al trabajo / quedarse en casa). Si continúa, se activa la pantalla de transporte; según el evento puede haber tiempo extra. Al llegar a la puerta del edificio ya pasaron 2 h (despertar) + 2 h (transporte) = **4 h del día**. En el pasillo puede aumentar el tiempo; al llegar a la oficina se suma el tiempo fijo de entrada (0.5 h) más el extra si hubo. Empiezan las 8 h de trabajo con los 2 minijuegos. Al terminar, si no hay horas extra, se hace el trayecto de salida, el transporte de regreso y la llegada a casa. El tiempo libre lo termina el jugador cuando quiera, y al dormir se cierra el día.

### 2.3 Modelo

```ts
type FaseId =
  | 'despertar' | 'transporteIda' | 'entrada' | 'trabajo'
  | 'salida' | 'transporteRegreso' | 'tiempoLibre' | 'dormir';

interface Fase {
  id: FaseId;
  horasJuego: number;      // costo fijo en horas de juego
  tiempoRealSeg: number;   // 0 en todas las fases EXCEPTO trabajo (minijuegos)
}

interface EstadoTiempo {
  dia: number;                    // 1..30
  fase: FaseId;
  horaJuego: number;              // hora dentro del día (0-24)
  horasExtraPendientes: number;   // horas extra acumuladas por eventos/decisiones
  horasConsumidasDia: number;     // total del día: default (24) + extras
}
```

### 2.4 Horas extra (regla de descuentos)

Cuando un evento o decisión consume más tiempo del previsto (despertar tarde, tráfico, extender comida, seguir trabajando, multimedia), se aplica la regla del documento **en este orden**:

1. Se descuenta primero del **tiempo libre** (3 h).
2. Lo que no alcance, se descuenta del **sueño** (8 h).
3. Si el sueño llega a 0 → el día termina de inmediato, inicia el siguiente día y se aplica penalización de cansancio (+2 por hora de sueño perdida, configurable).

Regla de oro: el tiempo extra **nunca rompe el día**; siempre se absorbe en el orden libre → sueño → nuevo día.

**El calendario de 30 días es FIJO.** Las horas extra no acortan el presupuesto del proyecto: se absorben dentro del día (libre → sueño). Lo que sí cambia es el **cansancio**: cada hora de sueño perdida aumenta el cansancio, y si no se regula, se llega al **final por cansancio** antes de los 30 días.

### 2.5 Cierre del día

Al dormir se cierra el día y al iniciar el nuevo día se descuenta el anterior:

1. Se suma el **total de horas del día** (24 h default + horas extra consumidas entre el tiempo libre y el sueño).
2. El día se **descuenta del calendario del proyecto** (30 días fijos): día 1 → día 2, etc.
3. El **cansancio del día se aplica al personaje** (con la recuperación por dormir; si se perdieron horas de sueño, la recuperación es menor o nula y el cansancio sube).
4. Si el proyecto llegó a 100 % → victoria. Si se llega al día 30 sin completarlo → despido.

### 2.6 Eventos que consumen tiempo (del documento)

| Fase | Evento | Costo |
|---|---|---|
| Despertar | A tiempo | 0 |
| Despertar | Tarde | +0.5 h a +2 h, +cansancio |
| Despertar | Quedarse en casa | convierte horas de trabajo en tiempo libre (no se avanza el proyecto) |
| Transporte | Sin problemas | costo base |
| Transporte | Tráfico / accidente | +0.5 h a +1.5 h, +cansancio, quizás −dinero |
| Pasillo | Encontrar compañeros / distracciones | +tiempo, decisión de esquivar o no |
| Trabajo | Llegada retrasada | reponer tiempo, trabajar fin de semana, agotamiento |
| Comida | Extender | +tiempo extra al final del turno |
| Salida | Seguir trabajando | +tiempo extra; el manager pregunta |
| Noche | Multimedia | +tiempo extra, +cansancio |

---

## 3. Cansancio

### 3.1 Modelo

```ts
interface EstadoCansancio {
  valor: number;  // 0..100
}

interface ConfigCansancio {
  gastoDiario: number;   // default: +10
  umbrales: {
    normal: 40;   // 0-39: sin efectos
    cansado: 60;  // 40-59: aparecen decisiones de descanso
    critico: 80;  // 60-79: decisiones frecuentes, riesgo de errores
    colapso: 100; // 80-99: pantallas de colapso inminente; 100: final
  };
  costos: Record<string, number>;        // por actividad/evento
  recuperaciones: Record<string, number>; // dormir, comida, bebida, ropa
}
```

### 3.2 Costos (defaults propuestos)

| Fuente | Costo |
|---|---|
| Gasto fijo diario | +10 |
| Actividad de trabajo | +2 c/u |
| Despertar tarde | +5 |
| Transporte con problemas | +5 |
| No comer | +8 |
| Multimedia | +3 |
| Hora de sueño perdida | +2 c/u |
| Trabajar fin de semana | +15 |

### 3.3 Recuperaciones (defaults propuestos)

| Fuente | Recuperación |
|---|---|
| Dormir 8 h completas | −25 |
| Dormir parcial | −3 por hora dormida |
| Comida | −5 a −15 según ítem |
| Bebida | −3 a −10 según ítem |
| Ropa cómoda | −5 |

### 3.4 Umbrales y decisiones

- Al **cruzar un umbral** (40, 60, 80) se dispara una pantalla de decisión (ej. "¿seguir trabajando o descansar 30 min?").
- Con cansancio ≥ 60, los eventos aleatorios de tiempo extra son más probables (dormir mal → despertar tarde).
- Al llegar a **100** → **final de muerte por cansancio** con 3 variantes: se vuelve loco / muere y va a un isekai / se va a una montaña de ermitaño. La variante puede ser aleatoria o depender de decisiones previas (a definir).

### 3.5 Interacción tiempo ↔ cansancio

- Perder horas de sueño → +cansancio.
- Cansancio alto → más eventos de tiempo extra.
- Comer (fase de comida) → −cansancio pero +tiempo y +dinero.
- No comer → +cansancio.

### 3.6 La espiral del cansancio (diseño central)

El tiempo y el cansancio están acoplados en un ciclo de retroalimentación:

1. **Mala administración del tiempo** → horas extra que se absorben del sueño.
2. **Sueño perdido** → +cansancio (y menos recuperación al dormir).
3. **Cansancio alto** → más eventos aleatorios de tiempo extra (despertar tarde, tráfico, distracciones).
4. **Más tiempo extra** → más sueño perdido → más cansancio.

Si el jugador no regula el cansancio (comer, bebidas, ropa, dormir bien), la espiral lo lleva al **final por cansancio** antes de los 30 días.

**Happy path:** administrar bien el tiempo (no robar sueño) + regular el cansancio con ítems → se llega al día 30 con el proyecto completo y el cansancio bajo control. El juego se gana gestionando ambos recursos, no solo uno.

---

## 4. Configuración centralizada

Un solo archivo `src/config/balance.ts` con todos los números. El motor recibe la config por inyección → testable y ajustable sin tocar código.

```ts
interface BalanceConfig {
  proyecto: { dias: number; duracionRealMin: number };
  fases: Record<FaseId, { horasJuego: number; tiempoRealSeg: number }>;
  cansancio: ConfigCansancio;
  dinero: {
    transporte: Record<string, number>;
    comida: Record<string, number>;
    ropa: Record<string, number>;
  };
  eventos: Record<string, { probabilidad: number; costos: Record<string, number> }>;
}
```

---

## 5. API del motor (propuesta)

```ts
// tiempo
avanzarFase(estado, config): EstadoTiempo;
consumirTiempoExtra(estado, horas): Resultado;  // regla: libre → sueño → nuevo día

// cansancio
aplicarCosto(estado, fuente): EstadoCansancio;
aplicarRecuperacion(estado, fuente): EstadoCansancio;
cruzaUmbral(antes, despues): Umbral | null;

// día
iniciarDia(estado, config): EstadoDia;
finalizarDia(estado, config): ResultadoDia;  // suma horas del día + cansancio, descuenta del calendario, chequeo de colapso
```

---

## 6. Tests (invariantes)

- El día siempre suma 24 h de juego (default) + horas extra.
- Las horas extra se absorben en orden: libre → sueño → nuevo día.
- El calendario de 30 días es fijo: las horas extra no lo acortan, solo aumentan el cansancio vía sueño perdido.
- Perder horas de sueño aumenta el cansancio; dormir completo lo recupera.
- El tiempo real de las pantallas/decisiones no afecta el estado del juego.
- El único tiempo real que avanza el juego es el de los minijuegos de trabajo (2 × 2.5 min = 5 min = 8 h de juego).
- El cansancio nunca sale de [0, 100].
- Al llegar a 100 → final de colapso.
- Los umbrales disparan decisiones.
- Al finalizar el día, el calendario del proyecto avanza (día N → N+1) y el cansancio del día se aplica al personaje.

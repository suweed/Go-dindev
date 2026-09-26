import type { ConfigDinero } from './types';

// Defaults locales que reflejan la tabla `configuraciones` de la BD (tipo 'dinero').
// La fuente de verdad es la BD; este default se usa para desarrollo sin backend
// y como respaldo si la BD no responde.
export const CONFIG_DINERO_DEFAULT: ConfigDinero = {
  ahorroInicial: 10000,
  transporte: { a_pie: 0, camion: 60, auto: 100 },
  comida: {
    opciones: [
      { nombre: 'torta', precio: 50 },
      { nombre: 'comida corrida', precio: 100 },
      { nombre: 'restaurante', precio: 150 },
    ],
  },
  bebida: {
    opciones: [
      { nombre: 'agua', precio: 15 },
      { nombre: 'refresco', precio: 25 },
      { nombre: 'cafe', precio: 40 },
    ],
  },
  ropa: { oficina: 500, comoda: 300 },
  actividades: { tv: 0, salir: 100 },
  eventos: { accidente: 200, multa: 150, enfermedad: 300 },
};

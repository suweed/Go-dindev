export interface Transaccion {
  fuente: string;
  monto: number;
  dia: number;
}

export interface EstadoDinero {
  valor: number;
  ahorrosIniciales: number;
  historial: Transaccion[];
}

export interface OpcionComida {
  nombre: string;
  precio: number;
}

export interface OpcionBebida {
  nombre: string;
  precio: number;
}

export type TipoTransporte = 'a_pie' | 'camion' | 'auto';

export interface ConfigDinero {
  ahorroInicial: number;
  transporte: Record<TipoTransporte, number>;
  comida: { opciones: OpcionComida[] };
  bebida: { opciones: OpcionBebida[] };
  ropa: { oficina: number; comoda: number };
  actividades: { tv: number; salir: number };
  eventos: { accidente: number; multa: number; enfermedad: number };
}

export interface Resultado {
  ok: boolean;
  estado: EstadoDinero;
  error?: string;
}

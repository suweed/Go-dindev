import type { ConfigDinero, EstadoDinero, Resultado, TipoTransporte } from './types';

export function crearEstadoDinero(config: ConfigDinero): EstadoDinero {
  return {
    valor: config.ahorroInicial,
    ahorrosIniciales: config.ahorroInicial,
    historial: [],
  };
}

export function puedePagar(estado: EstadoDinero, monto: number): boolean {
  return estado.valor >= monto;
}

export function aplicarIngreso(
  estado: EstadoDinero,
  fuente: string,
  monto: number,
  dia: number,
): Resultado {
  const nuevo: EstadoDinero = {
    ...estado,
    valor: estado.valor + monto,
    historial: [...estado.historial, { fuente, monto, dia }],
  };
  return { ok: true, estado: nuevo };
}

export function aplicarGasto(
  estado: EstadoDinero,
  fuente: string,
  monto: number,
  dia: number,
): Resultado {
  if (!puedePagar(estado, monto)) {
    return { ok: false, estado, error: `No alcanza para ${fuente}` };
  }
  const nuevo: EstadoDinero = {
    ...estado,
    valor: estado.valor - monto,
    historial: [...estado.historial, { fuente, monto: -monto, dia }],
  };
  return { ok: true, estado: nuevo };
}

export function pagarTransporte(
  estado: EstadoDinero,
  tipo: TipoTransporte,
  config: ConfigDinero,
  dia: number,
): Resultado {
  return aplicarGasto(estado, `transporte_${tipo}`, config.transporte[tipo], dia);
}

export function comprarItem(
  estado: EstadoDinero,
  item: string,
  precio: number,
  dia: number,
): Resultado {
  return aplicarGasto(estado, item, precio, dia);
}

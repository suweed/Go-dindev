import { describe, it, expect } from 'vitest';
import {
  crearEstadoDinero,
  puedePagar,
  aplicarIngreso,
  aplicarGasto,
  pagarTransporte,
  comprarItem,
} from './money';
import { CONFIG_DINERO_DEFAULT } from './balance';

const config = CONFIG_DINERO_DEFAULT;

describe('motor de dinero', () => {
  it('inicia con el ahorro inicial de la config', () => {
    const estado = crearEstadoDinero(config);
    expect(estado.valor).toBe(10000);
    expect(estado.ahorrosIniciales).toBe(10000);
    expect(estado.historial).toHaveLength(0);
  });

  it('puedePagar es true si alcanza y false si no', () => {
    const estado = crearEstadoDinero(config);
    expect(puedePagar(estado, 10000)).toBe(true);
    expect(puedePagar(estado, 10001)).toBe(false);
  });

  it('aplicarGasto descuenta y registra la transacción', () => {
    const estado = crearEstadoDinero(config);
    const res = aplicarGasto(estado, 'comida', 100, 1);
    expect(res.ok).toBe(true);
    expect(res.estado.valor).toBe(9900);
    expect(res.estado.historial).toEqual([{ fuente: 'comida', monto: -100, dia: 1 }]);
  });

  it('aplicarGasto falla si no alcanza y no cambia el estado', () => {
    const estado = { ...crearEstadoDinero(config), valor: 50 };
    const res = aplicarGasto(estado, 'ropa', 500, 1);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.estado.valor).toBe(50);
    expect(res.estado.historial).toHaveLength(0);
  });

  it('aplicarIngreso suma y registra (bono)', () => {
    const estado = crearEstadoDinero(config);
    const res = aplicarIngreso(estado, 'bono', 200, 3);
    expect(res.ok).toBe(true);
    expect(res.estado.valor).toBe(10200);
    expect(res.estado.historial).toEqual([{ fuente: 'bono', monto: 200, dia: 3 }]);
  });

  it('pagarTransporte descuenta según el tipo', () => {
    const estado = crearEstadoDinero(config);
    const aPie = pagarTransporte(estado, 'a_pie', config, 1);
    expect(aPie.ok).toBe(true);
    expect(aPie.estado.valor).toBe(10000);

    const camion = pagarTransporte(estado, 'camion', config, 1);
    expect(camion.estado.valor).toBe(9940);

    const auto = pagarTransporte(estado, 'auto', config, 1);
    expect(auto.estado.valor).toBe(9900);
  });

  it('comprarItem valida el saldo y bloquea si no alcanza', () => {
    const estado = crearEstadoDinero(config);
    const ok = comprarItem(estado, 'ropa_oficina', 500, 2);
    expect(ok.ok).toBe(true);
    expect(ok.estado.valor).toBe(9500);

    const pobre = { ...crearEstadoDinero(config), valor: 100 };
    const falla = comprarItem(pobre, 'ropa_oficina', 500, 2);
    expect(falla.ok).toBe(false);
    expect(falla.estado.valor).toBe(100);
  });

  it('el dinero nunca queda negativo', () => {
    const estado = { ...crearEstadoDinero(config), valor: 0 };
    const res = aplicarGasto(estado, 'transporte', 60, 1);
    expect(res.ok).toBe(false);
    expect(res.estado.valor).toBe(0);
  });
});

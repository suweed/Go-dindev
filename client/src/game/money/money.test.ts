import { describe, it, expect } from 'vitest';
import {
  createMoneyState,
  canPay,
  addIncome,
  applyExpense,
  payTransport,
  buyItem,
} from './money';
import { DEFAULT_MONEY_CONFIG } from './balance';

const config = DEFAULT_MONEY_CONFIG;

describe('money engine', () => {
  it('starts with the initial savings from the config', () => {
    const state = createMoneyState(config);
    expect(state.value).toBe(10000);
    expect(state.initialSavings).toBe(10000);
    expect(state.history).toHaveLength(0);
  });

  it('canPay is true when enough money and false otherwise', () => {
    const state = createMoneyState(config);
    expect(canPay(state, 10000)).toBe(true);
    expect(canPay(state, 10001)).toBe(false);
  });

  it('applyExpense deducts and records the transaction', () => {
    const state = createMoneyState(config);
    const res = applyExpense(state, 'food', 100, 1);
    expect(res.ok).toBe(true);
    expect(res.state.value).toBe(9900);
    expect(res.state.history).toEqual([{ source: 'food', amount: -100, day: 1 }]);
  });

  it('applyExpense fails when there is not enough money and does not change the state', () => {
    const state = { ...createMoneyState(config), value: 50 };
    const res = applyExpense(state, 'clothes', 500, 1);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.state.value).toBe(50);
    expect(res.state.history).toHaveLength(0);
  });

  it('addIncome adds and records (bonus)', () => {
    const state = createMoneyState(config);
    const res = addIncome(state, 'bonus', 200, 3);
    expect(res.ok).toBe(true);
    expect(res.state.value).toBe(10200);
    expect(res.state.history).toEqual([{ source: 'bonus', amount: 200, day: 3 }]);
  });

  it('payTransport deducts according to the transport type', () => {
    const state = createMoneyState(config);
    const onFoot = payTransport(state, 'on_foot', config, 1);
    expect(onFoot.ok).toBe(true);
    expect(onFoot.state.value).toBe(10000);

    const bus = payTransport(state, 'bus', config, 1);
    expect(bus.state.value).toBe(9940);

    const car = payTransport(state, 'car', config, 1);
    expect(car.state.value).toBe(9900);
  });

  it('buyItem validates the balance and blocks when there is not enough', () => {
    const state = createMoneyState(config);
    const ok = buyItem(state, 'office_clothes', 500, 2);
    expect(ok.ok).toBe(true);
    expect(ok.state.value).toBe(9500);

    const poor = { ...createMoneyState(config), value: 100 };
    const fails = buyItem(poor, 'office_clothes', 500, 2);
    expect(fails.ok).toBe(false);
    expect(fails.state.value).toBe(100);
  });

  it('money never goes negative', () => {
    const state = { ...createMoneyState(config), value: 0 };
    const res = applyExpense(state, 'transport', 60, 1);
    expect(res.ok).toBe(false);
    expect(res.state.value).toBe(0);
  });
});

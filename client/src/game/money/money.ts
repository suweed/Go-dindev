import type { MoneyConfig, MoneyState, Result, TransportType } from './types';

export function createMoneyState(config: MoneyConfig): MoneyState {
  return {
    value: config.initialSavings,
    initialSavings: config.initialSavings,
    history: [],
  };
}

export function canPay(state: MoneyState, amount: number): boolean {
  return state.value >= amount;
}

export function addIncome(
  state: MoneyState,
  source: string,
  amount: number,
  day: number,
): Result {
  const next: MoneyState = {
    ...state,
    value: state.value + amount,
    history: [...state.history, { source, amount, day }],
  };
  return { ok: true, state: next };
}

export function applyExpense(
  state: MoneyState,
  source: string,
  amount: number,
  day: number,
): Result {
  if (!canPay(state, amount)) {
    return { ok: false, state, error: `Not enough money for ${source}` };
  }
  const next: MoneyState = {
    ...state,
    value: state.value - amount,
    history: [...state.history, { source, amount: -amount, day }],
  };
  return { ok: true, state: next };
}

export function payTransport(
  state: MoneyState,
  type: TransportType,
  config: MoneyConfig,
  day: number,
): Result {
  return applyExpense(state, `transport_${type}`, config.transport[type], day);
}

export function buyItem(
  state: MoneyState,
  item: string,
  price: number,
  day: number,
): Result {
  return applyExpense(state, item, price, day);
}

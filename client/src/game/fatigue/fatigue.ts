import type { FatigueConfig, FatigueResult, FatigueState, Threshold } from './types';

const MIN = 0;
const MAX = 100;

function clamp(value: number): number {
  return Math.min(MAX, Math.max(MIN, value));
}

export function createFatigueState(initialValue = 0): FatigueState {
  return { value: clamp(initialValue) };
}

export function getThreshold(state: FatigueState, config: FatigueConfig): Threshold {
  const { normal, tired, critical } = config.thresholds;
  if (state.value >= critical) return 'collapse'; // 80-100: imminent collapse / collapse
  if (state.value >= tired) return 'critical';    // 60-79
  if (state.value >= normal) return 'tired';      // 40-59
  return 'normal';                                // 0-39
}

export function isCollapsed(state: FatigueState, config: FatigueConfig): boolean {
  return state.value >= config.thresholds.collapse;
}

function getCrossedThreshold(
  before: number,
  after: number,
  config: FatigueConfig,
): Threshold | undefined {
  const { normal, tired, critical } = config.thresholds;
  if (before < critical && after >= critical) return 'collapse';
  if (before < tired && after >= tired) return 'critical';
  if (before < normal && after >= normal) return 'tired';
  return undefined;
}

export function applyCost(
  state: FatigueState,
  source: string,
  config: FatigueConfig,
): FatigueResult {
  const cost = config.costs[source] ?? 0;
  const before = state.value;
  const next = clamp(before + cost);
  return {
    ok: true,
    state: { value: next },
    crossedThreshold: getCrossedThreshold(before, next, config),
  };
}

export function applyRecovery(
  state: FatigueState,
  source: string,
  config: FatigueConfig,
): FatigueResult {
  const recovery = config.recoveries[source] ?? 0;
  const before = state.value;
  const next = clamp(before - recovery);
  return {
    ok: true,
    state: { value: next },
    crossedThreshold: getCrossedThreshold(before, next, config),
  };
}

export function applyDailyCost(state: FatigueState, config: FatigueConfig): FatigueResult {
  const before = state.value;
  const next = clamp(before + config.dailyCost);
  return {
    ok: true,
    state: { value: next },
    crossedThreshold: getCrossedThreshold(before, next, config),
  };
}

import { describe, it, expect } from 'vitest';
import {
  createFatigueState,
  getThreshold,
  isCollapsed,
  applyCost,
  applyRecovery,
  applyDailyCost,
} from './fatigue';
import { DEFAULT_FATIGUE_CONFIG } from './balance';

const config = DEFAULT_FATIGUE_CONFIG;

describe('fatigue engine', () => {
  it('starts at 0 by default', () => {
    const state = createFatigueState();
    expect(state.value).toBe(0);
  });

  it('clamps the initial value to [0, 100]', () => {
    expect(createFatigueState(-5).value).toBe(0);
    expect(createFatigueState(150).value).toBe(100);
  });

  it('applyCost adds the cost of the source', () => {
    const state = createFatigueState(10);
    const res = applyCost(state, 'wake_up_late', config);
    expect(res.ok).toBe(true);
    expect(res.state.value).toBe(15);
  });

  it('applyCost clamps at 100 and never exceeds it', () => {
    const state = createFatigueState(95);
    const res = applyCost(state, 'weekend_work', config);
    expect(res.state.value).toBe(100);
  });

  it('applyRecovery subtracts the recovery of the source', () => {
    const state = createFatigueState(50);
    const res = applyRecovery(state, 'full_sleep', config);
    expect(res.ok).toBe(true);
    expect(res.state.value).toBe(25);
  });

  it('applyRecovery clamps at 0 and never goes below', () => {
    const state = createFatigueState(10);
    const res = applyRecovery(state, 'full_sleep', config);
    expect(res.state.value).toBe(0);
  });

  it('applyDailyCost adds the daily fixed cost', () => {
    const state = createFatigueState(0);
    const res = applyDailyCost(state, config);
    expect(res.state.value).toBe(10);
  });

  it('detects crossing the tired threshold (40)', () => {
    const state = createFatigueState(35);
    const res = applyCost(state, 'wake_up_late', config);
    expect(res.crossedThreshold).toBe('tired');
    expect(res.state.value).toBe(40);
  });

  it('detects crossing the critical threshold (60)', () => {
    const state = createFatigueState(55);
    const res = applyCost(state, 'weekend_work', config);
    expect(res.crossedThreshold).toBe('critical');
    expect(res.state.value).toBe(70);
  });

  it('detects crossing the collapse threshold (80)', () => {
    const state = createFatigueState(75);
    const res = applyCost(state, 'weekend_work', config);
    expect(res.crossedThreshold).toBe('collapse');
    expect(res.state.value).toBe(90);
  });

  it('reaching 100 is a collapse', () => {
    const state = createFatigueState(95);
    const res = applyCost(state, 'weekend_work', config);
    expect(res.state.value).toBe(100);
    expect(isCollapsed(res.state, config)).toBe(true);
  });

  it('does not report a crossing when staying in the same band', () => {
    const state = createFatigueState(10);
    const res = applyCost(state, 'work_activity', config);
    expect(res.crossedThreshold).toBeUndefined();
    expect(res.state.value).toBe(12);
  });

  it('getThreshold returns the correct band', () => {
    expect(getThreshold(createFatigueState(20), config)).toBe('normal');
    expect(getThreshold(createFatigueState(50), config)).toBe('tired');
    expect(getThreshold(createFatigueState(70), config)).toBe('critical');
    expect(getThreshold(createFatigueState(90), config)).toBe('collapse');
    expect(getThreshold(createFatigueState(100), config)).toBe('collapse');
  });

  it('isCollapsed is true at 100 and false below', () => {
    expect(isCollapsed(createFatigueState(100), config)).toBe(true);
    expect(isCollapsed(createFatigueState(99), config)).toBe(false);
  });
});

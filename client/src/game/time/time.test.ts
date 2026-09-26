import { describe, it, expect } from 'vitest';
import {
  PHASE_ORDER,
  createTimeState,
  getPhaseHours,
  totalDayHours,
  advancePhase,
  consumeExtraTime,
  endDay,
} from './time';
import { DEFAULT_TIME_CONFIG } from './balance';

const config = DEFAULT_TIME_CONFIG;

describe('time engine', () => {
  it('starts on day 1 at wake_up with 0 hours', () => {
    const state = createTimeState(config);
    expect(state.day).toBe(1);
    expect(state.phase).toBe('wake_up');
    expect(state.gameHour).toBe(0);
    expect(state.dayHoursConsumed).toBe(0);
  });

  it('advancePhase moves to the next phase and adds its hours', () => {
    const state = createTimeState(config);
    const next = advancePhase(state, config);
    expect(next.phase).toBe('transport_to_work');
    expect(next.gameHour).toBe(1);
    expect(next.dayHoursConsumed).toBe(1);
  });

  it('after wake_up + transport the day has 3 hours (doc example)', () => {
    let state = createTimeState(config);
    state = advancePhase(state, config); // transport_to_work
    state = advancePhase(state, config); // office_entry
    expect(state.gameHour).toBe(3);
    expect(state.dayHoursConsumed).toBe(3);
  });

  it('advancePhase after sleep starts a new day', () => {
    let state = createTimeState(config);
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      state = advancePhase(state, config);
    }
    expect(state.day).toBe(2);
    expect(state.phase).toBe('wake_up');
    expect(state.gameHour).toBe(0);
    expect(state.dayHoursConsumed).toBe(0);
  });

  it('totalDayHours equals the sum of all phase hours', () => {
    const sum = PHASE_ORDER.reduce((acc, p) => acc + config.phases[p].gameHours, 0);
    expect(totalDayHours(config)).toBe(sum);
  });

  it('consumeExtraTime takes from free time first (no sleep lost)', () => {
    const state = createTimeState(config);
    const res = consumeExtraTime(state, 2, config);
    expect(res.hoursTakenFromFreeTime).toBe(2);
    expect(res.hoursTakenFromSleep).toBe(0);
    expect(res.lostSleepHours).toBe(0);
    expect(res.rolledToNextDay).toBe(false);
    expect(res.state.dayHoursConsumed).toBe(2);
  });

  it('consumeExtraTime takes from sleep after free time is exhausted', () => {
    const state = createTimeState(config);
    const res = consumeExtraTime(state, 5, config);
    expect(res.hoursTakenFromFreeTime).toBe(2);
    expect(res.hoursTakenFromSleep).toBe(3);
    expect(res.lostSleepHours).toBe(3);
    expect(res.rolledToNextDay).toBe(false);
  });

  it('consumeExtraTime beyond free+sleep rolls to the next day and loses all sleep', () => {
    const state = createTimeState(config);
    const res = consumeExtraTime(state, 12, config);
    expect(res.hoursTakenFromFreeTime).toBe(2);
    expect(res.hoursTakenFromSleep).toBe(8);
    expect(res.lostSleepHours).toBe(10);
    expect(res.rolledToNextDay).toBe(true);
    expect(res.state.day).toBe(2);
    expect(res.state.phase).toBe('wake_up');
  });

  it('endDay returns the summary and the next day state', () => {
    const state = { ...createTimeState(config), dayHoursConsumed: 24 };
    const summary = endDay(state, config);
    expect(summary.day).toBe(1);
    expect(summary.totalHours).toBe(24);
    expect(summary.nextState.day).toBe(2);
    expect(summary.nextState.phase).toBe('wake_up');
  });

  it('getPhaseHours returns the hours of a phase', () => {
    expect(getPhaseHours(config, 'work')).toBe(8);
    expect(getPhaseHours(config, 'free_time')).toBe(2);
  });
});

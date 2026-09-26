import { describe, it, expect } from 'vitest';
import {
  createGameState,
  decideWakeUp,
  advanceToNextPhase,
  completeWorkSession,
  decideMeal,
  decideExit,
  applyFreeTimeActivity,
  goToSleep,
  checkEndConditions,
} from './day';
import { DEFAULT_GAME_CONFIG } from './balance';

const config = DEFAULT_GAME_CONFIG;

function toWork(state: ReturnType<typeof createGameState>, cfg = config) {
  let s = decideWakeUp(state, 'go_to_work', cfg).state;
  s = advanceToNextPhase(s, cfg).state; // office_entry
  s = advanceToNextPhase(s, cfg).state; // work
  return s;
}

describe('day state machine', () => {
  it('starts on day 1 at wake_up with full resources', () => {
    const state = createGameState(config);
    expect(state.day).toBe(1);
    expect(state.phase).toBe('wake_up');
    expect(state.money.value).toBe(10000);
    expect(state.fatigue.value).toBe(0);
    expect(state.projectProgress).toBe(0);
    expect(state.wentToWork).toBe(false);
  });

  it('go_to_work advances to transport and pays the bus fare', () => {
    const res = decideWakeUp(createGameState(config), 'go_to_work', config);
    expect(res.state.phase).toBe('transport_to_work');
    expect(res.state.wentToWork).toBe(true);
    expect(res.state.money.value).toBe(9940);
    expect(res.endCondition).toBeUndefined();
  });

  it('go_to_work without money ends with out_of_money', () => {
    const broke = {
      ...createGameState(config),
      money: { value: 0, initialSavings: 10000, history: [] },
    };
    const res = decideWakeUp(broke, 'go_to_work', config);
    expect(res.endCondition).toEqual({ type: 'out_of_money' });
  });

  it('stay_home skips work and lands in free_time without progress', () => {
    const res = decideWakeUp(createGameState(config), 'stay_home', config);
    expect(res.state.phase).toBe('free_time');
    expect(res.state.wentToWork).toBe(false);
    expect(res.state.projectProgress).toBe(0);
    expect(res.state.time.dayHoursConsumed).toBe(14);
    expect(res.state.lostSleepHours).toBe(0);
  });

  it('advanceToNextPhase moves through the phases', () => {
    let state = decideWakeUp(createGameState(config), 'go_to_work', config).state;
    state = advanceToNextPhase(state, config).state;
    expect(state.phase).toBe('office_entry');
    state = advanceToNextPhase(state, config).state;
    expect(state.phase).toBe('work');
  });

  it('completeWorkSession adds progress and fatigue per minigame', () => {
    const res = completeWorkSession(toWork(createGameState(config)), config);
    expect(res.state.projectProgress).toBeCloseTo(2 * (100 / 60));
    expect(res.state.fatigue.value).toBe(4);
  });

  it('decideMeal eat costs money and recovers fatigue', () => {
    let state = toWork(createGameState(config));
    state = completeWorkSession(state, config).state; // fatigue 4
    const res = decideMeal(state, 'eat', config);
    expect(res.state.money.value).toBe(9890);
    expect(res.state.fatigue.value).toBe(0); // 4 - 10 clamped
  });

  it('decideMeal skip_meal adds fatigue', () => {
    let state = toWork(createGameState(config));
    state = completeWorkSession(state, config).state; // fatigue 4
    const res = decideMeal(state, 'skip_meal', config);
    expect(res.state.fatigue.value).toBe(12); // 4 + 8
  });

  it('decideExit leave goes to transport_home', () => {
    let state = toWork(createGameState(config));
    state = advanceToNextPhase(state, config).state; // office_exit
    const res = decideExit(state, 'leave', config);
    expect(res.state.phase).toBe('transport_home');
  });

  it('decideExit keep_working adds overtime, progress and fatigue', () => {
    let state = toWork(createGameState(config));
    state = advanceToNextPhase(state, config).state; // office_exit
    const res = decideExit(state, 'keep_working', config);
    expect(res.state.phase).toBe('transport_home');
    expect(res.state.projectProgress).toBeCloseTo(100 / 60);
    expect(res.state.fatigue.value).toBe(2);
    expect(res.state.time.dayHoursConsumed).toBe(13); // 12 + 1 overtime
  });

  it('free time tv adds multimedia fatigue', () => {
    const res = applyFreeTimeActivity(createGameState(config), 'tv', config);
    expect(res.state.fatigue.value).toBe(3);
  });

  it('free time going_out costs money and adds fatigue', () => {
    const res = applyFreeTimeActivity(createGameState(config), 'going_out', config);
    expect(res.state.money.value).toBe(9900);
    expect(res.state.fatigue.value).toBe(3);
  });

  it('end_free_time goes to sleep', () => {
    const res = applyFreeTimeActivity(createGameState(config), 'end_free_time', config);
    expect(res.state.phase).toBe('sleep');
  });

  it('goToSleep applies daily cost, full sleep recovery and advances the day', () => {
    const state = { ...createGameState(config), fatigue: { value: 30 } };
    const res = goToSleep(state, config);
    expect(res.state.day).toBe(2);
    expect(res.state.phase).toBe('wake_up');
    expect(res.state.fatigue.value).toBe(15); // 30 + 10 - 25
    expect(res.state.lostSleepHours).toBe(0);
  });

  it('goToSleep with lost sleep applies partial recovery', () => {
    const state = {
      ...createGameState(config),
      fatigue: { value: 30 },
      lostSleepHours: 2,
    };
    const res = goToSleep(state, config);
    expect(res.state.fatigue.value).toBe(22); // 30 + 10 - (6h x 3)
  });

  it('checkEndConditions detects project_complete', () => {
    const state = { ...createGameState(config), projectProgress: 100 };
    expect(checkEndConditions(state, config)).toEqual({ type: 'project_complete' });
  });

  it('checkEndConditions detects fired after day 30', () => {
    const state = { ...createGameState(config), day: 31 };
    expect(checkEndConditions(state, config)).toEqual({ type: 'fired' });
  });

  it('checkEndConditions detects fatigue_collapse at 100', () => {
    const state = { ...createGameState(config), fatigue: { value: 100 } };
    expect(checkEndConditions(state, config)).toEqual({ type: 'fatigue_collapse' });
  });

  it('full happy path completes the project', () => {
    const fast = { ...config, project: { ...config.project, progressPerMinigame: 50 } };
    let state = toWork(createGameState(fast), fast);
    state = completeWorkSession(state, fast).state;
    expect(state.projectProgress).toBe(100);
    expect(checkEndConditions(state, fast)).toEqual({ type: 'project_complete' });
  });

  it('full day flow ends on day 2 without end condition', () => {
    let state = toWork(createGameState(config));
    state = completeWorkSession(state, config).state;
    state = decideMeal(state, 'eat', config).state;
    state = advanceToNextPhase(state, config).state; // office_exit
    state = decideExit(state, 'leave', config).state; // transport_home
    state = advanceToNextPhase(state, config).state; // free_time
    state = applyFreeTimeActivity(state, 'end_free_time', config).state; // sleep
    const res = goToSleep(state, config);
    expect(res.state.day).toBe(2);
    expect(res.state.phase).toBe('wake_up');
    expect(res.endCondition).toBeUndefined();
  });
});
